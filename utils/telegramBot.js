const TelegramBot = require('node-telegram-bot-api');
const StaffTelegramModel = require('../models/staffTelegramModel');
require('dotenv').config();

class TelegramBotService {
    constructor() {
        this.bot = null;
        this.isInitialized = false;
    }

    initialize(enablePolling = true) {
        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            
            if (!token) {
                console.error('TELEGRAM_BOT_TOKEN not found in environment variables');
                console.error('Please add TELEGRAM_BOT_TOKEN to your .env file');
                return false;
            }

            console.log('Initializing Telegram Bot...');
            console.log('Token found:', token.substring(0, 10) + '...');

            if (enablePolling) {
                this.bot = new TelegramBot(token, { 
                    polling: {
                        interval: 300,
                        autoStart: true,
                        params: {
                            timeout: 10
                        }
                    }
                });
                
                this.isInitialized = true;
                this.setupCommands();
                console.log('Telegram Bot initialized with POLLING enabled (Master Process)');
            } else {
                this.bot = new TelegramBot(token, { polling: false });
                this.isInitialized = true;
                console.log('Telegram Bot initialized (Worker Process - no polling)');
            }
            
            return true;
        } catch (error) {
            console.error('Error initializing Telegram Bot:', error.message);
            console.error('Full error:', error);
            this.isInitialized = false;
            return false;
        }
    }

    setupCommands() {
        console.log('Setting up Telegram bot commands...');
        
        this.bot.on('message', (msg) => {
            console.log('Bot received a message:', msg.text, 'from:', msg.from.first_name);
        });
        
        this.bot.onText(/\/start/, async (msg) => {
            try {
                const chatId = msg.chat.id;
                const username = msg.from.username || null;
                const firstName = msg.from.first_name || 'User';
                
                console.log('Received /start command!');
                console.log(`   From: ${firstName} (@${username})`);
                console.log(`   Chat ID: ${chatId}`);
                
                const connectionCode = this.generateConnectionCode();
                
                await StaffTelegramModel.storePendingConnection(chatId.toString(), connectionCode, 10);
                
                console.log(`   Generated code: ${connectionCode} (stored in database)`);
            
                const welcomeMessage = `
Hello ${firstName}!

Welcome to the Service Report Reminder Bot.

*Your Connection Code:* \`${connectionCode}\`
*Your Chat ID:* \`${chatId}\`

*How to connect:*
1. Go to the Staff Schedule page
2. Click "Connect Telegram" button
3. Enter your staff name
4. Enter the connection code: \`${connectionCode}\`
5. Enter your Chat ID: \`${chatId}\`
6. You'll start receiving reminders!

_This code expires in 10 minutes._

Need help? Contact your system administrator.
                `.trim();
                
                await this.sendMessage(chatId, welcomeMessage);
                console.log('Welcome message sent successfully');
                
            } catch (error) {
                console.error('Error handling /start command:', error);
            }
        });

        this.bot.on('message', async (msg) => {
            try {
                if (msg.text && !msg.text.startsWith('/')) {
                    const chatId = msg.chat.id;
                    console.log(`Received message from ${chatId}: ${msg.text}`);
                    
                    const staffInfo = await StaffTelegramModel.getStaffByChatId(chatId.toString());
                    
                    if (staffInfo) {
                        await this.sendMessage(chatId, `You're already connected as *${staffInfo.Staff_Name}*!`);
                    } else {
                        await this.sendMessage(chatId, 'Please send /start to get your connection code.');
                    }
                }
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });

        this.bot.on('polling_error', (error) => {
            console.error('Telegram polling error:', error.code, error.message);
            if (error.code === 'EFATAL') {
                console.error('Fatal error - bot may need to be restarted');
            }
        });
        
        console.log('Bot commands setup complete');
    }

    generateConnectionCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async verifyConnectionCode(chatId, code) {
        return await StaffTelegramModel.verifyConnectionCode(chatId.toString(), code);
    }

    async sendMessage(chatId, message) {
        if (!this.isInitialized) {
            throw new Error('Telegram Bot not initialized');
        }

        try {
            const result = await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
            
            console.log(`Message sent to ${chatId}: ${message.substring(0, 50)}...`);
            return result;
        } catch (error) {
            console.error(`Error sending message to ${chatId}:`, error.message);
            throw error;
        }
    }

    async sendReminder(chatId, staffName, message) {
        return await this.sendMessage(chatId, message);
    }

    async sendToDefaultChat(message) {
        const defaultChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID;
        
        if (!defaultChatId) {
            throw new Error('TELEGRAM_DEFAULT_CHAT_ID not configured');
        }

        return await this.sendMessage(defaultChatId, message);
    }

    async testConnection() {
        if (!this.isInitialized) {
            return false;
        }

        try {
            const me = await this.bot.getMe();
            console.log('Bot connection test successful:', me.username);
            return true;
        } catch (error) {
            console.error('Bot connection test failed:', error.message);
            return false;
        }
    }

    formatScheduleReminder(schedule) {
        return `
 <b>Schedule Reminder</b>

<b>Staff:</b> ${schedule.staffName}
<b>Customer:</b> ${schedule.customerName}
<b>Project:</b> ${schedule.projectName}
<b>Date:</b> ${schedule.date}
<b>Time:</b> ${schedule.startTime} - ${schedule.endTime}

<b>Details:</b>
${schedule.details || 'No additional details'}
        `.trim();
    }
}

const telegramBotService = new TelegramBotService();

module.exports = telegramBotService;

