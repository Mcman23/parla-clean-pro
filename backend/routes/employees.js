// backend/routes/employees.js
const router = require('express').Router();
const { Employee } = require('../models');
const auth = require('../middleware/auth');

// GET /api/employees
router.get('/', auth, async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const employees = await Employee.findAll({ where, order: [['rating', 'DESC']] });
    res.json(employees);
  } catch (err) { next(err); }
});

// GET /api/employees/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ error: 'İşçi tapılmadı' });
    res.json(emp);
  } catch (err) { next(err); }
});

// POST /api/employees
router.post('/', auth, async (req, res, next) => {
  try {
    const { name, specialty, phone, rating } = req.body;
    const emp = await Employee.create({ name, specialty, phone, rating });
    res.status(201).json(emp);
  } catch (err) { next(err); }
});

// PUT /api/employees/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ error: 'İşçi tapılmadı' });
    const { name, specialty, phone, rating, status } = req.body;
    await emp.update({ name, specialty, phone, rating, status });
    res.json(emp);
  } catch (err) { next(err); }
});

// DELETE /api/employees/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ error: 'İşçi tapılmadı' });
    await emp.destroy();
    res.json({ message: 'İşçi silindi' });
  } catch (err) { next(err); }
});

module.exports = router;
