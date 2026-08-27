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

router.post('/login',          credentialLimiter, authController.loginValidation,          authController.login);
router.post('/logout',         authenticate,                                       authController.logout);
router.post('/forgot-password',credentialLimiter,                                   authController.forgotPassword);
router.post('/verify-otp',     credentialLimiter,                                   authController.verifyOtp);
router.post('/reset-password', authController.resetPasswordValidation,              authController.resetPassword);
router.get('/me',              authenticate,                                        authController.getMe);

module.exports = router;
