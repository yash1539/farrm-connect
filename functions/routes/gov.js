const express = require('express');
const router = express.Router();
const govController = require('../controllers/gov');

router.get('/forms', govController.listForms);
router.post('/forms', govController.submitForm);
router.post('/legal-support', govController.createLegalSupport);
router.get('/legal-support', govController.trackLegalSupport);

module.exports = router;
