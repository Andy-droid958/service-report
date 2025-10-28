const express = require('express');
const router = express.Router();
const ReminderController = require('../controllers/reminderController');

router.post('/', ReminderController.createReminder);

router.get('/', ReminderController.getAllReminders);

router.get('/pending', ReminderController.getPendingReminders);

router.get('/statistics', ReminderController.getStatistics);

router.get('/staff', ReminderController.getRemindersByStaff);

router.get('/detail/:detailId', ReminderController.checkReminderByDetailId);

router.get('/:id', ReminderController.getReminderById);

router.put('/:id', ReminderController.updateReminder);

router.delete('/:id', ReminderController.deleteReminder);

router.post('/test/send', ReminderController.testSend);
router.get('/test/connection', ReminderController.testConnection);

module.exports = router;

