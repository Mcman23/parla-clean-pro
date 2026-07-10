const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// POST /api/contact — əlaqə forması
router.post('/contact', async (req, res) => {
  try {
    const { name, phone, email, service, message } = req.body;

    if (!name || !phone || !service) {
      return res.status(400).json({ message: 'Ad, telefon və xidmət növü tələb olunur' });
    }

    const [result] = await pool.execute(
      'INSERT INTO Contacts (name, phone, email, service, message) VALUES (?, ?, ?, ?, ?)',
      [name, phone, email || null, service, message || null]
    );

    res.status(201).json({
      message: 'Müraciətiniz uğurla qeydə alındı!',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

module.exports = router;
