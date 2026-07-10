// backend/config.js — DB & mail config
require('dotenv').config();

module.exports = {
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    name: process.env.DB_NAME || 'parla_clean',
    dialect: 'mysql',
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'parla-dev-secret-2026',
    expiresIn: '8h'
  },
  mail: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || ''
  },
  port: process.env.PORT || 5000
};
