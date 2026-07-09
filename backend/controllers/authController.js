const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// REGISTER
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'customer') RETURNING id, name, email, role",
      [name.trim(), normalizedEmail, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'User account not found. Please register first.' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar_color: user.avatar_color,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, avatar_color, created_at FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const reservations = await pool.query(
      `SELECT COUNT(*) FROM reservations WHERE user_id = $1 AND status != 'cancelled'`,
      [id]
    );
    res.json({
      ...result.rows[0],
      total_reservations: parseInt(reservations.rows[0].count, 10),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  try {
    const updated = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3 RETURNING id, name, email, role, phone, avatar_color, created_at',
      [name, phone, id]
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getUserProfile, updateProfile };