// backend/models/index.js — Sequelize models
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  dialect: config.db.dialect,
  pool: config.db.pool,
  logging: false
});

// ── User ──
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' }
}, { tableName: 'Users', timestamps: true, createdAt: 'createdAt', updatedAt: 'updatedAt' });

User.beforeCreate(async (u) => {
  u.password = await bcrypt.hash(u.password, 10);
});

// ── Customer ──
const Customer = sequelize.define('Customer', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(30), allowNull: false },
  email: { type: DataTypes.STRING(100) },
  address: { type: DataTypes.STRING(200) },
  status: { type: DataTypes.ENUM('aktiv', 'passiv'), defaultValue: 'aktiv' }
}, { tableName: 'Customers', timestamps: true });

// ── Service ──
const Service = sequelize.define('Service', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  workers: { type: DataTypes.STRING(50) },
  status: { type: DataTypes.ENUM('aktiv', 'passiv'), defaultValue: 'aktiv' }
}, { tableName: 'Services', timestamps: true });

// ── Employee ──
const Employee = sequelize.define('Employee', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  specialty: { type: DataTypes.STRING(100) },
  phone: { type: DataTypes.STRING(30) },
  rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 5.0 },
  status: { type: DataTypes.ENUM('aktiv', 'deaktiv'), defaultValue: 'aktiv' }
}, { tableName: 'Employees', timestamps: true });

// ── Order ──
const Order = sequelize.define('Order', {
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  serviceId: { type: DataTypes.INTEGER, allowNull: false },
  employeeId: { type: DataTypes.INTEGER },
  address: { type: DataTypes.STRING(200) },
  date: { type: DataTypes.DATEONLY },
  amount: { type: DataTypes.DECIMAL(10, 2) },
  status: {
    type: DataTypes.ENUM('yeni', 'gözləyir', 'gedişdə', 'tamamlandı', 'ləğv'),
    defaultValue: 'yeni'
  }
}, { tableName: 'Orders', timestamps: true });

// ── Payment ──
const Payment = sequelize.define('Payment', {
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  method: { type: DataTypes.ENUM('nağd', 'kart', 'köçürmə'), defaultValue: 'nağd' },
  status: { type: DataTypes.ENUM('gözləyir', 'ödənilib', 'ləğv'), defaultValue: 'gözləyir' }
}, { tableName: 'Payments', timestamps: true });

// ── Associations ──
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Order.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
Order.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

module.exports = { sequelize, User, Customer, Service, Employee, Order, Payment };
