const pool = require('../config/db');

const getAvailableTables = async (req, res) => {
  const { date, time, party_size, restaurant_id } = req.query;
  if (!date || !time || !party_size || !restaurant_id) {
    return res.status(400).json({ message: 'date, time, party_size, and restaurant_id are required' });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM tables WHERE capacity >= $1 AND restaurant_id = $2
       AND id NOT IN (
         SELECT table_id FROM reservations
         WHERE reservation_date = $3 AND reservation_time = $4
         AND status IN ('confirmed', 'checked_in', 'pending_payment')
       )
       ORDER BY capacity ASC`,
      [party_size, restaurant_id, date, time]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAvailableTables };
