const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const otpService = require('../services/otpService');
const { invalidateTokenCache } = require('../middleware/authMiddleware');
const log = require('../logger');

const BCRYPT_ROUNDS = 12;

// ── Validation rules ──────────────────────────────────────────────────────────
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (userId, role, tokenVersion = 0) =>
  jwt.sign({ userId, role, tv: tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Bump the user's `token_version` so every previously-issued JWT is
 * considered stale. H-3 — used by logout and password reset.
 */
const bumpTokenVersion = async (userId, client) => {
  const q = client ? client.query.bind(client) : db.query;
  await q(
    `UPDATE users SET token_version = token_version + 1, updated_at = NOW() WHERE user_id = $1`,
    [userId]
  );
};

/**
 * Validation error handler. Returns a response that matches the shape
 * used by `middleware/validation.js` so the frontend sees a consistent
 * error contract across all routes.
 */
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path || e.param, message: e.msg })),
    });
    return true;
  }
  return false;
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { email, password } = req.body;

  try {
    const result = await db.query(
      `SELECT u.user_id, u.name, u.email, u.password_hash, u.role, u.is_active, u.token_version,
              s.student_id, l.librarian_id
       FROM users u
       LEFT JOIN students s ON s.user_id = u.user_id
       LEFT JOIN librarians l ON l.user_id = u.user_id
       WHERE u.email = $1`,
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact the library.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.user_id, user.role, user.token_version || 0);

    return res.json({
      token,
      user: {
        userId:      user.user_id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        studentId:   user.student_id || null,
        librarianId: user.librarian_id || null,
      },
    });
  } catch (err) {
    log.error('auth_login_failed', { message: err.message });
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

/**
 * POST /api/auth/logout
 * Bump the user's `token_version` so the issued JWT can no longer be used
 * (H-3). Stateless JWT is now effectively invalidated server-side.
 */
const logout = async (req, res) => {
  try {
    await bumpTokenVersion(req.user.userId);
    // Invalidate the in-memory cache so the next request can't reuse the
    // old `tv` value during the cache TTL window.
    invalidateTokenCache(req.user.userId);
  } catch (err) {
    log.error('auth_logout_failed', { message: err.message, userId: req.user.userId });
  }
  res.json({ message: 'Logged out successfully' });
};

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const result = await db.query(
      `SELECT user_id, email FROM users WHERE email = $1 AND is_active = TRUE`,
      [email]
    );

    // Always return 200 even if email not found — prevents user enumeration
    if (result.rows.length) {
      const { user_id, email: userEmail } = result.rows[0];
      await otpService.generateAndSendOTP(user_id, userEmail);
    }

    return res.json({
      message: 'If an account with that email exists, an OTP has been sent.',
    });
  } catch (err) {
    log.error('auth_forgot_password_failed', { message: err.message });
    return res.status(500).json({ error: 'Failed to process request' });
  }
};

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 */
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  try {
    const userResult = await db.query(
      `SELECT user_id FROM users WHERE email = $1 AND is_active = TRUE`,
      [email]
    );

    if (!userResult.rows.length) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const { user_id } = userResult.rows[0];
    await otpService.verifyOTP(user_id, otp);

    // Issue a short-lived reset token
    const resetToken = jwt.sign(
      { userId: user_id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({ resetToken, message: 'OTP verified. Use resetToken to set new password.' });
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }
};

/**
 * POST /api/auth/reset-password
 * Header: Authorization: Bearer <resetToken>
 * Body: { password }
 */
const resetPassword = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Reset token required' });
  }

  const token = authHeader.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired reset token' });
  }

  if (payload.purpose !== 'password_reset') {
    return res.status(403).json({ error: 'Invalid token purpose' });
  }

  const { password } = req.body;
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await db.query(
    `UPDATE users SET password_hash = $1, token_version = token_version + 1, updated_at = NOW() WHERE user_id = $2`,
    [hash, payload.userId]
  );
  invalidateTokenCache(payload.userId);

  return res.json({ message: 'Password reset successfully. Please log in again.' });
};

// ── Get current user (for refreshing context) ─────────────────────────────────

/**
 * GET /api/auth/me  (protected)
 */
const getMe = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.user_id, u.name, u.email, u.role, u.phone, u.profile_image,
              u.notify_email, u.notify_web_push, u.created_at,
              s.student_id, s.enrollment_no, s.department, s.course, s.year, s.semester,
              l.librarian_id, l.staff_id, l.designation
       FROM users u
       LEFT JOIN students s ON s.user_id = u.user_id
       LEFT JOIN librarians l ON l.user_id = u.user_id
       WHERE u.user_id = $1`,
      [req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    const u = result.rows[0];
    res.json({
      userId:       u.user_id,
      name:         u.name,
      email:        u.email,
      role:         u.role,
      phone:        u.phone,
      profileImage: u.profile_image,
      notifyEmail:  u.notify_email,
      notifyWebPush: u.notify_web_push,
      createdAt:    u.created_at,
      // role-specific
      student:  u.student_id  ? { studentId: u.student_id, enrollmentNo: u.enrollment_no, department: u.department, course: u.course, year: u.year, semester: u.semester } : null,
      librarian: u.librarian_id ? { librarianId: u.librarian_id, staffId: u.staff_id, designation: u.designation } : null,
    });
  } catch (err) {
    log.error('auth_getMe_failed', { message: err.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

module.exports = {
  login,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
  resetPasswordValidation,
  getMe,
  loginValidation,
};
