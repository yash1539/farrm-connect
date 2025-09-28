const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchant');

// M1 Procurement & Data
router.post('/procurements', merchantController.createProcurement);
router.get('/procurements', merchantController.listProcurements);
router.post('/village-data', merchantController.captureVillageData);

// M2 Input & Finance
router.post('/input-sales', merchantController.recordInputSale);
router.get('/input-sales', merchantController.listInputSales);
router.post('/finance-facilitation', merchantController.facilitateFinance);
router.post('/soil-test', merchantController.logSoilTest);
router.post('/asfs-credit', merchantController.recordAsfsCredit);

// M3 Equipment & Schemes
router.post('/equipment-rentals', merchantController.createEquipmentRental);
router.patch('/equipment-rentals/:id', merchantController.updateEquipmentRental);
router.post('/equipment-repairs', merchantController.logEquipmentRepair);
router.post('/equipment-sales', merchantController.recordEquipmentSale);

// M4 Urban Merchant
router.post('/b2b-orders', merchantController.createB2BOrder);
router.patch('/b2b-orders/:id', merchantController.updateB2BOrder);
router.get('/b2b-orders', merchantController.listB2BOrders);
router.post('/logistics', merchantController.manageLogistics);

// Extras (all roles)
router.post('/farmer-onboard', merchantController.onboardFarmer);
router.post('/demand', merchantController.createDemandForFarmer);
router.get('/earnings-alerts', merchantController.getEarningsAlerts);
router.get('/reels', merchantController.getLearningReels);

// Merchant Lead
router.get('/approvals', merchantController.listApprovals);
router.patch('/approvals/:id', merchantController.updateApproval);
router.get('/logistics-requests', merchantController.listLogisticsRequests);
router.patch('/fraud-checks/:id', merchantController.updateFraudCheck);
router.post('/cluster-quality', merchantController.logClusterQuality);

module.exports = router;
