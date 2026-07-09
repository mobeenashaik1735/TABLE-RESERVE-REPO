const pool = require('../config/db');

const getRestaurants = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurants ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRestaurantById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const createRestaurant = async (req, res) => {
  const { owner_id, name, description, address, city, opening_time, closing_time, slot_duration, cuisine_type, theme_color, emoji, rating, price_range } = req.body;
  try {
    const newRestaurant = await pool.query(
      `INSERT INTO restaurants (owner_id, name, description, address, city, opening_time, closing_time, slot_duration, cuisine_type, theme_color, emoji, rating, price_range)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [owner_id, name, description, address, city, opening_time || '09:00', closing_time || '22:00', slot_duration || 60, cuisine_type || 'International', theme_color || 'ocean', emoji || '🍽️', rating || 4.5, price_range || '$$']
    );
    res.status(201).json(newRestaurant.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyRestaurants = async (req, res) => {
  const { owner_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM restaurants WHERE owner_id = $1', [owner_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getRestaurants, getRestaurantById, createRestaurant, getMyRestaurants };