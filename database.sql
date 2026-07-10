-- ============================================================
-- Parla Təmizlik — Database schema (MySQL)
-- Bu SQL-i Render-in MySQL-inə və ya phpMyAdmin-də bir dəfə işə salın
-- ============================================================

CREATE DATABASE IF NOT EXISTS parla_clean CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE parla_clean;

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','user') DEFAULT 'user',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contacts table (əlaqə formundan gələn müraciətlər)
CREATE TABLE IF NOT EXISTS Contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(100),
    service VARCHAR(50) NOT NULL,
    message TEXT,
    status ENUM('yeni','baxildi','tamamlandi') DEFAULT 'yeni',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user
-- Şifrə: admin123 (bcrypt ilə hash olunub)
INSERT INTO Users (username, email, password, role)
SELECT 'admin', 'admin@parla.az', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'
WHERE NOT EXISTS (SELECT id FROM Users WHERE username = 'admin');
