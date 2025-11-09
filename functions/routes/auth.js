const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const {
  validateSignup,
  validateSignin,
  validateSendOTP,
  validateVerifyOTP
} = require('../middleware/validation');
const { rateLimitMiddleware } = require('../utils/rateLimiter');

// Sign Up
router.post('/signup', validateSignup, authController.signup);

// Sign In (Email/Password or Phone/OTP)
router.post('/signin', validateSignin, rateLimitMiddleware(5, 15 * 60 * 1000), authController.signin);

// Send OTP
router.post('/send-otp', validateSendOTP, rateLimitMiddleware(3, 15 * 60 * 1000), authController.sendOTP);

// Verify OTP
router.post('/verify-otp', validateVerifyOTP, rateLimitMiddleware(3, 15 * 60 * 1000), authController.verifyOTP);

// Get Profile
router.get('/profile', authController.getProfile);

// Update Consent
router.patch('/consent', authController.updateConsent);

module.exports = router;
