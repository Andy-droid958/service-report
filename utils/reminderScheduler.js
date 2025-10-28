const cron = require('node-cron');
const ReminderModel = require('../models/reminderModel');
const StaffTelegramModel = require('../models/staffTelegramModel');
const telegramBot = require('./telegramBot');

class ReminderScheduler {
    constructor() {
        this.cronJob = null;
        this.cleanupJob = null;
        this.isRunning = false;
        this.retryAttempts = 3;
        this.retryDelay = 5000; 
    }

    start() {
        if (this.isRunning) {
            console.log('Reminder scheduler is already running');
            return;
        }

        console.log('');
        console.log('==========================================');
        console.log('Initializing Telegram Bot for Reminders');
        console.log('==========================================');
        console.log(`[Master ${process.pid}] Enabling POLLING to receive /start commands...`);
        console.log('');
        const initialized = telegramBot.initialize(true);
        if (!initialized) {
            console.error('');
            console.error('CRITICAL ERROR');
            console.error('Failed to initialize Telegram bot!');
            console.error('Reminder scheduler CANNOT start without bot.');
            console.error('');
            console.error('Please check:');
            console.error('1. TELEGRAM_BOT_TOKEN is set in .env file');
            console.error('2. Token is valid (get from @BotFather)');
            console.error('3. No extra spaces or quotes in .env');
            console.error('==========================================');
            return;
        }
        
        console.log('Telegram Bot initialized successfully!');
        console.log('Bot is now listening for /start commands');
        console.log('==========================================');
        console.log('');
        this.cronJob = cron.schedule('* * * * *', async () => {
            await this.processReminders();
        });
        this.cleanupJob = cron.schedule('0 * * * *', async () => {
            await this.cleanupExpiredConnections();
        });

        this.isRunning = true;
        console.log('Reminder scheduler started - checking every minute');
        console.log('Connection cleanup scheduled - running every hour');
        console.log('');
    }

    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.isRunning = false;
            console.log('Reminder scheduler stopped');
        }
        if (this.cleanupJob) {
            this.cleanupJob.stop();
            console.log('Connection cleanup scheduler stopped');
        }
    }

    async cleanupExpiredConnections() {
        try {
            const deletedCount = await StaffTelegramModel.cleanupExpiredConnections();
            if (deletedCount > 0) {
                console.log(`[${new Date().toLocaleTimeString()}] Cleaned up ${deletedCount} expired pending connections`);
            }
        } catch (error) {
            console.error('Error cleaning up expired connections:', error);
        }
    }

    async processReminders() {
        try {
            const pendingReminders = await ReminderModel.getPendingReminders();

            if (pendingReminders.length === 0) {
                const now = Date.now();
                if (!this.lastNoReminderLog || (now - this.lastNoReminderLog) > 10 * 60 * 1000) {
                    console.log(`[${new Date().toLocaleTimeString()}] No pending reminders (will check every minute)`);
                    this.lastNoReminderLog = now;
                }
                return;
            }

            console.log(`\n[${new Date().toLocaleTimeString()}] Found ${pendingReminders.length} pending reminder(s)!`);

            for (const reminder of pendingReminders) {
                await this.sendReminder(reminder);
            }
        } catch (error) {
            console.error('Error processing reminders:', error);
        }
    }

    async sendReminder(reminder) {
        const {
            Reminder_ID,
            Staff_Name,
            Staff_Telegram_ID,
            Message,
            Scheduled_Time
        } = reminder;

        console.log(`\nSending reminder #${Reminder_ID} to ${Staff_Name}`);
        console.log(`   Scheduled: ${new Date(Scheduled_Time).toLocaleString()}`);
        console.log(`   Message: ${Message.substring(0, 50)}${Message.length > 50 ? '...' : ''}`);

        let chatId = Staff_Telegram_ID;
        
        if (!chatId || chatId.trim() === '') {
            chatId = process.env.TELEGRAM_DEFAULT_CHAT_ID;
            
            if (!chatId) {
                const errorMsg = 'No Telegram chat ID configured for staff and no default chat ID set';
                console.error(`${errorMsg}`);
                await ReminderModel.updateReminderStatus(Reminder_ID, 'failed', errorMsg);
                return;
            }
            
            console.log(`   Using default group chat: ${chatId}`);
        } else {
            console.log(`   Using staff chat ID: ${chatId}`);
        }

        let lastError = null;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                await telegramBot.sendReminder(chatId, Staff_Name, Message);
                
                await ReminderModel.updateReminderStatus(Reminder_ID, 'sent');
                console.log(`   Reminder #${Reminder_ID} sent successfully to Telegram!`);
                return;
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt}/${this.retryAttempts} failed:`, error.message);
                
                if (attempt < this.retryAttempts) {
                    console.log(`   Retrying in ${this.retryDelay / 1000} seconds...`);
                    await this.sleep(this.retryDelay);
                }
            }
        }

        const errorMessage = lastError ? lastError.message : 'Unknown error';
        await ReminderModel.updateReminderStatus(Reminder_ID, 'failed', errorMessage);
        console.error(`Reminder #${Reminder_ID} failed after ${this.retryAttempts} attempts`);
        console.error(`   Error: ${errorMessage}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            botInitialized: telegramBot.isInitialized
        };
    }

    async triggerNow() {
        console.log('Manually triggering reminder check...');
        await this.processReminders();
    }
}

const reminderScheduler = new ReminderScheduler();

module.exports = reminderScheduler;

