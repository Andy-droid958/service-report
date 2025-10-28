const express = require('express');
const router = express.Router();
const TelegramConnectionController = require('../controllers/telegramConnectionController');

router.post('/connect', TelegramConnectionController.connectStaff);

router.get('/status', TelegramConnectionController.getConnectionStatus);

router.get('/connection/:staffName', TelegramConnectionController.getStaffConnection);

router.post('/disconnect', TelegramConnectionController.disconnectStaff);

router.get('/connected', TelegramConnectionController.getAllConnectedStaff);

router.get('/bot-info', TelegramConnectionController.getBotInfo);

module.exports = router;

