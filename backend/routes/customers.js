// backend/routes/customers.js
const router = require('express').Router();
const { Customer, Order } = require('../models');
const auth = require('../middleware/auth');

// GET /api/customers
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    const customers = await Customer.findAndCountAll({
      where,
      include: [{ model: Order, as: 'orders' }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    res.json({ data: customers.rows, total: customers.count, page: parseInt(page) });
  } catch (err) { next(err); }
});

// GET /api/customers/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id, { include: [{ model: Order, as: 'orders' }] });
    if (!customer) return res.status(404).json({ error: 'Müştəri tapılmadı' });
    res.json(customer);
  } catch (err) { next(err); }
});

// POST /api/customers
router.post('/', auth, async (req, res, next) => {
  try {
    const { name, phone, email, address } = req.body;
    const customer = await Customer.create({ name, phone, email, address });
    res.status(201).json(customer);
  } catch (err) { next(err); }
});

// PUT /api/customers/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Müştəri tapılmadı' });
    const { name, phone, email, address, status } = req.body;
    await customer.update({ name, phone, email, address, status });
    res.json(customer);
  } catch (err) { next(err); }
});

// DELETE /api/customers/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Müştəri tapılmadı' });
    await customer.destroy();
    res.json({ message: 'Müştəri silindi' });
  } catch (err) { next(err); }
});

module.exports = router;
