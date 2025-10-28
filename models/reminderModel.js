const { query } = require('../config/db.config');

class ReminderModel {
    static async createReminder(reminderData) {
        try {
            const { staffName, staffTelegramId, message, scheduledTime, detailId } = reminderData;

            const sqlQuery = `
                INSERT INTO Reminders (Staff_Name, Staff_Telegram_ID, Message, Scheduled_Time, Status, Detail_ID)
                OUTPUT INSERTED.Reminder_ID
                VALUES (@staffName, @staffTelegramId, @message, @scheduledTime, 'pending', @detailId)
            `;

            const result = await query(sqlQuery, {
                staffName,
                staffTelegramId: staffTelegramId || null,
                message,
                scheduledTime,
                detailId: detailId || null
            });

            const reminderId = result.recordset[0].Reminder_ID;
            console.log('Reminder created with ID:', reminderId, detailId ? `linked to Detail_ID: ${detailId}` : '');
            return reminderId;
        } catch (error) {
            console.error('Error creating reminder:', error);
            throw error;
        }
    }

    static async getAllReminders(filters = {}) {
        try {
            let sqlQuery = `
                SELECT 
                    Reminder_ID,
                    Staff_Name,
                    Staff_Telegram_ID,
                    Message,
                    Scheduled_Time,
                    Created_At,
                    Status,
                    Sent_At,
                    Error_Message,
                    Detail_ID
                FROM Reminders
                WHERE 1=1
            `;

            const params = {};

            if (filters.status) {
                sqlQuery += ` AND Status = @status`;
                params.status = filters.status;
            }

            if (filters.staffName) {
                sqlQuery += ` AND Staff_Name = @staffName`;
                params.staffName = filters.staffName;
            }

            if (filters.detailId) {
                sqlQuery += ` AND Detail_ID = @detailId`;
                params.detailId = filters.detailId;
            }

            sqlQuery += ` ORDER BY Scheduled_Time DESC`;

            const result = await query(sqlQuery, params);
            return result.recordset;
        } catch (error) {
            console.error('Error fetching reminders:', error);
            throw error;
        }
    }

    static async getReminderById(reminderId) {
        try {
            const sqlQuery = `
                SELECT 
                    Reminder_ID,
                    Staff_Name,
                    Staff_Telegram_ID,
                    Message,
                    Scheduled_Time,
                    Created_At,
                    Status,
                    Sent_At,
                    Error_Message,
                    Detail_ID
                FROM Reminders
                WHERE Reminder_ID = @reminderId
            `;

            const result = await query(sqlQuery, { reminderId });
            return result.recordset[0] || null;
        } catch (error) {
            console.error('Error fetching reminder by ID:', error);
            throw error;
        }
    }

    static async getPendingReminders() {
        try {
            const sqlQuery = `
                SELECT 
                    Reminder_ID,
                    Staff_Name,
                    Staff_Telegram_ID,
                    Message,
                    Scheduled_Time,
                    Created_At
                FROM Reminders
                WHERE Status = 'pending'
                    AND Scheduled_Time <= GETDATE()
                ORDER BY Scheduled_Time ASC
            `;

            const result = await query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error('Error fetching pending reminders:', error);
            throw error;
        }
    }

    static async updateReminderStatus(reminderId, status, errorMessage = null) {
        try {
            const sqlQuery = `
                UPDATE Reminders
                SET Status = @status,
                    Sent_At = CASE WHEN @status = 'sent' THEN GETDATE() ELSE Sent_At END,
                    Error_Message = @errorMessage
                WHERE Reminder_ID = @reminderId
            `;

            await query(sqlQuery, {
                reminderId,
                status,
                errorMessage
            });

            console.log(`Reminder ${reminderId} status updated to: ${status}`);
        } catch (error) {
            console.error('Error updating reminder status:', error);
            throw error;
        }
    }

    static async updateReminder(reminderId, updates) {
        try {
            const { staffName, staffTelegramId, message, scheduledTime, detailId } = updates;

            const sqlQuery = `
                UPDATE Reminders
                SET Staff_Name = @staffName,
                    Staff_Telegram_ID = @staffTelegramId,
                    Message = @message,
                    Scheduled_Time = @scheduledTime,
                    Detail_ID = @detailId
                WHERE Reminder_ID = @reminderId
            `;

            await query(sqlQuery, {
                reminderId,
                staffName,
                staffTelegramId: staffTelegramId || null,
                message,
                scheduledTime,
                detailId: detailId || null
            });

            console.log(`Reminder ${reminderId} updated successfully`);
        } catch (error) {
            console.error('Error updating reminder:', error);
            throw error;
        }
    }

    static async deleteReminder(reminderId) {
        try {
            const sqlQuery = `
                DELETE FROM Reminders
                WHERE Reminder_ID = @reminderId
            `;

            await query(sqlQuery, { reminderId });
            console.log(`Reminder ${reminderId} deleted successfully`);
        } catch (error) {
            console.error('Error deleting reminder:', error);
            throw error;
        }
    }

    static async getRemindersByStaff(staffName) {
        try {
            const sqlQuery = `
                SELECT 
                    Reminder_ID,
                    Staff_Name,
                    Staff_Telegram_ID,
                    Message,
                    Scheduled_Time,
                    Created_At,
                    Status,
                    Sent_At,
                    Error_Message,
                    Detail_ID
                FROM Reminders
                WHERE Staff_Name = @staffName
                ORDER BY Scheduled_Time DESC
            `;

            const result = await query(sqlQuery, { staffName });
            return result.recordset;
        } catch (error) {
            console.error('Error fetching reminders for staff:', error);
            throw error;
        }
    }

    static async getReminderStatistics() {
        try {
            const sqlQuery = `
                SELECT 
                    COUNT(*) as TotalReminders,
                    SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) as PendingReminders,
                    SUM(CASE WHEN Status = 'sent' THEN 1 ELSE 0 END) as SentReminders,
                    SUM(CASE WHEN Status = 'failed' THEN 1 ELSE 0 END) as FailedReminders
                FROM Reminders
            `;

            const result = await query(sqlQuery);
            return result.recordset[0];
        } catch (error) {
            console.error('Error fetching reminder statistics:', error);
            throw error;
        }
    }

    static async getReminderByDetailId(detailId) {
        try {
            const sqlQuery = `
                SELECT 
                    Reminder_ID,
                    Staff_Name,
                    Staff_Telegram_ID,
                    Message,
                    Scheduled_Time,
                    Created_At,
                    Status,
                    Sent_At,
                    Error_Message,
                    Detail_ID
                FROM Reminders
                WHERE Detail_ID = @detailId
            `;

            const result = await query(sqlQuery, { detailId: parseInt(detailId) });
            return result.recordset[0] || null;
        } catch (error) {
            console.error('Error checking existing reminder for detail:', error);
            throw error;
        }
    }
}

module.exports = ReminderModel;

