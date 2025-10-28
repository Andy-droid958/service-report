const CustomerModel = require('../models/customerModel');

class CustomerController {

    static async searchCustomers(req, res) {
        try {
            const { q: searchTerm } = req.query;

            if (!searchTerm) {
                return res.json([]);
            }
            const customers = await CustomerModel.searchCustomers(searchTerm);
            res.json(customers);
        } catch (error) {
            console.error('Error in searchCustomers:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getCustomerIdByName(req, res) {
        try {
            const { name: customerName } = req.query;
            if (!customerName) {
                return res.status(400).json({ error: 'Customer name is required' });
            }
            const customerId = await CustomerModel.getCustomerIdByName(customerName);
            if (!customerId) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            res.json({ customerId });
        } catch (error) {
            console.error('Error in getCustomerIdByName:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getAllCustomers(req, res) {
        try {
            const customers = await CustomerModel.getAllCustomers();
            res.json(customers);
        } catch (error) {
            console.error('Error in getAllCustomers:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getCustomerById(req, res) {
        try {
            const { customer_id } = req.params;
            if (!customer_id) {
                return res.status(400).json({ error: 'Customer ID is required' });
            }
            const customer = await CustomerModel.getCustomerById(parseInt(customer_id));
            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            res.json(customer);
        } catch (error) {
            console.error('Error in getCustomerById:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = CustomerController;
