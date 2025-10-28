const { query } = require('../config/db.config');
const { autocompleteCache } = require('../utils/simpleCache');

class AutocompleteController {
    static async getAttnSuggestions(req, res) {
        try {
            const { q, customer } = req.query;
            
            if (!q || q.length < 1) {
                return res.json([]);
            }

            const cacheKey = `attn:${q}:${customer || 'none'}`;
            
            const cached = autocompleteCache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            let sqlQuery = `
                SELECT DISTINCT TOP 10 Attn
                FROM Report
                WHERE Attn LIKE @searchTerm 
                  AND Attn IS NOT NULL 
                  AND Attn != ''
            `;
            
            const params = { searchTerm: `%${q}%` };
            
            if (customer && customer.trim() !== '') {
                sqlQuery += ` AND Customer_Name = @customer`;
                params.customer = customer;
            }
            
            sqlQuery += ` ORDER BY Attn`;
            
            const result = await query(sqlQuery, params);
            const suggestions = result.recordset.map(row => row.Attn);
            
            autocompleteCache.set(cacheKey, suggestions);
            
            res.json(suggestions);
        } catch (error) {
            console.error('Error getting Attn suggestions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getProjectNameSuggestions(req, res) {
        try {
            const { q, customer } = req.query;
            
            if (!q || q.length < 1) {
                return res.json([]);
            }

            const cacheKey = `project:${q}:${customer || 'none'}`;
            
            const cached = autocompleteCache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            let sqlQuery = `
                SELECT DISTINCT TOP 10 Project_Name
                FROM Report
                WHERE Project_Name LIKE @searchTerm 
                  AND Project_Name IS NOT NULL 
                  AND Project_Name != ''
            `;
            
            const params = { searchTerm: `%${q}%` };
            
            if (customer && customer.trim() !== '') {
                sqlQuery += ` AND Customer_Name = @customer`;
                params.customer = customer;
            }
            
            sqlQuery += ` ORDER BY Project_Name`;
            
            const result = await query(sqlQuery, params);
            const suggestions = result.recordset.map(row => row.Project_Name);
            
            autocompleteCache.set(cacheKey, suggestions);
            
            res.json(suggestions);
        } catch (error) {
            console.error('Error getting Project Name suggestions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getYourRefSuggestions(req, res) {
        try {
            const { q, customer } = req.query;
            
            if (!q || q.length < 1) {
                return res.json([]);
            }

            let sqlQuery = `
                SELECT DISTINCT TOP 10 Your_Ref
                FROM Report
                WHERE Your_Ref LIKE @searchTerm 
                  AND Your_Ref IS NOT NULL 
                  AND Your_Ref != ''
            `;
            
            const params = { searchTerm: `%${q}%` };
            
            if (customer && customer.trim() !== '') {
                sqlQuery += ` AND Customer_Name = @customer`;
                params.customer = customer;
            }
            
            sqlQuery += ` ORDER BY Your_Ref`;
            
            const result = await query(sqlQuery, params);
            const suggestions = result.recordset.map(row => row.Your_Ref);
            
            res.json(suggestions);
        } catch (error) {
            console.error('Error getting Your Ref suggestions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getServiceBySuggestions(req, res) {
        try {
            const { q, customer } = req.query;
            
            if (!q || q.length < 1) {
                return res.json([]);
            }

            let sqlQuery = `
                SELECT DISTINCT TOP 10 Service_By
                FROM Report
                WHERE Service_By LIKE @searchTerm 
                  AND Service_By IS NOT NULL 
                  AND Service_By != ''
            `;
            
            const params = { searchTerm: `%${q}%` };
            
            if (customer && customer.trim() !== '') {
                sqlQuery += ` AND Customer_Name = @customer`;
                params.customer = customer;
            }
            
            sqlQuery += ` ORDER BY Service_By`;
            
            const result = await query(sqlQuery, params);
            const suggestions = result.recordset.map(row => row.Service_By);
            
            res.json(suggestions);
        } catch (error) {
            console.error('Error getting Service By suggestions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getSystemNameSuggestions(req, res) {
        try {
            const { q, customer } = req.query;
            
            if (!q || q.length < 1) {
                return res.json([]);
            }

            let sqlQuery = `
                SELECT DISTINCT TOP 10 si.Name
                FROM Site_Information si
            `;
            
            const params = { searchTerm: `%${q}%` };
            
            if (customer && customer.trim() !== '') {
                sqlQuery += `
                    INNER JOIN Report r ON si.Report_ID = r.Report_ID
                    WHERE si.Name LIKE @searchTerm 
                      AND si.Name IS NOT NULL 
                      AND si.Name != ''
                      AND r.Customer_Name = @customer
                `;
                params.customer = customer;
            } else {
                sqlQuery += `
                    WHERE si.Name LIKE @searchTerm 
                      AND si.Name IS NOT NULL 
                      AND si.Name != ''
                `;
            }
            
            sqlQuery += ` ORDER BY si.Name`;
            
            const result = await query(sqlQuery, params);
            const suggestions = result.recordset.map(row => row.Name);
            
            res.json(suggestions);
        } catch (error) {
            console.error('Error getting System Name suggestions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getPlcHmiSuggestions(req, res) {
        try {
            const { q, customer } = req.query;
            
            if (!q || q.length < 1) {
                return res.json([]);
            }

            let sqlQuery = `
                SELECT DISTINCT TOP 10 si.PLC_HMI
                FROM Site_Information si
            `;
            
            const params = { searchTerm: `%${q}%` };
            
            if (customer && customer.trim() !== '') {
                sqlQuery += `
                    INNER JOIN Report r ON si.Report_ID = r.Report_ID
                    WHERE si.PLC_HMI LIKE @searchTerm 
                      AND si.PLC_HMI IS NOT NULL 
                      AND si.PLC_HMI != ''
                      AND r.Customer_Name = @customer
                `;
                params.customer = customer;
            } else {
                sqlQuery += `
                    WHERE si.PLC_HMI LIKE @searchTerm 
                      AND si.PLC_HMI IS NOT NULL 
                      AND si.PLC_HMI != ''
                `;
            }
            
            sqlQuery += ` ORDER BY si.PLC_HMI`;
            
            const result = await query(sqlQuery, params);
            const suggestions = result.recordset.map(row => row.PLC_HMI);
            
            res.json(suggestions);
        } catch (error) {
            console.error('Error getting PLC/HMI suggestions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getBrandSuggestions(req, res) {
        try {
            const { q, customer } = req.query;
            
            if (!q || q.length < 1) {
                return res.json([]);
            }

            let sqlQuery = `
                SELECT DISTINCT TOP 10 si.Brand
                FROM Site_Information si
            `;
            
            const params = { searchTerm: `%${q}%` };
            
            if (customer && customer.trim() !== '') {
                sqlQuery += `
                    INNER JOIN Report r ON si.Report_ID = r.Report_ID
                    WHERE si.Brand LIKE @searchTerm 
                      AND si.Brand IS NOT NULL 
                      AND si.Brand != ''
                      AND r.Customer_Name = @customer
                `;
                params.customer = customer;
            } else {
                sqlQuery += `
                    WHERE si.Brand LIKE @searchTerm 
                      AND si.Brand IS NOT NULL 
                      AND si.Brand != ''
                `;
            }
            
            sqlQuery += ` ORDER BY si.Brand`;
            
            const result = await query(sqlQuery, params);
            const suggestions = result.recordset.map(row => row.Brand);
            
            res.json(suggestions);
        } catch (error) {
            console.error('Error getting Brand suggestions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getModelNumberSuggestions(req, res) {
        try {
            const { q, customer } = req.query;
            
            if (!q || q.length < 1) {
                return res.json([]);
            }

            let sqlQuery = `
                SELECT DISTINCT TOP 10 si.Model_Number
                FROM Site_Information si
            `;
            
            const params = { searchTerm: `%${q}%` };
            
            if (customer && customer.trim() !== '') {
                sqlQuery += `
                    INNER JOIN Report r ON si.Report_ID = r.Report_ID
                    WHERE si.Model_Number LIKE @searchTerm 
                      AND si.Model_Number IS NOT NULL 
                      AND si.Model_Number != ''
                      AND r.Customer_Name = @customer
                `;
                params.customer = customer;
            } else {
                sqlQuery += `
                    WHERE si.Model_Number LIKE @searchTerm 
                      AND si.Model_Number IS NOT NULL 
                      AND si.Model_Number != ''
                `;
            }
            
            sqlQuery += ` ORDER BY si.Model_Number`;
            
            const result = await query(sqlQuery, params);
            const suggestions = result.recordset.map(row => row.Model_Number);
            
            res.json(suggestions);
        } catch (error) {
            console.error('Error getting Model Number suggestions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getRemarksSuggestions(req, res) {
        try {
            const { q } = req.query;
            
            if (!q || q.length < 1) {
                return res.json([]);
            }

            const sqlQuery = `
                SELECT DISTINCT TOP 10 Remarks
                FROM Site_Information
                WHERE Remarks LIKE @searchTerm 
                  AND Remarks IS NOT NULL 
                  AND Remarks != ''
                ORDER BY Remarks
            `;
            
            const result = await query(sqlQuery, { searchTerm: `%${q}%` });
            const suggestions = result.recordset.map(row => row.Remarks);
            
            res.json(suggestions);
        } catch (error) {
            console.error('Error getting Remarks suggestions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = AutocompleteController;

