require('dotenv').config();
const sql = require('mssql/msnodesqlv8');

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    driver: process.env.DB_DRIVER,
    options: {
        trustedConnection: true,  
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
    },
    pool: {
        max: 50,                  
        min: 10,                   
        idleTimeoutMillis: 30000, 
        acquireTimeoutMillis: 30000 
    },
    connectionTimeout: 30000,   
    requestTimeout: 30000    
};

let globalPool = null;

const initializePool = async () => {
    try {
        if (!globalPool) {
            globalPool = await sql.connect(config);
            console.log('Database pool initialized successfully');
        }
        return globalPool;
    } catch (error) {
        console.error('Failed to initialize database pool:', error);
        throw error;
    }
};

const query = async (sqlQuery, params = {}) => {
    try {
        const pool = globalPool || await initializePool();
        const request = pool.request();

        Object.keys(params).forEach(key => {
            if (key === 'image') {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    const buffer = Buffer.from(params[key], 'base64');
                    request.input(key, sql.VarBinary, buffer);
                } else {
                    // Handle empty image as null in database
                    request.input(key, sql.VarBinary, null);
                }
            } else {
                request.input(key, params[key]);
            }
        });

        const result = await request.query(sqlQuery);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

initializePool()
    .then(pool => {
        if (pool.connected) {
            console.log(`Connected to SQL Server: ${process.env.DB_SERVER}, Database: ${process.env.DB_DATABASE}`);
            console.log(`Connection pool configured: min=${config.pool.min}, max=${config.pool.max}`);
        }
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

const closePool = async () => {
    try {
        if (globalPool) {
            await globalPool.close();
            console.log('Database pool closed');
        }
    } catch (error) {
        console.error('Error closing database pool:', error);
    }
};

module.exports = { config, query, closePool };
