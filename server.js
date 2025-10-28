const app = require('./app');
const path = require('path');
const TempCleaner = require('./utils/tempCleaner');
const browserPool = require('./utils/browserPool');
const { closePool } = require('./config/db.config');
const telegramBot = require('./utils/telegramBot');

console.log(`[Worker ${process.pid}] Initializing Telegram bot (NO polling)...`);
telegramBot.initialize(false);

const PORT = process.env.PORT || 3000;

const tempPath = path.join(__dirname, 'uploads', 'details', 'temp');
const tempCleaner = new TempCleaner(tempPath, 6); 

browserPool.initialize().then(() => {
    console.log('Browser pool initialization complete');
}).catch(err => {
    console.error('Browser pool initialization failed:', err);
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Process ID: ${process.pid}`);
    tempCleaner.start();
});

const gracefulShutdown = async (signal) => {
    console.log(`${signal} received. Starting graceful shutdown...`);
    
    server.close(async () => {
        console.log('HTTP server closed');
        
        try {
            tempCleaner.stop();
            console.log('Temp cleaner stopped');
            
            await browserPool.close();
            console.log('Browser pool closed');

            await closePool();
            console.log('Database pool closed');
            
            console.log('Graceful shutdown complete');
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    });

    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.send) {
    process.on('disconnect', () => {
        console.log('Worker disconnected from cluster, shutting down...');
        gracefulShutdown('DISCONNECT');
    });
}

process.on('uncaughtException', (error) => {
    console.error(`[Worker ${process.pid}] Uncaught Exception:`, error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`[Worker ${process.pid}] Unhandled Rejection:`, reason);
});
