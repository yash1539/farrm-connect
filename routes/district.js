const express = require('express');
const router = express.Router();
const districtController = require('../controllers/district');

router.get('/warehouse-stock', districtController.getWarehouseStock);
router.get('/demand-supply', districtController.getDemandSupply);
router.get('/payments', districtController.getPayments);
router.get('/analytics', districtController.getAnalytics);
router.get('/route-planning', districtController.getRoutePlanning);

module.exports = router;
