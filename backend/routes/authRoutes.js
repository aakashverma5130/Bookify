const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/login',          authController.loginValidation,          authController.login);
router.post('/logout',         authenticate,                             authController.logout);
router.post('/forgot-password',                                          authController.forgotPassword);
router.post('/verify-otp',                                               authController.verifyOtp);
router.post('/reset-password', authController.resetPasswordValidation,  authController.resetPassword);
router.get('/me',              authenticate,                             authController.getMe);

module.exports = router;
