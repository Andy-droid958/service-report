const { query } = require('../config/db.config');

class StaffTelegramModel {

    static async registerStaffTelegram(staffName, chatId, username = null, firstName = null) {
        try {
            const existing = await this.getStaffTelegram(staffName);
            
            if (existing) {
                const sqlQuery = `
                    UPDATE Staff_Telegram
                    SET Telegram_Chat_ID = @chatId,
                        Telegram_Username = @username,
                        Telegram_First_Name = @firstName,
                        Last_Updated = GETDATE(),
                        Is_Active = 1
                    WHERE Staff_Name = @staffName
                `;
                
                await query(sqlQuery, {
                    staffName,
                    chatId,
                    username,
                    firstName
                });
                
                console.log(`Updated Telegram connection for staff: ${staffName}`);
            } else {
                const sqlQuery = `
                    INSERT INTO Staff_Telegram (Staff_Name, Telegram_Chat_ID, Telegram_Username, Telegram_First_Name)
                    VALUES (@staffName, @chatId, @username, @firstName)
                `;
                
                await query(sqlQuery, {
                    staffName,
                    chatId,
                    username,
                    firstName
                });
                
                console.log(`Registered new Telegram connection for staff: ${staffName}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error registering staff Telegram:', error);
            throw error;
        }
    }

    static async getStaffTelegram(staffName) {
        try {
            const sqlQuery = `
                SELECT 
                    Staff_Name,
                    Telegram_Chat_ID,
                    Telegram_Username,
                    Telegram_First_Name,
                    Connected_At,
                    Last_Updated,
                    Is_Active
                FROM Staff_Telegram
                WHERE Staff_Name = @staffName AND Is_Active = 1
            `;
            
            const result = await query(sqlQuery, { staffName });
            return result.recordset[0] || null;
        } catch (error) {
            console.error('Error getting staff Telegram:', error);
            throw error;
        }
    }

    static async getStaffByChatId(chatId) {
        try {
            const sqlQuery = `
                SELECT 
                    Staff_Name,
                    Telegram_Chat_ID,
                    Telegram_Username,
                    Telegram_First_Name,
                    Connected_At,
                    Is_Active
                FROM Staff_Telegram
                WHERE Telegram_Chat_ID = @chatId AND Is_Active = 1
            `;
            
            const result = await query(sqlQuery, { chatId });
            return result.recordset[0] || null;
        } catch (error) {
            console.error('Error getting staff by chat ID:', error);
            throw error;
        }
    }

    static async storePendingConnection(chatId, connectionCode, expiryMinutes = 10) {
        try {
            await query(`DELETE FROM Pending_Telegram_Connections WHERE Chat_ID = @chatId`, { chatId });
            
            const sqlQuery = `
                INSERT INTO Pending_Telegram_Connections (Chat_ID, Connection_Code, Created_At, Expires_At)
                VALUES (@chatId, @connectionCode, GETDATE(), DATEADD(MINUTE, @expiryMinutes, GETDATE()))
            `;
            
            await query(sqlQuery, {
                chatId,
                connectionCode,
                expiryMinutes
            });
            
            console.log(`Stored pending connection: Chat ID ${chatId}, Code ${connectionCode}`);
            return true;
        } catch (error) {
            console.error('Error storing pending connection:', error);
            throw error;
        }
    }

    static async verifyConnectionCode(chatId, connectionCode) {
        try {
            const sqlQuery = `
                SELECT Connection_Code, Expires_At
                FROM Pending_Telegram_Connections
                WHERE Chat_ID = @chatId
            `;
            
            const result = await query(sqlQuery, { chatId });
            
            if (result.recordset.length === 0) {
                console.log(`No pending connection found for Chat ID: ${chatId}`);
                return false;
            }
            
            const pending = result.recordset[0];
            const now = new Date();
            const expiresAt = new Date(pending.Expires_At);
            
            if (now > expiresAt) {
                console.log(`Connection code expired for Chat ID: ${chatId}`);
                await this.deletePendingConnection(chatId);
                return false;
            }
            
            if (pending.Connection_Code !== connectionCode) {
                console.log(`Invalid connection code for Chat ID: ${chatId}`);
                return false;
            }

            await this.deletePendingConnection(chatId);
            console.log(`Connection code verified successfully for Chat ID: ${chatId}`);
            return true;
        } catch (error) {
            console.error('Error verifying connection code:', error);
            throw error;
        }
    }

    static async deletePendingConnection(chatId) {
        try {
            await query(`DELETE FROM Pending_Telegram_Connections WHERE Chat_ID = @chatId`, { chatId });
        } catch (error) {
            console.error('Error deleting pending connection:', error);
            throw error;
        }
    }

    static async cleanupExpiredConnections() {
        try {
            const sqlQuery = `
                DELETE FROM Pending_Telegram_Connections
                WHERE Expires_At < GETDATE()
            `;
            
            const result = await query(sqlQuery);
            const deletedCount = result.rowsAffected[0];
            
            if (deletedCount > 0) {
                console.log(`Cleaned up ${deletedCount} expired pending connections`);
            }
            
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up expired connections:', error);
            throw error;
        }
    }

    static async getAllConnectedStaff() {
        try {
            const sqlQuery = `
                SELECT 
                    Staff_Name,
                    Telegram_Chat_ID,
                    Telegram_Username,
                    Telegram_First_Name,
                    Connected_At,
                    Is_Active
                FROM Staff_Telegram
                WHERE Is_Active = 1
                ORDER BY Staff_Name
            `;
            
            const result = await query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error('Error getting all connected staff:', error);
            throw error;
        }
    }

    static async disconnectStaff(staffName) {
        try {
            const sqlQuery = `
                UPDATE Staff_Telegram
                SET Is_Active = 0,
                    Last_Updated = GETDATE()
                WHERE Staff_Name = @staffName
            `;
            
            await query(sqlQuery, { staffName });
            console.log(`Disconnected Telegram for staff: ${staffName}`);
            return true;
        } catch (error) {
            console.error('Error disconnecting staff Telegram:', error);
            throw error;
        }
    }
}

module.exports = StaffTelegramModel;

