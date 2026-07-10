const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[DB Error] No DATABASE_URL found in environment variables!');
}

// Create a single connection pool for Postgres
const pool = new Pool({
  connectionString: connectionString,
  // Required for connecting securely to cloud databases like Render Postgres
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000 // Gives the database 10 full seconds to handle handshakes
});

pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL successfully.');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle database client:', err.message);
});

// Export a interface matching your previous code's architecture exactly
module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  end: () => pool.end()
};
