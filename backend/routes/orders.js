// backend/routes/orders.js
const router = require('express').Router();
const { Order, Customer, Service, Employee } = require('../models');
const auth = require('../middleware/auth');

// GET /api/orders — list (with filters)
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    const orders = await Order.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer' },
        { model: Service, as: 'service' },
        { model: Employee, as: 'employee' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    res.json({ data: orders.rows, total: orders.count, page: parseInt(page), pages: Math.ceil(orders.count / parseInt(limit)) });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Customer, as: 'customer' }, { model: Service, as: 'service' }, { model: Employee, as: 'employee' }]
    });
    if (!order) return res.status(404).json({ error: 'Sifariş tapılmadı' });
    res.json(order);
  } catch (err) { next(err); }
});

// POST /api/orders — create (public for form submissions)
router.post('/', async (req, res, next) => {
  try {
    const { customerName, customerPhone, customerAddress, serviceId, address, date } = req.body;

    // Find or create customer
    let customer = await Customer.findOne({ where: { phone: customerPhone } });
    if (!customer) {
      customer = await Customer.create({ name: customerName, phone: customerPhone, address: customerAddress });
    }

    const order = await Order.create({
      customerId: customer.id,
      serviceId,
      address: address || customerAddress,
      date: date || null,
      status: 'yeni'
    });

    res.status(201).json({ id: order.id, message: 'Sifariş qeydə alındı' });
  } catch (err) { next(err); }
});

// PUT /api/orders/:id — update status / assign employee
router.put('/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Sifariş tapılmadı' });
    const { status, employeeId, amount, date, address } = req.body;
    await order.update({ status, employeeId, amount, date, address });
    res.json(order);
  } catch (err) { next(err); }
});

// DELETE /api/orders/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Sifariş tapılmadı' });
    await order.destroy();
    res.json({ message: 'Sifariş silindi' });
  } catch (err) { next(err); }
});

module.exports = router;
