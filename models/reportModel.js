const { query } = require('../config/db.config');

class ReportModel {
    static async getNextReportId(clientDate = null) {
        try {
            let datePrefix;
            
            if (clientDate && /^\d{8}$/.test(clientDate)) {
                datePrefix = clientDate;
            } else {
                const today = new Date();
                const day = String(today.getDate()).padStart(2, '0');
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const year = today.getFullYear();
                datePrefix = `${day}${month}${year}`;
            }
            
            const sqlQuery = `
                SELECT COUNT(*) as count
                FROM Report
                WHERE Report_ID LIKE @datePrefix + '%'
            `;
            const result = await query(sqlQuery, { datePrefix });
            const count = result.recordset[0].count || 0;
            
            const newReportId = `${datePrefix}${count + 1}`;
            return newReportId;
        } catch (error) {
            throw new Error(`Error getting next report ID: ${error.message}`);
        }
    }

    static async createReport(reportData) {
        try {
            const {
                reportId,
                customerId,
                customerName,
                date,
                yourRef,
                projectName,
                serviceBy,
                purposeOfVisit,
                attn
            } = reportData;

            const sqlQuery = `
                SET IDENTITY_INSERT Report ON;
                INSERT INTO Report (
                    Report_ID, Customer_ID, Customer_Name, Date, Your_Ref, Project_Name, 
                    Service_By, Purpose_Of_Visit, Attn,
                    Created_Date, Modified_Date
                ) VALUES (
                    @reportId, @customerId, @customerName, @date, @yourRef, @projectName,
                    @serviceBy, @purposeOfVisit, @attn,
                    GETDATE(), GETDATE()
                );
                SET IDENTITY_INSERT Report OFF;
            `;

            const params = {
                reportId,
                customerId,
                customerName,
                date,
                yourRef: yourRef || null,
                projectName,
                serviceBy,
                purposeOfVisit,
                attn
            };

            await query(sqlQuery, params);
            return { reportId, success: true };
        } catch (error) {
            throw new Error(`Error creating report: ${error.message}`);
        }
    }

    static async getAllReports() {
        try {
            const sqlQuery = `
                SELECT 
                    r.Report_ID,
                    r.Customer_Name,
                    r.Date,
                    r.Service_By,
                    r.Project_Name,
                    r.Your_Ref,
                    r.Attn,
                    r.Purpose_Of_Visit,
                    si.Info_ID,
                    si.Name as System_Name,
                    si.PLC_HMI,
                    si.Model_Number,
                    si.Brand,
                    si.Remarks
                FROM Report r
                LEFT JOIN Site_Information si ON r.Report_ID = si.Report_ID
                ORDER BY r.Created_Date DESC, si.Info_ID ASC
            `;
            const result = await query(sqlQuery);
            return result.recordset;
        } catch (error) {
            throw new Error(`Error getting all reports: ${error.message}`);
        }
    }

    static async searchReportsByServiceBy(serviceBy) {
        try {
            const sqlQuery = `
                SELECT r.*
                FROM Report r
                WHERE r.Service_By LIKE @serviceBy
                ORDER BY r.Created_Date DESC
            `;
            const result = await query(sqlQuery, { serviceBy: `%${serviceBy}%` });
            return result.recordset;
        } catch (error) {
            throw new Error(`Error searching reports by Service By: ${error.message}`);
        }
    }

    static async searchReports(searchTerm) {
        try {

            const isNumeric = /^\d+$/.test(searchTerm);
            
            let sqlQuery;
            let params;
            
            if (isNumeric) {
                sqlQuery = `
                    SELECT r.Report_ID, r.Customer_ID, r.Customer_Name, r.Date, r.Service_By, 
                           r.Project_Name, r.Your_Ref, r.Attn, r.Purpose_Of_Visit, 
                           r.Created_Date, r.Modified_Date,
                           STRING_AGG(si.Brand, ', ') WITHIN GROUP (ORDER BY si.Brand) AS Brands
                    FROM Report r
                    LEFT JOIN Site_Information si ON r.Report_ID = si.Report_ID
                    WHERE r.Report_ID = @searchTerm
                       OR r.Customer_Name LIKE @searchTermPattern
                       OR r.Service_By LIKE @searchTermPattern
                       OR r.Project_Name LIKE @searchTermPattern
                       OR si.Brand LIKE @searchTermPattern
                       OR CONVERT(VARCHAR, r.Date, 23) LIKE @searchTermPattern
                       OR CONVERT(VARCHAR, r.Date, 120) LIKE @searchTermPattern
                       OR CONVERT(VARCHAR, r.Date, 112) LIKE @searchTermPattern
                    GROUP BY r.Report_ID, r.Customer_ID, r.Customer_Name, r.Date, r.Service_By, 
                             r.Project_Name, r.Your_Ref, r.Attn, r.Purpose_Of_Visit, 
                             r.Created_Date, r.Modified_Date
                    ORDER BY r.Created_Date DESC
                `;
                params = { 
                    searchTerm: parseInt(searchTerm), 
                    searchTermPattern: `%${searchTerm}%`  
                };
            } else {
                sqlQuery = `
                    SELECT r.Report_ID, r.Customer_ID, r.Customer_Name, r.Date, r.Service_By, 
                           r.Project_Name, r.Your_Ref, r.Attn, r.Purpose_Of_Visit, 
                           r.Created_Date, r.Modified_Date,
                           STRING_AGG(si.Brand, ', ') WITHIN GROUP (ORDER BY si.Brand) AS Brands
                    FROM Report r
                    LEFT JOIN Site_Information si ON r.Report_ID = si.Report_ID
                    WHERE r.Customer_Name LIKE @searchTerm
                       OR r.Service_By LIKE @searchTerm
                       OR r.Project_Name LIKE @searchTerm
                       OR si.Brand LIKE @searchTerm
                    GROUP BY r.Report_ID, r.Customer_ID, r.Customer_Name, r.Date, r.Service_By, 
                             r.Project_Name, r.Your_Ref, r.Attn, r.Purpose_Of_Visit, 
                             r.Created_Date, r.Modified_Date
                    ORDER BY r.Created_Date DESC
                `;
                params = { searchTerm: `%${searchTerm}%` };
            }
            
            const result = await query(sqlQuery, params);
            return result.recordset;
        } catch (error) {
            throw new Error(`Error searching reports: ${error.message}`);
        }
    }

    static async updateReport(reportId, reportData) {
        try {
            const {
                customerId,
                customerName,
                date,
                yourRef,
                projectName,
                serviceBy,
                purposeOfVisit,
                attn
            } = reportData;

            const sqlQuery = `
                UPDATE Report SET
                    Customer_ID = @customerId,
                    Customer_Name = @customerName,
                    Date = @date,
                    Your_Ref = @yourRef,
                    Project_Name = @projectName,
                    Service_By = @serviceBy,
                    Purpose_Of_Visit = @purposeOfVisit,
                    Attn = @attn,
                    Modified_Date = GETDATE()
                WHERE Report_ID = @reportId
            `;

            const params = {
                reportId,
                customerId,
                customerName,
                date,
                yourRef: yourRef || null,
                projectName,
                serviceBy,
                purposeOfVisit,
                attn
            };

            await query(sqlQuery, params);
            return { reportId, success: true };
        } catch (error) {
            throw new Error(`Error updating report: ${error.message}`);
        }
    }

    static async deleteReport(reportId) {
        try {
            const sqlQuery = `
                DELETE FROM Report 
                WHERE Report_ID = @reportId
            `;
            await query(sqlQuery, { reportId });
            return { success: true };
        } catch (error) {
            throw new Error(`Error deleting report: ${error.message}`);
        }
    }

    static async getReportById(reportId) {
        try {
            const sqlQuery = `
                SELECT r.*
                FROM Report r
                WHERE r.Report_ID = @reportId
            `;
            const result = await query(sqlQuery, { reportId });
            return result.recordset[0] || null;
        } catch (error) {
            throw new Error(`Error getting report by ID: ${error.message}`);
        }
    }

    static async searchReportsByReportId(reportId) {
        try {
            const sqlQuery = `
                SELECT r.*
                FROM Report r
                WHERE r.Report_ID = @reportId
                ORDER BY r.Created_Date DESC
            `;
            const result = await query(sqlQuery, { reportId: parseInt(reportId) });
            return result.recordset;
        } catch (error) {
            throw new Error(`Error searching reports by Report ID: ${error.message}`);
        }
    }
}

module.exports = ReportModel;