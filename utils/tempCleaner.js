const fs = require('fs').promises;
const path = require('path');

class TempCleaner {
    constructor(tempPath, intervalHours = 6) {
        this.tempPath = tempPath;
        this.intervalHours = intervalHours;
        this.intervalMs = intervalHours * 60 * 60 * 1000; 
        this.intervalId = null;
    }
    async cleanDirectory(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    await this.cleanDirectory(fullPath);
                    await fs.rmdir(fullPath);
                    console.log(`Removed directory: ${fullPath}`);
                } else {
                    await fs.unlink(fullPath);
                    console.log(`Removed file: ${fullPath}`);
                }
            }
        } catch (error) {
            console.error(`Error cleaning directory ${dirPath}:`, error.message);
        }
    }

    async clean() {
        try {
            console.log(`[${new Date().toISOString()}] Starting temp directory cleanup...`);
            
            try {
                await fs.access(this.tempPath);
            } catch (error) {
                console.log(`Temp directory does not exist: ${this.tempPath}`);
                return;
            }
            await this.cleanDirectory(this.tempPath);
            
            console.log(`[${new Date().toISOString()}] Temp directory cleanup completed successfully`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error during temp cleanup:`, error.message);
        }
    }

    start() {
        if (this.intervalId) {
            console.log('Temp cleaner is already running');
            return;
        }

        console.log(`Starting automatic temp cleaner (every ${this.intervalHours} hours)`);
        
        this.clean();
        
        this.intervalId = setInterval(() => {
            this.clean();
        }, this.intervalMs);

        console.log(`Temp cleaner scheduled to run every ${this.intervalHours} hours`);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Temp cleaner stopped');
        }
    }
}

module.exports = TempCleaner;

