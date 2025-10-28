const { query } = require('../config/db.config');

class CustomerModel {
    static async searchCustomers(searchTerm) {
        try {
            const sqlQuery = `
                SELECT Customer_Name 
                FROM Customer 
                WHERE Customer_Name LIKE @searchTerm 
                ORDER BY Customer_Name
            `;
            const result = await query(sqlQuery, { searchTerm: `%${searchTerm}%` });
            return result.recordset.map(row => row.Customer_Name);
        } catch (error) {
            throw new Error(`Error searching customers: ${error.message}`);
        }
    }

    static async getCustomerIdByName(customerName) {
        try {
            const sqlQuery = `
                SELECT Customer_ID 
                FROM Customer 
                WHERE Customer_Name = @customerName
            `;
            const result = await query(sqlQuery, { customerName });
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            return result.recordset[0].Customer_ID;
        } catch (error) {
            throw new Error(`Error getting customer ID: ${error.message}`);
        }
    }

    static async getAllCustomers() {
        try {
            const sqlQuery = `
                SELECT Customer_ID, Customer_Name 
                FROM Customer 
                ORDER BY Customer_Name
            `;
            const result = await query(sqlQuery);
            return result.recordset;
        } catch (error) {
            throw new Error(`Error getting all customers: ${error.message}`);
        }
    }

    static async getCustomerById(customerId) {
        try {
            const sqlQuery = `
                SELECT Customer_ID, Customer_Name 
                FROM Customer 
                WHERE Customer_ID = @customerId
            `;
            const result = await query(sqlQuery, { customerId });
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            return result.recordset[0];
        } catch (error) {
            throw new Error(`Error getting customer by ID: ${error.message}`);
        }
    }

    static async createCustomer(customerName) {
        try {
            const sqlQuery = `
                INSERT INTO Customer (Customer_Name)
                VALUES (@customerName);
                SELECT SCOPE_IDENTITY() as Customer_ID;
            `;
            const result = await query(sqlQuery, { customerName });
            
            if (result.recordset.length === 0) {
                throw new Error('Failed to create customer');
            }
            
            return result.recordset[0].Customer_ID;
        } catch (error) {
            throw new Error(`Error creating customer: ${error.message}`);
        }
    }
}

module.exports = CustomerModel;
