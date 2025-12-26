const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'deneme',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL veritabanına bağlandı');
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL bağlantı hatası:', err.message);
    });

module.exports = pool;
