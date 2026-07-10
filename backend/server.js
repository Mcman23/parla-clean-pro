// backend/server.js — Express + REST API
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/error');

const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const customersRoutes = require('./routes/customers');
const employeesRoutes = require('./routes/employees');
const servicesRoutes = require('./routes/services');
const paymentsRoutes = require('./routes/payments');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/payments', paymentsRoutes);

// ── Error handler (last middleware) ──
app.use(errorHandler);

// ── Start ──
const PORT = config.port;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');
    await sequelize.sync({ alter: true });
    console.log('✅ Tables synced');
  } catch (err) {
    console.log('❌ DB connection failed:', err.message);
    console.log('   Server running (DB not connected)');
  }
});
