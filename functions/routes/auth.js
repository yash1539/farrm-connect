const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.post('/signup', authController.signup);
router.post('/verify', authController.verify);
router.get('/profile', authController.getProfile);
router.patch('/consent', authController.updateConsent);

module.exports = router;
