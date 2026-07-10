// backend/routes/orders.js
const router = require('express').Router()
const { Order, Customer, Service, Employee } = require('../models')
const auth = require('../middleware/auth')

// GET /api/orders
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const where = {}
    if (status) where.status = status
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
    })
    res.json({ data: orders.rows, total: orders.count, page: parseInt(page), pages: Math.ceil(orders.count / parseInt(limit)) })
  } catch (err) { next(err) }
})

// GET /api/orders/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Customer, as: 'customer' }, { model: Service, as: 'service' }, { model: Employee, as: 'employee' }]
    })
    if (!order) return res.status(404).json({ error: 'Sifariş tapılmadı' })
    res.json(order)
  } catch (err) { next(err) }
})

// POST /api/orders (public — website form)
router.post('/', async (req, res, next) => {
  try {
    const { customerName, customerPhone, customerEmail, customerAddress, serviceId, address, date, amount, message } = req.body

    let customer = await Customer.findOne({ where: { phone: customerPhone } })
    if (!customer) {
      customer = await Customer.create({
        name: customerName,
        phone: customerPhone,
        email: customerEmail || null,
        address: customerAddress || address || null
      })
    }

    const order = await Order.create({
      customerId: customer.id,
      serviceId,
      address: address || customerAddress || null,
      date: date || null,
      amount: amount || null,
      status: 'yeni',
      notes: message || null
    })

    res.status(201).json({ id: order.id, message: 'Sifariş qeydə alındı' })
  } catch (err) { next(err) }
})

// PUT /api/orders/:id (auth)
router.put('/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id)
    if (!order) return res.status(404).json({ error: 'Sifariş tapılmadı' })
    const { status, employeeId, amount, date, address, serviceId, notes } = req.body
    await order.update({
      status: status !== undefined ? status : order.status,
      employeeId: employeeId !== undefined ? employeeId : order.employeeId,
      amount: amount !== undefined ? amount : order.amount,
      date: date !== undefined ? date : order.date,
      address: address !== undefined ? address : order.address,
      serviceId: serviceId !== undefined ? serviceId : order.serviceId,
      notes: notes !== undefined ? notes : order.notes
    })
    res.json(order)
  } catch (err) { next(err) }
})

// DELETE /api/orders/:id (auth)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id)
    if (!order) return res.status(404).json({ error: 'Sifariş tapılmadı' })
    await order.destroy()
    res.json({ message: 'Sifariş silindi' })
  } catch (err) { next(err) }
})

module.exports = router
