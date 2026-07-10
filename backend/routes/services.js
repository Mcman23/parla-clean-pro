// backend/routes/services.js
const router = require('express').Router();
const { Service } = require('../models');

// GET /api/services (public — frontend needs this)
router.get('/', async (req, res, next) => {
  try {
    const services = await Service.findAll({ where: { status: 'aktiv' }, order: [['id', 'ASC']] });
    res.json(services);
  } catch (err) { next(err); }
});

// GET /api/services/all (admin — includes passiv)
router.get('/all', async (req, res, next) => {
  try {
    const services = await Service.findAll({ order: [['id', 'ASC']] });
    res.json(services);
  } catch (err) { next(err); }
});

// GET /api/services/:id
router.get('/:id', async (req, res, next) => {
  try {
    const svc = await Service.findByPk(req.params.id);
    if (!svc) return res.status(404).json({ error: 'Xidmət tapılmadı' });
    res.json(svc);
  } catch (err) { next(err); }
});

// POST /api/services
router.post('/', require('../middleware/auth'), async (req, res, next) => {
  try {
    const { name, price, workers } = req.body;
    const svc = await Service.create({ name, price, workers });
    res.status(201).json(svc);
  } catch (err) { next(err); }
});

// PUT /api/services/:id
router.put('/:id', require('../middleware/auth'), async (req, res, next) => {
  try {
    const svc = await Service.findByPk(req.params.id);
    if (!svc) return res.status(404).json({ error: 'Xidmət tapılmadı' });
    const { name, price, workers, status } = req.body;
    await svc.update({ name, price, workers, status });
    res.json(svc);
  } catch (err) { next(err); }
});

// DELETE /api/services/:id
router.delete('/:id', require('../middleware/auth'), async (req, res, next) => {
  try {
    const svc = await Service.findByPk(req.params.id);
    if (!svc) return res.status(404).json({ error: 'Xidmət tapılmadı' });
    await svc.destroy();
    res.json({ message: 'Xidmət silindi' });
  } catch (err) { next(err); }
});

module.exports = router;
