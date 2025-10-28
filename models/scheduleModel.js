const { query } = require('../config/db.config');

async function getAllStaff() {
    try {
        const sqlQuery = `
            SELECT DISTINCT Service_By 
            FROM Report 
            WHERE Service_By IS NOT NULL AND Service_By != ''
            ORDER BY Service_By
        `;
        
        const result = await query(sqlQuery);
        return result.recordset;
    } catch (error) {
        console.error('Error fetching staff list:', error);
        throw error;
    }
}

async function getStaffSchedule(serviceBy, startDate, endDate) {
    try {
        const sqlQuery = `
            SELECT 
                r.Report_ID,
                d.Date,
                r.Customer_Name,
                r.Your_Ref,
                r.Project_Name,
                r.Service_By,
                r.Purpose_Of_Visit,
                r.Attn,
                d.Start_Time,
                d.End_Time,
                d.Work_Time_hr,
                d.Problem_Details,
                d.Job_Description,
                d.Detail_ID,
                d.Out_Time,
                d.In_Time,
                d.Travel_Time_hr,
                d.Over_Time_hr,
                d.Mileage,
                d.Toll_Amount,
                d.Hotel_Amount,
                d.Others
            FROM Details d
            INNER JOIN Report r ON d.Report_ID = r.Report_ID
            WHERE r.Service_By = @serviceBy
                AND d.Date >= @startDate
                AND d.Date <= @endDate
            ORDER BY d.Date DESC, d.Start_Time
        `;
        
        const result = await query(sqlQuery, {
            serviceBy,
            startDate,
            endDate
        });
        
        return result.recordset;
    } catch (error) {
        console.error('Error fetching staff schedule:', error);
        throw error;
    }
}

async function getStaffReportDates(serviceBy, startDate, endDate) {
    try {
        const sqlQuery = `
            SELECT 
                CAST(d.Date AS DATE) as ReportDate,
                COUNT(DISTINCT r.Report_ID) as ReportCount
            FROM Details d
            INNER JOIN Report r ON d.Report_ID = r.Report_ID
            WHERE r.Service_By = @serviceBy
                AND d.Date >= @startDate
                AND d.Date <= @endDate
            GROUP BY CAST(d.Date AS DATE)
            ORDER BY ReportDate
        `;
        
        const result = await query(sqlQuery, {
            serviceBy,
            startDate,
            endDate
        });
        
        return result.recordset;
    } catch (error) {
        console.error('Error fetching report dates:', error);
        throw error;
    }
}

async function getStaffStatistics() {
    try {
        const sqlQuery = `
            SELECT 
                r.Service_By,
                COUNT(DISTINCT r.Report_ID) as TotalReports
            FROM Report r
            WHERE r.Service_By IS NOT NULL AND r.Service_By != ''
            GROUP BY r.Service_By
            ORDER BY TotalReports DESC, r.Service_By
        `;
        
        const result = await query(sqlQuery);
        return result.recordset;
    } catch (error) {
        console.error('Error fetching staff statistics:', error);
        throw error;
    }
}

async function getStaffReportsByDate(serviceBy, startDate, endDate) {
    try {
        const sqlQuery = `
            SELECT 
                r.Report_ID,
                CAST(r.Date AS DATE) as Date,
                r.Customer_Name,
                r.Project_Name,
                r.Service_By
            FROM Report r
            WHERE r.Service_By = @serviceBy
                AND r.Date >= @startDate
                AND r.Date <= @endDate
            ORDER BY r.Date DESC
        `;
        
        const result = await query(sqlQuery, {
            serviceBy,
            startDate,
            endDate
        });
        
        return result.recordset;
    } catch (error) {
        console.error('Error fetching staff reports by date:', error);
        throw error;
    }
}

module.exports = {
    getAllStaff,
    getStaffSchedule,
    getStaffReportDates,
    getStaffStatistics,
    getStaffReportsByDate
};

