// backend/routes/auth.js
const router = require('express').Router()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const config = require('../config')
const { User } = require('../models')
const auth = require('../middleware/auth')

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'İstifadəçi adı və şifrə tələb olunur' })

    const user = await User.findOne({ where: { username } })
    if (!user) return res.status(401).json({ error: 'İstifadəçi tapılmadı' })

    if (user.password !== md5(password)) return res.status(401).json({ error: 'Yanlış şifrə' })

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } })
  } catch (err) { next(err) }
})

// GET /api/auth/me
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'email', 'role'] })
    if (!user) return res.status(404).json({ error: 'İstifadəçi tapılmadı' })
    res.json(user)
  } catch (err) { next(err) }
})

// POST /api/auth/register (admin-only)
router.post('/register', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yalnız admin' })
    const { username, email, password, role } = req.body
    const user = await User.create({ username, email, password: md5(password), role: role || 'staff' })
    res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role })
  } catch (err) { next(err) }
})

module.exports = router
