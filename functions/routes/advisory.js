const express = require('express');
const router = express.Router();
const advisoryController = require('../controllers/advisory');

router.post('/detect-disease', advisoryController.detectDisease);
router.get('/price-trends', advisoryController.priceTrends);
router.get('/input-recommendations', advisoryController.inputRecommendations);
router.get('/mandi-prices', advisoryController.mandiPrices);

module.exports = router;
