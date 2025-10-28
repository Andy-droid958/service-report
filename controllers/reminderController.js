const ReminderModel = require('../models/reminderModel');
const StaffTelegramModel = require('../models/staffTelegramModel');
const telegramBot = require('../utils/telegramBot');

class ReminderController {

    static async createReminder(req, res) {
        try {
            const { staffName, message, scheduledTime, detailId } = req.body;

            if (!staffName || !message || !scheduledTime) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: staffName, message, scheduledTime'
                });
            }

            if (detailId) {
                const existingReminder = await ReminderModel.getReminderByDetailId(detailId);
                if (existingReminder) {
                    return res.status(400).json({
                        success: false,
                        error: `This schedule detail already has a reminder (ID: ${existingReminder.Reminder_ID}). Each detail can only have one reminder.`,
                        existingReminder: {
                            reminderId: existingReminder.Reminder_ID,
                            scheduledTime: existingReminder.Scheduled_Time,
                            status: existingReminder.Status
                        }
                    });
                }
            }

            const staffTelegram = await StaffTelegramModel.getStaffTelegram(staffName);
            if (!staffTelegram) {
                return res.status(400).json({
                    success: false,
                    error: `${staffName} has not connected their Telegram. Please ask them to connect first.`
                });
            }

            const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
            if (!dateTimeRegex.test(scheduledTime)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid scheduled time format. Expected: YYYY-MM-DD HH:MM:SS'
                });
            }

            console.log(`Scheduling reminder for ${staffName} at ${scheduledTime} (local server time)`);
            console.log(`Will send to Telegram chat ID: ${staffTelegram.Telegram_Chat_ID}`);
            if (detailId) {
                console.log(`Linking reminder to Detail_ID: ${detailId}`);
            }

            const reminderId = await ReminderModel.createReminder({
                staffName,
                staffTelegramId: staffTelegram.Telegram_Chat_ID,
                message,
                scheduledTime: scheduledTime,
                detailId: detailId || null
            });

            res.json({
                success: true,
                message: `Reminder created successfully and will be sent to ${staffName}'s Telegram`,
                data: { 
                    reminderId,
                    detailId: detailId || null
                }
            });
        } catch (error) {
            console.error('Error in createReminder controller:', error);

            if (error.message && error.message.includes('unique') || error.message.includes('duplicate')) {
                return res.status(400).json({
                    success: false,
                    error: 'This schedule detail already has a reminder. Each detail can only have one reminder.'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Failed to create reminder'
            });
        }
    }

    static async getAllReminders(req, res) {
        try {
            const { status, staffName, detailId } = req.query;

            const filters = {};
            if (status) filters.status = status;
            if (staffName) filters.staffName = staffName;
            if (detailId) filters.detailId = detailId;

            const reminders = await ReminderModel.getAllReminders(filters);

            res.json({
                success: true,
                data: reminders,
                count: reminders.length
            });
        } catch (error) {
            console.error('Error in getAllReminders controller:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch reminders'
            });
        }
    }

    static async getReminderById(req, res) {
        try {
            const reminderId = parseInt(req.params.id);

            if (isNaN(reminderId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid reminder ID'
                });
            }

            const reminder = await ReminderModel.getReminderById(reminderId);

            if (!reminder) {
                return res.status(404).json({
                    success: false,
                    error: 'Reminder not found'
                });
            }

            res.json({
                success: true,
                data: reminder
            });
        } catch (error) {
            console.error('Error in getReminderById controller:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch reminder'
            });
        }
    }

    static async getPendingReminders(req, res) {
        try {
            const reminders = await ReminderModel.getPendingReminders();

            res.json({
                success: true,
                data: reminders,
                count: reminders.length
            });
        } catch (error) {
            console.error('Error in getPendingReminders controller:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch pending reminders'
            });
        }
    }

    static async updateReminder(req, res) {
        try {
            const reminderId = parseInt(req.params.id);
            const { staffName, staffTelegramId, message, scheduledTime, detailId } = req.body;

            if (isNaN(reminderId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid reminder ID'
                });
            }

            const existing = await ReminderModel.getReminderById(reminderId);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    error: 'Reminder not found'
                });
            }

            if (existing.Status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    error: `Cannot update reminder with status: ${existing.Status}`
                });
            }

            if (detailId && detailId !== existing.Detail_ID) {
                const existingReminderForDetail = await ReminderModel.getReminderByDetailId(detailId);
                if (existingReminderForDetail && existingReminderForDetail.Reminder_ID !== reminderId) {
                    return res.status(400).json({
                        success: false,
                        error: `Detail ID ${detailId} already has a reminder (ID: ${existingReminderForDetail.Reminder_ID})`
                    });
                }
            }

            const updates = {
                staffName: staffName || existing.Staff_Name,
                staffTelegramId: staffTelegramId !== undefined ? staffTelegramId : existing.Staff_Telegram_ID,
                message: message || existing.Message,
                scheduledTime: scheduledTime ? new Date(scheduledTime) : existing.Scheduled_Time,
                detailId: detailId !== undefined ? detailId : existing.Detail_ID
            };

            await ReminderModel.updateReminder(reminderId, updates);

            res.json({
                success: true,
                message: 'Reminder updated successfully'
            });
        } catch (error) {
            console.error('Error in updateReminder controller:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update reminder'
            });
        }
    }

    static async deleteReminder(req, res) {
        try {
            const reminderId = parseInt(req.params.id);

            if (isNaN(reminderId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid reminder ID'
                });
            }

            const existing = await ReminderModel.getReminderById(reminderId);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    error: 'Reminder not found'
                });
            }

            await ReminderModel.deleteReminder(reminderId);

            res.json({
                success: true,
                message: 'Reminder deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteReminder controller:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete reminder'
            });
        }
    }

    static async getRemindersByStaff(req, res) {
        try {
            const { staffName } = req.query;

            if (!staffName) {
                return res.status(400).json({
                    success: false,
                    error: 'Staff name is required'
                });
            }

            const reminders = await ReminderModel.getRemindersByStaff(staffName);

            res.json({
                success: true,
                data: reminders,
                count: reminders.length
            });
        } catch (error) {
            console.error('Error in getRemindersByStaff controller:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch staff reminders'
            });
        }
    }

    static async getStatistics(req, res) {
        try {
            const stats = await ReminderModel.getReminderStatistics();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error in getStatistics controller:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch statistics'
            });
        }
    }

    static async testSend(req, res) {
        try {
            const { chatId, message } = req.body;

            if (!chatId || !message) {
                return res.status(400).json({
                    success: false,
                    error: 'chatId and message are required'
                });
            }

            if (!telegramBot.isInitialized) {
                return res.status(500).json({
                    success: false,
                    error: 'Telegram bot not initialized'
                });
            }

            await telegramBot.sendMessage(chatId, message);

            res.json({
                success: true,
                message: 'Test message sent successfully'
            });
        } catch (error) {
            console.error('Error sending test message:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to send test message'
            });
        }
    }

    static async testConnection(req, res) {
        try {
            const isConnected = await telegramBot.testConnection();

            res.json({
                success: isConnected,
                message: isConnected ? 'Bot connected successfully' : 'Bot connection failed'
            });
        } catch (error) {
            console.error('Error testing bot connection:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to test connection'
            });
        }
    }

    static async checkReminderByDetailId(req, res) {
        try {
            const { detailId } = req.params;

            if (!detailId) {
                return res.status(400).json({
                    success: false,
                    error: 'Detail ID is required'
                });
            }

            const reminder = await ReminderModel.getReminderByDetailId(detailId);

            if (reminder) {
                res.json({
                    success: true,
                    hasReminder: true,
                    data: reminder
                });
            } else {
                res.json({
                    success: true,
                    hasReminder: false,
                    data: null
                });
            }
        } catch (error) {
            console.error('Error checking reminder by detail ID:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check reminder'
            });
        }
    }
}

module.exports = ReminderController;

