const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/search', customerController.searchCustomers);
router.get('/id', customerController.getCustomerIdByName);
router.get('/getAllCustomers', customerController.getAllCustomers);
router.get('/getCustomerById/:customer_id', customerController.getCustomerById);

module.exports = router;
