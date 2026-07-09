const pool = require('../config/db');
const { sendNotification, templates } = require('../utils/notifications');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpForReservation(reservationId, io) {
  const resv = await pool.query(
    `SELECT r.*, u.email, u.name, u.phone FROM reservations r
     JOIN users u ON r.user_id = u.id WHERE r.id = $1`,
    [reservationId]
  );
  if (resv.rows.length === 0) return null;

  const r = resv.rows[0];
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `INSERT INTO otp_codes (user_id, reservation_id, email, phone, otp, purpose, expires_at)
     VALUES ($1,$2,$3,$4,$5,'reservation_confirm',$6)`,
    [r.user_id, reservationId, r.email.toLowerCase(), r.phone, otp, expiresAt]
  );

  await sendNotification({
    userId: r.user_id,
    email: r.email,
    phone: r.phone,
    type: 'otp',
    subject: 'TableReserve — Verification Code',
    message: templates.otp(r.name, otp),
    io,
    socketEvent: 'notification',
    socketPayload: { type: 'otp', message: 'OTP sent to your email and phone' },
  });

  console.log(`\n>>> OTP for reservation #${reservationId}: ${otp} <<<\n`);
  return { sent: true, devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined };
}

const sendOtp = async (req, res) => {
  const { reservation_id } = req.body;
  if (!reservation_id) {
    return res.status(400).json({ message: 'reservation_id is required' });
  }

  try {
    const resv = await pool.query('SELECT status FROM reservations WHERE id = $1', [reservation_id]);
    if (resv.rows.length === 0) return res.status(404).json({ message: 'Reservation not found' });
    if (resv.rows[0].status !== 'pending_otp') {
      return res.status(400).json({ message: 'OTP not required for this reservation' });
    }

    await sendOtpForReservation(reservation_id, req.app.get('io'));
    res.json({ message: 'OTP sent to your registered email and mobile number', expiresIn: 600 });
  } catch (err) {
    console.error('OTP send error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

const verifyAndConfirm = async (req, res) => {
  const { reservation_id, otp, user_id } = req.body;
  if (!reservation_id || !otp || !user_id) {
    return res.status(400).json({ message: 'reservation_id, otp, and user_id are required' });
  }

  try {
    const resv = await pool.query(
      `SELECT r.*, u.email, u.name, u.phone, t.table_number, t.restaurant_id, rest.name AS restaurant_name
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN tables t ON r.table_id = t.id
       JOIN restaurants rest ON t.restaurant_id = rest.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [reservation_id, user_id]
    );

    if (resv.rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const reservation = resv.rows[0];

    if (reservation.status === 'confirmed') {
      return res.json({ message: 'Already confirmed', reservation_id, confirmed: true });
    }

    if (reservation.status !== 'pending_otp') {
      return res.status(400).json({ message: 'This reservation cannot be confirmed' });
    }

    const otpResult = await pool.query(
      `SELECT * FROM otp_codes WHERE reservation_id = $1 AND user_id = $2 AND otp = $3
       AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [reservation_id, user_id, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new code.' });
    }

    await pool.query('UPDATE otp_codes SET used = true WHERE id = $1', [otpResult.rows[0].id]);

    const { generateQrToken } = require('./qrController');
    const qrCode = generateQrToken(reservation_id);

    await pool.query(
      `UPDATE reservations SET status = 'confirmed', otp_verified = true, qr_code = $1, payment_status = 'paid' WHERE id = $2`,
      [qrCode, reservation_id]
    );

    const date = reservation.reservation_date?.slice?.(0, 10) || reservation.reservation_date;
    const time = reservation.reservation_time?.slice?.(0, 5) || reservation.reservation_time;
    const io = req.app.get('io');

    io.to(`restaurant_${reservation.restaurant_id}`).emit('tableBooked', { id: reservation_id, table_id: reservation.table_id });
    io.to(`restaurant_${reservation.restaurant_id}`).emit('floorMapUpdate', { table_id: reservation.table_id });

    await sendNotification({
      userId: user_id,
      email: reservation.email,
      phone: reservation.phone,
      type: 'confirmation',
      subject: 'TableReserve — Booking Confirmed with QR Code',
      message: templates.bookingConfirmation(
        reservation.name, date, time, reservation.table_number, reservation.restaurant_name, qrCode
      ),
      io,
      socketEvent: 'notification',
      socketPayload: { type: 'confirmation', message: `Booking confirmed! Table ${reservation.table_number}` },
    });

    res.json({
      message: 'Reservation confirmed successfully!',
      confirmed: true,
      reservation_id,
      qr_code: qrCode,
    });
  } catch (err) {
    console.error('OTP confirm error:', err.message);
    res.status(500).json({ message: 'Confirmation failed' });
  }
};

module.exports = { sendOtp, verifyAndConfirm, sendOtpForReservation };
