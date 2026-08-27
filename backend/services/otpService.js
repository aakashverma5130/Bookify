const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');
const { sendEmail } = require('./notificationService');

const OTP_EXPIRY_MINUTES = 10;
const BCRYPT_ROUNDS = 12;

/**
 * Generate a 6-digit OTP, hash it, store in DB, and email it to the user.
 * @param {string} userId
 * @param {string} email
 */
const generateAndSendOTP = async (userId, email) => {
  // Invalidate any existing unused tokens for this user
  await db.query(
    `UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE`,
    [userId]
  );

  // Generate a random 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.query(
    `INSERT INTO password_reset_tokens (user_id, otp_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, otpHash, expiresAt]
  );

  await sendEmail({
    to: email,
    subject: 'Booksphere — Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}\n\nThis OTP expires in ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#312e81">Booksphere Password Reset</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4338ca;padding:16px;background:#f0f4ff;border-radius:4px;text-align:center">${otp}</div>
        <p style="color:#6b7280;font-size:14px">This OTP expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color:#6b7280;font-size:14px">If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Verify an OTP submission.
 * Returns the userId if valid; throws on failure.
 * @param {string} userId
 * @param {string} otp - plain OTP submitted by user
 */
const verifyOTP = async (userId, otp) => {
  const result = await db.query(
    `SELECT token_id, otp_hash, expires_at, used
     FROM password_reset_tokens
     WHERE user_id = $1 AND used = FALSE
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (!result.rows.length) {
    throw Object.assign(new Error('No active OTP found'), { status: 400 });
  }

  const token = result.rows[0];

  if (new Date() > new Date(token.expires_at)) {
    throw Object.assign(new Error('OTP has expired'), { status: 400 });
  }

  const valid = await bcrypt.compare(otp, token.otp_hash);
  if (!valid) {
    throw Object.assign(new Error('Invalid OTP'), { status: 400 });
  }

  // Mark token as used
  await db.query(
    `UPDATE password_reset_tokens SET used = TRUE WHERE token_id = $1`,
    [token.token_id]
  );

  return userId;
};

module.exports = { generateAndSendOTP, verifyOTP };
