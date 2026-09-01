const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Rate limiter for credential-checking endpoints (login, forgot-password,
// verify-otp). Only FAILED attempts count toward the limit — successful
// logins are free. This protects against brute-force attacks on bad
// passwords without locking out legitimate users on consecutive logins.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many failed login attempts. Please wait 15 minutes and try again.' },
});

// M-7: per-email OTP request limiter. The generic credential limiter
// only triggers on failed attempts, but forgot-password always returns
// 200 to prevent user enumeration — so we need a separate limit keyed
// to the requested email address. 5 OTP requests per hour per email.
const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      5,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator: (req) => `otp:${(req.body?.email || '').toLowerCase()}`,
  message: { error: 'Too many OTP requests for this email. Please wait an hour.' },
});

router.post('/login',          credentialLimiter, authController.loginValidation,          authController.login);
router.post('/logout',         authenticate,                                       authController.logout);
router.post('/forgot-password',credentialLimiter, otpRequestLimiter,                  authController.forgotPassword);
router.post('/verify-otp',     credentialLimiter,                                   authController.verifyOtp);
router.post('/reset-password', authController.resetPasswordValidation,              authController.resetPassword);
router.get('/me',              authenticate,                                        authController.getMe);

module.exports = router;
