const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Bütün admin route-ları auth tələb edir
router.use(authMiddleware);

// GET /api/admin/contacts — bütün müraciətlər
router.get('/contacts', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM Contacts ORDER BY createdAt DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// PUT /api/admin/contacts/:id — status yenilə
router.put('/contacts/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['yeni', 'baxildi', 'tamamlandi'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Yanlış status' });
    }
    await pool.execute(
      'UPDATE Contacts SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ message: 'Status yeniləndi' });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// DELETE /api/admin/contacts/:id
router.delete('/contacts/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM Contacts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Silindi' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// GET /api/admin/stats — dashboard statistika
router.get('/stats', async (req, res) => {
  try {
    const [[total]] = await pool.execute('SELECT COUNT(*) as count FROM Contacts');
    const [[yeni]] = await pool.execute("SELECT COUNT(*) as count FROM Contacts WHERE status = 'yeni'");
    const [[tamamlandi]] = await pool.execute("SELECT COUNT(*) as count FROM Contacts WHERE status = 'tamamlandi'");
    res.json({
      total: total.count,
      yeni: yeni.count,
      tamamlandi: tamamlandi.count,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

module.exports = router;
