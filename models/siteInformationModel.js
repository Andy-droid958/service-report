const { query } = require('../config/db.config');

class SiteInformationModel {
    static async createSiteInformation(reportId, siteInformationData) {
        try {
            const {
                name,
                plcHmi,
                modelNumber,
                brand,
                remarks
            } = siteInformationData;

            const sqlQuery = `
                INSERT INTO Site_Information (
                    Report_ID, Name, PLC_HMI, Model_Number, Brand, Remarks
                ) VALUES (
                    @reportId, @name, @plcHmi, @modelNumber, @brand, @remarks
                );
                SELECT SCOPE_IDENTITY() as Info_ID;
            `;

            const params = {
                reportId,
                name: name || null,
                plcHmi: plcHmi || null,
                modelNumber: modelNumber || null,
                brand: brand || null,
                remarks: remarks || null
            };

            const result = await query(sqlQuery, params);
            return result.recordset[0].Info_ID;
        } catch (error) {
            throw new Error(`Error creating site information: ${error.message}`);
        }
    }

    static async getSiteInformationByReportId(reportId) {
        try {
            const sqlQuery = `
                SELECT Info_ID, Report_ID, Name, PLC_HMI, Model_Number, Brand, Remarks
                FROM Site_Information 
                WHERE Report_ID = @reportId
                ORDER BY Info_ID
            `;
            const result = await query(sqlQuery, { reportId });
            return result.recordset;
        } catch (error) {
            throw new Error(`Error getting site information: ${error.message}`);
        }
    }

    static async updateSiteInformation(infoId, siteInformationData) {
        try {
            const {
                name,
                plcHmi,
                modelNumber,
                brand,
                remarks
            } = siteInformationData;

            const sqlQuery = `
                UPDATE Site_Information SET
                    Name = @name,
                    PLC_HMI = @plcHmi,
                    Model_Number = @modelNumber,
                    Brand = @brand,
                    Remarks = @remarks
                WHERE Info_ID = @infoId
            `;

            const params = {
                infoId,
                name: name || null,
                plcHmi: plcHmi || null,
                modelNumber: modelNumber || null,
                brand: brand || null,
                remarks: remarks || null
            };

            await query(sqlQuery, params);
            return { success: true };
        } catch (error) {
            throw new Error(`Error updating site information: ${error.message}`);
        }
    }

    static async deleteSiteInformation(infoId) {
        try {
            const sqlQuery = `
                DELETE FROM Site_Information 
                WHERE Info_ID = @infoId
            `;
            await query(sqlQuery, { infoId });
            return { success: true };
        } catch (error) {
            throw new Error(`Error deleting site information: ${error.message}`);
        }
    }

    static async deleteSiteInformationByReportId(reportId) {
        try {
            const sqlQuery = `
                DELETE FROM Site_Information 
                WHERE Report_ID = @reportId
            `;
            await query(sqlQuery, { reportId });
            return { success: true };
        } catch (error) {
            throw new Error(`Error deleting site information by report ID: ${error.message}`);
        }
    }
}

module.exports = SiteInformationModel;
