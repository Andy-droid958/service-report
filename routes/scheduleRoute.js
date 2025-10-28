const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.get('/staff', scheduleController.getAllStaff);
router.get('/schedule', scheduleController.getStaffSchedule);
router.get('/report-dates', scheduleController.getStaffReportDates);
router.get('/statistics', scheduleController.getStaffStatistics);
router.get('/reports-by-date', scheduleController.getStaffReportsByDate);

module.exports = router;

