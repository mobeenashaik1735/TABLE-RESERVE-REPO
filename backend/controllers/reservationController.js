const pool = require('../config/db');
const { notifyWaitlist } = require('./waitlistController');
const { sendNotification, templates } = require('../utils/notifications');

const getMyReservations = async (req, res) => {
  const { user_id } = req.params;
  const userIdInt = parseInt(user_id, 10);
  try {
    const result = await pool.query(
      `SELECT r.*, t.table_number, t.location, rest.name AS restaurant_name, rest.emoji
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       JOIN restaurants rest ON t.restaurant_id = rest.id
       WHERE r.user_id = $1
       ORDER BY r.reservation_date DESC, r.reservation_time DESC`,
      [userIdInt]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const cancelReservation = async (req, res) => {
  const { id } = req.params;
  const reservationId = parseInt(id, 10);
  try {
    const resv = await pool.query(
      `SELECT r.*, u.email, u.name, u.phone, t.table_number, t.restaurant_id, rest.name AS restaurant_name
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN tables t ON r.table_id = t.id
       JOIN restaurants rest ON t.restaurant_id = rest.id
       WHERE r.id = $1`,
      [reservationId]
    );

    if (resv.rows.length === 0) return res.status(404).json({ message: 'Reservation not found' });
    const r = resv.rows[0];
    if (r.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

    await pool.query(`UPDATE reservations SET status = 'cancelled' WHERE id = $1`, [reservationId]);

    await notifyWaitlist(r.restaurant_id, r.reservation_date, r.reservation_time, r.party_size, req.app.get('io'));

    const date = r.reservation_date?.slice?.(0, 10) || r.reservation_date;
    const time = r.reservation_time?.slice?.(0, 5) || r.reservation_time;

    await sendNotification({
      userId: r.user_id,
      email: r.email,
      phone: r.phone,
      type: 'cancellation',
      subject: 'TableReserve — Booking Cancelled',
      message: templates.cancellation(r.name, date, time, r.restaurant_name),
      io: req.app.get('io'),
      socketEvent: 'notification',
      socketPayload: { type: 'cancellation', message: 'Your booking was cancelled' },
    });

    const io = req.app.get('io');
    io.to(`restaurant_${r.restaurant_id}`).emit('tableCancelled', { table_id: r.table_id });
    io.to(`restaurant_${r.restaurant_id}`).emit('floorMapUpdate', { table_id: r.table_id });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMyReservations, cancelReservation };
