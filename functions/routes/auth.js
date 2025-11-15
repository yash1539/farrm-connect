const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const {
  validateSignup,
  validateSignin,
  validateSendOTP,
  validateVerifyOTP,
  validateProfileUpdate
} = require('../middleware/validation');
const { rateLimitMiddleware } = require('../utils/rateLimiter');
const { authenticate } = require('../middleware/auth');

// Sign Up
router.post('/signup', validateSignup, authController.signup);

// Sign In (Email/Password or Phone/OTP)
router.post('/signin', validateSignin, rateLimitMiddleware(5, 15 * 60 * 1000), authController.signin);

// Refresh Token
router.post('/refresh-token', authController.refreshToken);

// Send OTP
router.post('/send-otp', validateSendOTP, rateLimitMiddleware(3, 15 * 60 * 1000), authController.sendOTP);

// Verify OTP
router.post('/verify-otp', validateVerifyOTP, rateLimitMiddleware(3, 15 * 60 * 1000), authController.verifyOTP);

// Get My Profile (authenticated user only)
router.get('/me', authenticate, authController.getMe);

// Get Profile (supports both authenticated and query parameter)
router.get('/profile', authController.getProfile);

// Update Profile (requires authentication)
router.put('/profile', authenticate, validateProfileUpdate, authController.updateProfile);

// Update Consent
router.patch('/consent', authController.updateConsent);

module.exports = router;
