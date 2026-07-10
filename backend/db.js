require('dotenv').config();

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'parla_clean',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// Tables avtomatik yaradılır (ilk deploy-da)
async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','user') DEFAULT 'user',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS Contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        email VARCHAR(100),
        service VARCHAR(50) NOT NULL,
        message TEXT,
        status ENUM('yeni','baxildi','tamamlandi') DEFAULT 'yeni',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Default admin user (yoxdursa yaradır)
    const bcrypt = require('bcryptjs');
    const [rows] = await conn.execute('SELECT id FROM Users WHERE username = ?', ['admin']);
    if (rows.length === 0) {
      const hashed = bcrypt.hashSync('admin123', 10);
      await conn.execute(
        'INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@parla.az', hashed, 'admin']
      );
      console.log('✅ Default admin created (admin / admin123)');
    }
    console.log('✅ Database tables ready');
  } finally {
    conn.release();
  }
}

module.exports = { pool, initDB };
