const express = require('express');
const router = express.Router();
const hqController = require('../controllers/hq');

router.get('/analytics', hqController.getAnalytics);
router.get('/forecast', hqController.getForecast);
router.get('/policy-reports', hqController.getPolicyReports);

module.exports = router;
