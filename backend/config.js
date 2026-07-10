// backend/config.js — DB & mail config
require('dotenv').config();

module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
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
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@parla.az'
  },
  port: process.env.PORT || 3000
};
