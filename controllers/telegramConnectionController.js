const StaffTelegramModel = require('../models/staffTelegramModel');
const telegramBot = require('../utils/telegramBot');

class TelegramConnectionController {
    static async connectStaff(req, res) {
        try {
            const { staffName, chatId, connectionCode } = req.body;

            if (!staffName || !chatId || !connectionCode) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: staffName, chatId, connectionCode'
                });
            }
            const isValid = await telegramBot.verifyConnectionCode(chatId, connectionCode);
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid or expired connection code. Please send /start to the bot again.'
                });
            }

            await StaffTelegramModel.registerStaffTelegram(staffName, chatId);

            await telegramBot.sendMessage(chatId, `Successfully connected! You'll now receive reminders as *${staffName}*.`);

            res.json({
                success: true,
                message: 'Telegram connected successfully'
            });
        } catch (error) {
            console.error('Error connecting staff Telegram:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to connect Telegram'
            });
        }
    }

    static async getConnectionStatus(req, res) {
        try {
            const { staffName } = req.query;

            if (!staffName) {
                return res.status(400).json({
                    success: false,
                    error: 'Staff name is required'
                });
            }

            const connection = await StaffTelegramModel.getStaffTelegram(staffName);

            res.json({
                success: true,
                connected: !!connection,
                data: connection ? {
                    username: connection.Telegram_Username,
                    connectedAt: connection.Connected_At
                } : null
            });
        } catch (error) {
            console.error('Error getting connection status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get connection status'
            });
        }
    }

    static async disconnectStaff(req, res) {
        try {
            const { staffName } = req.body;

            if (!staffName) {
                return res.status(400).json({
                    success: false,
                    error: 'Staff name is required'
                });
            }

            await StaffTelegramModel.disconnectStaff(staffName);

            res.json({
                success: true,
                message: 'Telegram disconnected successfully'
            });
        } catch (error) {
            console.error('Error disconnecting staff Telegram:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to disconnect Telegram'
            });
        }
    }

    static async getAllConnectedStaff(req, res) {
        try {
            const connectedStaff = await StaffTelegramModel.getAllConnectedStaff();

            res.json({
                success: true,
                data: connectedStaff,
                count: connectedStaff.length
            });
        } catch (error) {
            console.error('Error getting connected staff:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get connected staff'
            });
        }
    }

    static async getBotInfo(req, res) {
        try {
            if (!telegramBot.isInitialized) {
                return res.status(503).json({
                    success: false,
                    error: 'Telegram bot not initialized'
                });
            }

            const me = await telegramBot.bot.getMe();
            const botLink = `https://t.me/${me.username}`;

            res.json({
                success: true,
                data: {
                    username: me.username,
                    botLink: botLink,
                    firstName: me.first_name
                }
            });
        } catch (error) {
            console.error('Error getting bot info:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get bot info'
            });
        }
    }

    static async getStaffConnection(req, res) {
        try {
            const { staffName } = req.params;

            if (!staffName) {
                return res.status(400).json({
                    success: false,
                    error: 'Staff name is required'
                });
            }

            const connection = await StaffTelegramModel.getStaffTelegram(decodeURIComponent(staffName));

            res.json({
                success: true,
                connected: !!connection,
                data: connection || null
            });
        } catch (error) {
            console.error('Error getting staff connection:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get staff connection'
            });
        }
    }
}

module.exports = TelegramConnectionController;

