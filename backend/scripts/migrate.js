const pool = require('../config/db');

async function migrate() {
  console.log('Clearing old structures to avoid column caching...');
  
  // Clean sweep to force perfectly clean schema application
  await pool.query('DROP TABLE IF EXISTS pending_bookings CASCADE;');
  await pool.query('DROP TABLE IF EXISTS otp_codes CASCADE;');
  await pool.query('DROP TABLE IF EXISTS waitlist CASCADE;');
  await pool.query('DROP TABLE IF EXISTS reservations CASCADE;');
  await pool.query('DROP TABLE IF EXISTS tables CASCADE;');
  await pool.query('DROP TABLE IF EXISTS restaurants CASCADE;');
  await pool.query('DROP TABLE IF EXISTS users CASCADE;');

  console.log('Starting full database structure creation...');

  // 1. Create Users Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'customer',
      phone VARCHAR(20),
      avatar_color VARCHAR(30) DEFAULT 'indigo',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 2. Create Restaurants Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      description TEXT,
      address VARCHAR(255),
      city VARCHAR(100),
      opening_time VARCHAR(10),
      closing_time VARCHAR(10),
      slot_duration INTEGER DEFAULT 60,
      cuisine_type VARCHAR(50),
      theme_color VARCHAR(30) DEFAULT 'ocean',
      emoji VARCHAR(10) DEFAULT '🍽️',
      rating DECIMAL(2,1) DEFAULT 4.5,
      price_range VARCHAR(5) DEFAULT '$$',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 3. Create Tables Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tables (
      id SERIAL PRIMARY KEY,
      restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
      table_number VARCHAR(50) NOT NULL,
      capacity INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'available',
      location VARCHAR(255),
      x_position INTEGER,
      y_position INTEGER,
      table_type VARCHAR(30) DEFAULT 'standard',
      is_vip BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 4. Create Reservations Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      table_id INTEGER REFERENCES tables(id) ON DELETE CASCADE,
      restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
      reservation_date DATE NOT NULL,
      reservation_time TIME NOT NULL,
      party_size INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'confirmed',
      deposit_amount DECIMAL(8,2) DEFAULT 5.00,
      pricing_tier VARCHAR(30) DEFAULT 'standard',
      qr_code VARCHAR(100),
      otp_verified BOOLEAN DEFAULT false,
      reminder_sent BOOLEAN DEFAULT false,
      payment_status VARCHAR(20) DEFAULT 'pending',
      payment_method VARCHAR(30),
      payment_type VARCHAR(30),
      checked_in BOOLEAN DEFAULT false,
      qr_used BOOLEAN DEFAULT false,
      checked_in_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 5. Create Waitlist Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
      requested_date DATE NOT NULL,
      requested_time TIME NOT NULL,
      party_size INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'waiting',
      guest_name VARCHAR(100),
      guest_phone VARCHAR(20),
      guest_email VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 6. Create OTP Codes Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      otp VARCHAR(6) NOT NULL,
      purpose VARCHAR(50) DEFAULT 'booking',
      used BOOLEAN DEFAULT false,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 7. Create Pending Bookings Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pending_bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      table_id INTEGER REFERENCES tables(id) ON DELETE CASCADE,
      restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
      reservation_date DATE NOT NULL,
      reservation_time TIME NOT NULL,
      party_size INTEGER NOT NULL,
      amount DECIMAL(8,2) NOT NULL,
      pricing_tier VARCHAR(30) DEFAULT 'standard',
      payment_method VARCHAR(30) DEFAULT 'online',
      payment_type VARCHAR(30) DEFAULT 'card',
      stripe_session_id VARCHAR(255),
      waitlist_id INTEGER,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('Migration completed successfully.');
}

module.exports = migrate;
