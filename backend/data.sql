-- ============================================================
-- Parla Təmizlik — MySQL seed data
-- sequelize.sync({ alter: true }) cədvəlləri avtomatik yaradır
-- Bu fayl yalnız ilkin məlumatları (admin user, xidmətlər, işçilər) əlavə edir
-- Render-da server ilk açılanda sync olunur, sonra bunu işə salın
-- ============================================================

USE parla_clean;

-- Default admin user (şifrə: admin123 — bcrypt ilə hash olunub)
INSERT INTO Users (username, email, password, role, createdAt, updatedAt)
SELECT 'admin', 'admin@parla.az', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', NOW(), NOW()
WHERE NOT EXISTS (SELECT id FROM Users WHERE username = 'admin');

-- Xidmətlər
INSERT INTO Services (name, price, workers, status, createdAt, updatedAt)
SELECT * FROM (
  SELECT 'Ev təmizliyi' AS name, 15.00 AS price, '1-2 nəfər' AS workers, 'aktiv' AS status, NOW() AS createdAt, NOW() AS updatedAt
  UNION SELECT 'Ofis təmizliyi', 20.00, '2-4 nəfər', 'aktiv', NOW(), NOW()
  UNION SELECT 'Pəncərə yuyulması', 12.00, '1 nəfər', 'aktiv', NOW(), NOW()
  UNION SELECT 'Dezinfeksiya', 25.00, '2 nəfər', 'aktiv', NOW(), NOW()
) AS s
WHERE NOT EXISTS (SELECT id FROM Services WHERE name = s.name);

-- İşçilər
INSERT INTO Employees (name, specialty, phone, rating, status, createdAt, updatedAt)
SELECT * FROM (
  SELECT 'Əli Rəhimov' AS name, 'Ev təmizliyi' AS specialty, '+994 50 111 22 33' AS phone, 4.8 AS rating, 'aktiv' AS status, NOW() AS createdAt, NOW() AS updatedAt
  UNION SELECT 'Zeynəb Kərimova', 'Ofis / Korporativ', '+994 50 222 33 44', 4.9, 'aktiv', NOW(), NOW()
  UNION SELECT 'Tural Kərimli', 'Pəncərə / Fasad', '+994 50 333 44 55', 4.7, 'aktiv', NOW(), NOW()
  UNION SELECT 'Səbinə Məmmədova', 'Dezinfeksiya', '+994 50 444 55 66', 5.0, 'aktiv', NOW(), NOW()
) AS e
WHERE NOT EXISTS (SELECT id FROM Employees WHERE name = e.name);

-- Nümunə müştərilər
INSERT INTO Customers (name, phone, email, address, status, createdAt, updatedAt)
SELECT * FROM (
  SELECT 'Leyla Məmmədova' AS name, '+994 50 123 45 67' AS phone, 'leyla@mail.az' AS email, 'Nərimanov r.' AS address, 'aktiv' AS status, NOW() AS createdAt, NOW() AS updatedAt
  UNION SELECT 'Elvin Həsənli', '+994 55 987 65 43', 'elvin@mail.az', 'Yasamal', 'aktiv', NOW(), NOW()
  UNION SELECT 'Aynur Əliyeva', '+994 70 111 22 33', NULL, 'Xətai', 'passiv', NOW(), NOW()
) AS c
WHERE NOT EXISTS (SELECT id FROM Customers WHERE phone = c.phone);
