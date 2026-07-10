// backend/routes/payments.js
const router = require('express').Router();
const { Payment, Order } = require('../models');
const auth = require('../middleware/auth');

// GET /api/payments
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    const payments = await Payment.findAndCountAll({
      where,
      include: [{ model: Order, as: 'order' }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    res.json({ data: payments.rows, total: payments.count, page: parseInt(page) });
  } catch (err) { next(err); }
});

// GET /api/payments/stats — dashboard finance summary
router.get('/stats', auth, async (req, res, next) => {
  try {
    const { Sequelize } = require('sequelize');
    const totalIncome = await Payment.sum('amount', { where: { status: 'ödənilib' } }) || 0;
    const totalPending = await Payment.sum('amount', { where: { status: 'gözləyir' } }) || 0;
    const count = await Payment.count({ where: { status: 'ödənilib' } });
    res.json({ totalIncome, totalPending, paidCount: count });
  } catch (err) { next(err); }
});

// POST /api/payments
router.post('/', auth, async (req, res, next) => {
  try {
    const { orderId, amount, method } = req.body;
    const payment = await Payment.create({ orderId, amount, method });
    res.status(201).json(payment);
  } catch (err) { next(err); }
});

// PUT /api/payments/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Ödəniş tapılmadı' });
    const { amount, method, status } = req.body;
    await payment.update({ amount, method, status });
    res.json(payment);
  } catch (err) { next(err); }
});

// DELETE /api/payments/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Ödəniş tapılmadı' });
    await payment.destroy();
    res.json({ message: 'Ödəniş silindi' });
  } catch (err) { next(err); }
});

module.exports = router;
