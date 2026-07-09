const pool = require('../config/db');
const { generateQrToken } = require('./qrController');
const { sendNotification, templates } = require('../utils/notifications');
const { calculateDynamicPrice } = require('../utils/pricing');

async function assertTableAvailable(table_id, date, time) {
  const conflict = await pool.query(
    `SELECT id FROM reservations WHERE table_id = $1 AND reservation_date = $2 AND reservation_time = $3
     AND status IN ('confirmed', 'checked_in')`,
    [table_id, date, time]
  );
  return conflict.rows.length === 0;
}

async function finalizeReservation(reservationId, io) {
  const resv = await pool.query(
    `SELECT r.*, u.email, u.name, u.phone, t.table_number, t.restaurant_id, rest.name AS restaurant_name
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     JOIN tables t ON r.table_id = t.id
     JOIN restaurants rest ON t.restaurant_id = rest.id
     WHERE r.id = $1`,
    [reservationId]
  );
  if (resv.rows.length === 0) return null;

  const r = resv.rows[0];
  const qrCode = r.qr_code || generateQrToken(reservationId);

  if (!r.qr_code) {
    await pool.query(
      `UPDATE reservations SET status = 'confirmed', qr_code = $1 WHERE id = $2`,
      [qrCode, reservationId]
    );
  }

  const date = r.reservation_date?.slice?.(0, 10) || r.reservation_date;
  const time = r.reservation_time?.slice?.(0, 5) || r.reservation_time;

  if (io) {
    io.to(`restaurant_${r.restaurant_id}`).emit('tableBooked', { id: reservationId });
    io.to(`restaurant_${r.restaurant_id}`).emit('floorMapUpdate', { table_id: r.table_id });
  }

  await sendNotification({
    userId: r.user_id,
    email: r.email,
    phone: r.phone,
    type: 'confirmation',
    subject: 'TableReserve — Booking Confirmed',
    message: templates.bookingConfirmation(r.name, date, time, r.table_number, r.restaurant_name, qrCode),
    io,
    socketEvent: 'notification',
    socketPayload: { type: 'confirmation', message: `Booking confirmed! Table ${r.table_number}` },
  });

  return { ...r, qr_code: qrCode, status: 'confirmed' };
}

const confirmReservation = async (req, res) => {
  const {
    user_id, table_id, restaurant_id, reservation_date, reservation_time,
    party_size, waitlist_id,
  } = req.body;

  if (!user_id || !table_id || !reservation_date || !reservation_time || !party_size) {
    return res.status(400).json({ message: 'Missing required booking fields' });
  }

  try {
    const tableCheck = await pool.query(
      'SELECT id, capacity, table_number FROM tables WHERE id = $1 AND restaurant_id = $2',
      [table_id, restaurant_id]
    );
    if (tableCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }
    if (tableCheck.rows[0].capacity < parseInt(party_size, 10)) {
      return res.status(400).json({ message: `Table ${tableCheck.rows[0].table_number} cannot seat ${party_size} guests` });
    }

    if (!(await assertTableAvailable(table_id, reservation_date, reservation_time))) {
      return res.status(409).json({ message: 'This table was just booked. Please choose another table.' });
    }

    const pricing = calculateDynamicPrice(reservation_date, reservation_time);
    const qrCode = generateQrToken(`new-${Date.now()}`);

    const inserted = await pool.query(
      `INSERT INTO reservations (user_id, table_id, reservation_date, reservation_time, party_size,
        deposit_amount, pricing_tier, payment_status, status, qr_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending','confirmed',$8) RETURNING *`,
      [user_id, table_id, reservation_date, reservation_time, party_size, pricing.amount, pricing.tier, qrCode]
    );

    const reservationId = inserted.rows[0].id;
    const finalQr = generateQrToken(reservationId);
    await pool.query('UPDATE reservations SET qr_code = $1 WHERE id = $2', [finalQr, reservationId]);

    const confirmed = await finalizeReservation(reservationId, req.app.get('io'));

    if (waitlist_id) {
      await pool.query(`UPDATE waitlist SET status = 'fulfilled' WHERE id = $1`, [waitlist_id]);
    }

    res.status(201).json({
      message: 'Reservation confirmed successfully!',
      reservation: { ...confirmed, id: reservationId, qr_code: finalQr },
    });
  } catch (err) {
    console.error('Confirm reservation error:', err.message, err.detail || '');
    res.status(500).json({ message: err.detail || err.message || 'Failed to confirm reservation' });
  }
};

const applyPayment = async (req, res) => {
  const { reservation_id, payment_method, payment_type, user_id } = req.body;

  if (!reservation_id || !payment_method || !payment_type || !user_id) {
    return res.status(400).json({ message: 'reservation_id, payment_method, payment_type, and user_id are required' });
  }

  try {
    const resv = await pool.query(
      'SELECT * FROM reservations WHERE id = $1 AND user_id = $2 AND status = $3',
      [reservation_id, user_id, 'confirmed']
    );
    if (resv.rows.length === 0) {
      return res.status(404).json({ message: 'Confirmed reservation not found' });
    }

    if (payment_method === 'pay_at_restaurant') {
      if (!['cash', 'upi'].includes(payment_type)) {
        return res.status(400).json({ message: 'Pay at restaurant requires cash or upi' });
      }
      await pool.query(
        `UPDATE reservations SET payment_method = 'pay_at_restaurant', payment_type = $1, payment_status = 'pay_at_restaurant' WHERE id = $2`,
        [payment_type, reservation_id]
      );
      return res.json({
        message: 'Payment set to Pay at Restaurant. Reservation remains confirmed.',
        reservation_id,
        payment_complete: true,
      });
    }

    if (payment_method === 'online') {
      await pool.query(
        `UPDATE reservations SET payment_method = 'online', payment_type = $1 WHERE id = $2`,
        [payment_type, reservation_id]
      );
      return res.json({
        message: 'Proceed to online payment',
        reservation_id,
        payment_complete: false,
        requires_checkout: true,
      });
    }

    return res.status(400).json({ message: 'Invalid payment method' });
  } catch (err) {
    console.error('Apply payment error:', err.message);
    res.status(500).json({ message: 'Failed to apply payment method' });
  }
};

const getUnifiedBookings = async (req, res) => {
  const { user_id } = req.params;
  const userIdInt = parseInt(user_id, 10);
  try {
    const reservations = await pool.query(
      `SELECT r.id, r.reservation_date, r.reservation_time, r.party_size, r.status,
              r.payment_method, r.payment_type, r.payment_status, r.deposit_amount,
              r.qr_code, r.checked_in, t.table_number, t.location,
              rest.name AS restaurant_name, rest.emoji, rest.id AS restaurant_id
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       JOIN restaurants rest ON t.restaurant_id = rest.id
       WHERE r.user_id = $1
       ORDER BY r.reservation_date DESC, r.reservation_time DESC`,
      [userIdInt]
    );

    const waitlist = await pool.query(
      `SELECT w.id, w.requested_date, w.requested_time, w.party_size, w.status, w.restaurant_id,
              rest.name AS restaurant_name, rest.emoji,
              (SELECT COUNT(*) + 1 FROM waitlist w2
               WHERE w2.restaurant_id = w.restaurant_id AND w2.requested_date = w.requested_date
               AND w2.requested_time = w.requested_time AND w2.status = 'waiting'
               AND w2.created_at < w.created_at) AS queue_position
       FROM waitlist w JOIN restaurants rest ON w.restaurant_id = rest.id
       WHERE w.user_id = $1 AND w.status NOT IN ('fulfilled', 'cancelled')
       ORDER BY w.created_at DESC`,
      [userIdInt]
    );

    const today = new Date().toISOString().slice(0, 10);

    const resBookings = reservations.rows.map((r) => {
      let bookingStatus = r.status;
      if (['confirmed', 'checked_in'].includes(r.status) && String(r.reservation_date).slice(0, 10) < today) {
        bookingStatus = 'completed';
      }
      return {
        id: r.id,
        booking_type: 'reservation',
        reservation_id: r.id,
        restaurant_id: r.restaurant_id,
        restaurant_name: r.restaurant_name,
        emoji: r.emoji,
        table_number: r.table_number,
        location: r.location,
        date: r.reservation_date,
        time: r.reservation_time,
        party_size: r.party_size,
        payment_method: !r.payment_method ? 'Not Selected' : r.payment_method === 'online' ? 'Online' : 'Pay at Restaurant',
        payment_type: r.payment_type?.toUpperCase() || '—',
        payment_status: r.payment_status === 'paid' ? 'Paid' : r.payment_status === 'pay_at_restaurant' ? 'Pay at Restaurant' : r.payment_status === 'pending' ? 'Pending' : r.payment_status,
        booking_status: bookingStatus,
        queue_position: null,
        waitlist_id: null,
      };
    });

    const waitBookings = waitlist.rows.map((w) => ({
      id: `w-${w.id}`,
      booking_type: 'waitlist',
      waitlist_id: w.id,
      reservation_id: null,
      restaurant_id: w.restaurant_id,
      restaurant_name: w.restaurant_name,
      emoji: w.emoji,
      table_number: null,
      location: null,
      date: w.requested_date,
      time: w.requested_time,
      party_size: w.party_size,
      payment_method: '—',
      payment_type: '—',
      payment_status: 'Not Required',
      booking_status: w.status === 'notified' ? 'notified' : 'waiting',
      queue_position: w.status === 'waiting' ? parseInt(w.queue_position, 10) : null,
    }));

    res.json([...resBookings, ...waitBookings]);
  } catch (err) {
    console.error('Unified bookings error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  confirmReservation,
  applyPayment,
  getUnifiedBookings,
  finalizeReservation,
  assertTableAvailable,
};
