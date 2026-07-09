const pool = require('../config/db');

const STATUS_COLORS = {
  available: { color: '#22c55e', label: 'Available', emoji: '🟢' },
  reserved: { color: '#eab308', label: 'Reserved', emoji: '🟡' },
  occupied: { color: '#ef4444', label: 'Occupied', emoji: '🔴' },
  cleaning: { color: '#3b82f6', label: 'Cleaning', emoji: '🔵' },
};

function getTableStatus(table, reservation, date, time) {
  if (!reservation) return 'available';

  const now = new Date();
  const resDate = reservation.reservation_date?.slice?.(0, 10) || reservation.reservation_date;
  const resTime = reservation.reservation_time?.slice?.(0, 5) || reservation.reservation_time;
  const today = now.toISOString().slice(0, 10);

  if (resDate === date && resTime === time.slice(0, 5)) {
    if (today === date) {
      const [h, m] = resTime.split(':').map(Number);
      const resDateTime = new Date(`${date}T${resTime}`);
      const endTime = new Date(resDateTime.getTime() + 90 * 60 * 1000);
      const cleanEnd = new Date(endTime.getTime() + 30 * 60 * 1000);

      if (now >= resDateTime && now <= endTime) return 'occupied';
      if (now > endTime && now <= cleanEnd) return 'cleaning';
    }
    return 'reserved';
  }

  return 'available';
}

const getFloorMap = async (req, res) => {
  const { restaurant_id, date, time } = req.query;

  if (!restaurant_id || !date || !time) {
    return res.status(400).json({ message: 'restaurant_id, date, and time are required' });
  }

  try {
    const tablesResult = await pool.query(
      'SELECT * FROM tables WHERE restaurant_id = $1 ORDER BY table_number',
      [restaurant_id]
    );

    const reservationsResult = await pool.query(
      `SELECT r.*, t.id AS table_id FROM reservations r
       JOIN tables t ON r.table_id = t.id
       WHERE t.restaurant_id = $1 AND r.reservation_date = $2
       AND r.status IN ('confirmed', 'pending_payment', 'checked_in')`,
      [restaurant_id, date]
    );

    const resByTable = {};
    reservationsResult.rows.forEach((r) => {
      resByTable[r.table_id] = r;
    });

    const floorMap = tablesResult.rows.map((table) => {
      const reservation = resByTable[table.id];
      const status = getTableStatus(table, reservation, date, time);
      return {
        ...table,
        status,
        statusInfo: STATUS_COLORS[status],
        reservation: reservation
          ? {
              id: reservation.id,
              time: reservation.reservation_time,
              party_size: reservation.party_size,
            }
          : null,
      };
    });

    const summary = {
      available: floorMap.filter((t) => t.status === 'available').length,
      reserved: floorMap.filter((t) => t.status === 'reserved').length,
      occupied: floorMap.filter((t) => t.status === 'occupied').length,
      cleaning: floorMap.filter((t) => t.status === 'cleaning').length,
    };

    res.json({ tables: floorMap, summary, legend: STATUS_COLORS });
  } catch (err) {
    console.error('Floor map error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getFloorMap, STATUS_COLORS };
