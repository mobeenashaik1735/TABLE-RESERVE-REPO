const pool = require('../config/db');

const getTables = async (req, res) => {
  const { restaurant_id } = req.query;
  try {
    let result;
    if (restaurant_id) {
      result = await pool.query(
        'SELECT * FROM tables WHERE restaurant_id = $1 ORDER BY table_number',
        [restaurant_id]
      );
    } else {
      result = await pool.query('SELECT * FROM tables ORDER BY table_number');
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const createTable = async (req, res) => {
  const { table_number, capacity, location, restaurant_id } = req.body;
  try {
    const newTable = await pool.query(
      'INSERT INTO tables (table_number, capacity, location, restaurant_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [table_number, capacity, location, restaurant_id]
    );
    res.status(201).json(newTable.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTable = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tables WHERE id = $1', [id]);
    res.json({ message: 'Table deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
// UPDATE table position (drag-and-drop)
const updateTablePosition = async (req, res) => {
  const { id } = req.params;
  const { x_position, y_position } = req.body;
  try {
    const updated = await pool.query(
      'UPDATE tables SET x_position = $1, y_position = $2 WHERE id = $3 RETURNING *',
      [x_position, y_position, id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
module.exports = { getTables, createTable, deleteTable, updateTablePosition };
