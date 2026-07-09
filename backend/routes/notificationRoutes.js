const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/:user_id', async (req, res) => {
  const userId = parseInt(req.params.user_id, 10);
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to get notifications:', err.message);
    res.status(500).json({ message: 'Failed to retrieve notifications' });
  }
});

module.exports = router;
