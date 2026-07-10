const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const contactRoutes = require('./routes/contacts');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — frontend GitHub Pages-dən gələn sorğular üçün
app.use(cors({
  origin: ['https://mcman23.github.io', 'http://localhost:3000', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Parla Təmizlik API' });
});
app.use('/api', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check (Render üçün)
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Tapılmadı' }));

// Start
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB init failed:', err.message);
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (DB not connected)`);
    });
  });
