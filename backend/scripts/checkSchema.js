const pool = require('../config/db');

async function main() {
  const restaurants = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='restaurants' ORDER BY ordinal_position"
  );
  const users = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position"
  );
  const tables = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='tables' ORDER BY ordinal_position"
  );
  const count = await pool.query('SELECT COUNT(*) FROM restaurants');
  const tableCount = await pool.query('SELECT COUNT(*) FROM tables');
  console.log('restaurants cols:', restaurants.rows);
  console.log('users cols:', users.rows.map((r) => r.column_name));
  console.log('tables cols:', tables.rows.map((r) => r.column_name));
  console.log('restaurant count:', count.rows[0].count);
  console.log('table count:', tableCount.rows[0].count);
  pool.end();
}

main().catch((e) => {
  console.error(e.message);
  pool.end();
});
