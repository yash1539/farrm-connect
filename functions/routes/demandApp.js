const express = require('express');
const router = express.Router();
const demandAppController = require('../controllers/demandApp');

router.post('/bulk-demand', demandAppController.createBulkDemand);
router.get('/bulk-demand', demandAppController.listBulkDemands);
router.post('/product-tests', demandAppController.createProductTest);
router.get('/product-tests', demandAppController.listProductTests);
router.post('/policy-execution', demandAppController.createPolicyExecution);
router.get('/policy-execution', demandAppController.listPolicyExecutions);
router.post('/subscribe', demandAppController.subscribeService);
router.post('/login', demandAppController.login);
router.get('/profile', demandAppController.getProfile);

module.exports = router;
