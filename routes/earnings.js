const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earnings');

router.get('/', earningsController.getEarnings);
router.post('/expense', earningsController.addExpense);
router.post('/income', earningsController.addIncome);
router.get('/reminders', earningsController.getReminders);

module.exports = router;
