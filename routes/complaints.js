const express = require('express');
const router = express.Router();
const complaintsController = require('../controllers/complaints');

router.post('/', complaintsController.createComplaint);
router.get('/', complaintsController.listComplaints);
router.patch('/:id', complaintsController.updateComplaint);

module.exports = router;
