const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance');

router.post('/apply', financeController.applyFinance);
router.get('/status', financeController.trackStatus);
router.post('/scan', financeController.uploadDocs);
router.post('/qr-bill', financeController.qrBilling);

module.exports = router;
