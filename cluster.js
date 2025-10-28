const cluster = require('cluster');
const os = require('os');
const reminderScheduler = require('./utils/reminderScheduler');

if (cluster.isMaster || cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    const numWorkers = process.env.CLUSTER_WORKERS || Math.max(2, numCPUs - 1);
    
    console.log(`Master process ${process.pid} is running`);
    console.log(`Starting ${numWorkers} workers...`);

    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    reminderScheduler.start();

    const workerRestarts = new Map();

    cluster.on('online', (worker) => {
        console.log(`Worker ${worker.process.pid} is online`);
    });

    cluster.on('exit', (worker, code, signal) => {
        if (signal === 'SIGTERM' || signal === 'SIGINT' || worker.exitedAfterDisconnect) {
            console.log(`Worker ${worker.process.pid} gracefully shut down`);
            return;
        }

        console.log(`Worker ${worker.process.pid} died unexpectedly (${signal || code})`);

        const restarts = workerRestarts.get(worker.id) || 0;
        
        if (restarts < 5) {
            console.log('Starting a new worker...');
            setTimeout(() => {
                const newWorker = cluster.fork();
                workerRestarts.set(newWorker.id, restarts + 1);

                setTimeout(() => {
                    workerRestarts.delete(newWorker.id);
                }, 5 * 60 * 1000);
            }, 1000);
        } else {
            console.error(`Worker ${worker.id} has restarted too many times. Not restarting.`);
        }
    });

    let isShuttingDown = false;
    
    const gracefulShutdown = (signal) => {
        if (isShuttingDown) {
            console.log('Shutdown already in progress...');
            return;
        }
        
        isShuttingDown = true;
        console.log(`${signal} signal received: closing all workers gracefully`);

        reminderScheduler.stop();
        
        const workerIds = Object.keys(cluster.workers);
        console.log(`Disconnecting ${workerIds.length} workers...`);
        
        for (const id in cluster.workers) {
            if (cluster.workers[id]) {
                cluster.workers[id].disconnect();
            }
        }
        
        const shutdownTimeout = setTimeout(() => {
            console.log('Forcing shutdown after timeout');
            for (const id in cluster.workers) {
                if (cluster.workers[id]) {
                    cluster.workers[id].kill('SIGKILL');
                }
            }
            process.exit(0);
        }, 5000);
    };
    
    cluster.on('disconnect', (worker) => {
        if (isShuttingDown) {
            const remainingWorkers = Object.keys(cluster.workers).filter(
                id => cluster.workers[id] && cluster.workers[id].isConnected()
            ).length;
            
            console.log(`Worker ${worker.process.pid} disconnected. Remaining: ${remainingWorkers}`);
            
            if (remainingWorkers === 0) {
                console.log('All workers disconnected, shutting down master');
                process.exit(0);
            }
        }
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => {
        console.log('SIGUSR2 (nodemon restart) received');
        gracefulShutdown('SIGUSR2');
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception in master process:', error);
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection in master process:', reason);
    });

} else {
    require('./server.js');
}

