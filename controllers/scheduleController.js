const scheduleModel = require('../models/scheduleModel');

async function getAllStaff(req, res) {
    try {
        console.log('Fetching all staff members...');
        const staff = await scheduleModel.getAllStaff();
        
        console.log(`Found ${staff.length} staff members`);
        res.json({ 
            success: true, 
            data: staff 
        });
    } catch (error) {
        console.error('Error in getAllStaff controller:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch staff list' 
        });
    }
}

async function getStaffSchedule(req, res) {
    try {
        const { serviceBy, startDate, endDate } = req.query;
        
        if (!serviceBy || !startDate || !endDate) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required parameters: serviceBy, startDate, endDate' 
            });
        }
        
        console.log('Fetching schedule for:', { serviceBy, startDate, endDate });
        
        const schedule = await scheduleModel.getStaffSchedule(serviceBy, startDate, endDate);
        
        console.log(`Found ${schedule.length} schedule entries`);
   
        if (schedule.length > 0) {
            console.log('Sample schedule entry:', {
                Report_ID: schedule[0].Report_ID,
                Date: schedule[0].Date,
                Customer_Name: schedule[0].Customer_Name
            });
        }
        
        res.json({ 
            success: true, 
            data: schedule 
        });
    } catch (error) {
        console.error('Error in getStaffSchedule controller:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch staff schedule' 
        });
    }
}

async function getStaffReportDates(req, res) {
    try {
        const { serviceBy, startDate, endDate } = req.query;
        
        if (!serviceBy || !startDate || !endDate) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required parameters: serviceBy, startDate, endDate' 
            });
        }
        
        console.log('Fetching report dates for:', { serviceBy, startDate, endDate });
        
        const dates = await scheduleModel.getStaffReportDates(serviceBy, startDate, endDate);
        
        console.log(`Found ${dates.length} dates with reports`);
        res.json({ 
            success: true, 
            data: dates 
        });
    } catch (error) {
        console.error('Error in getStaffReportDates controller:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch report dates' 
        });
    }
}

async function getStaffStatistics(req, res) {
    try {
        console.log('Fetching staff statistics...');
        const statistics = await scheduleModel.getStaffStatistics();
        
        console.log(`Found statistics for ${statistics.length} staff members`);
        res.json({ 
            success: true, 
            data: statistics 
        });
    } catch (error) {
        console.error('Error in getStaffStatistics controller:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch staff statistics' 
        });
    }
}

async function getStaffReportsByDate(req, res) {
    try {
        const { serviceBy, startDate, endDate } = req.query;
        
        if (!serviceBy || !startDate || !endDate) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required parameters: serviceBy, startDate, endDate' 
            });
        }
        
        console.log('Fetching staff reports by date for:', { serviceBy, startDate, endDate });
        
        const reports = await scheduleModel.getStaffReportsByDate(serviceBy, startDate, endDate);
        
        console.log(`Found ${reports.length} reports`);
        res.json({ 
            success: true, 
            data: reports 
        });
    } catch (error) {
        console.error('Error in getStaffReportsByDate controller:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch staff reports by date' 
        });
    }
}

module.exports = {
    getAllStaff,
    getStaffSchedule,
    getStaffReportDates,
    getStaffStatistics,
    getStaffReportsByDate
};

