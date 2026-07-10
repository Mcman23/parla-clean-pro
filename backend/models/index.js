const { Sequelize, DataTypes } = require('sequelize')
const sequelize = new Sequelize(
  process.env.DB_NAME || 'parla_clean',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  { host: process.env.DB_HOST || '127.0.0.1', dialect: 'mysql', logging: false }
)

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true },
  email: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
  role: { type: DataTypes.STRING, defaultValue: 'admin' } // or 'staff'
})

const Customer = sequelize.define('Customer', {
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: DataTypes.STRING,
  address: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: 'aktiv' } // aktiv / passiv
})

const Service = sequelize.define('Service', {
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  workers: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: 'aktiv' }
})

const Employee = sequelize.define('Employee', {
  name: { type: DataTypes.STRING, allowNull: false },
  specialty: DataTypes.STRING,
  phone: DataTypes.STRING,
  rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 5.0 },
  status: { type: DataTypes.STRING, defaultValue: 'aktiv' }
})

const Order = sequelize.define('Order', {
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  serviceId: { type: DataTypes.INTEGER, allowNull: false },
  employeeId: DataTypes.INTEGER,
  address: DataTypes.STRING,
  date: DataTypes.DATEONLY,
  amount: DataTypes.DECIMAL(10, 2),
  status: { type: DataTypes.STRING, defaultValue: 'yeni' } // yeni, gözləyir, gedişdə, tamamlandı, ləğv
})

const Payment = sequelize.define('Payment', {
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  method: { type: DataTypes.STRING, defaultValue: 'nağd' }, // nağd, kart, köçürmə
  status: { type: DataTypes.STRING, defaultValue: 'gözləyir' } // gözləyir, ödənilib, ləğv
})

// Associations
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })
Order.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' })
Order.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' })
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })

module.exports = { sequelize, User, Customer, Service, Employee, Order, Payment }
