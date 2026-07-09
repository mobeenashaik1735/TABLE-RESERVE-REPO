const QRCode = require('qrcode');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendNotification, templates } = require('../utils/notifications');

function generateQrToken(reservationId) {
  const hash = crypto.createHmac('sha256', process.env.JWT_SECRET || 'qr-secret')
    .update(String(reservationId))
    .digest('hex')
    .slice(0, 12);
  return `TR-${reservationId}-${hash}`;
}

const getReservationQr = async (req, res) => {
  const { id } = req.params;
  const reservationId = parseInt(id, 10);
  try {
    const result = await pool.query(
      `SELECT r.*, t.table_number, rest.name AS restaurant_name, u.name AS user_name
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       JOIN restaurants rest ON t.restaurant_id = rest.id
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1 AND r.status IN ('confirmed', 'checked_in')`,
      [reservationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Confirmed reservation not found' });
    }

    const reservation = result.rows[0];
    const qrToken = reservation.qr_code || generateQrToken(reservationId);

    if (!reservation.qr_code) {
      await pool.query('UPDATE reservations SET qr_code = $1 WHERE id = $2', [qrToken, reservationId]);
    }

    const qrDataUrl = await QRCode.toDataURL(qrToken, { width: 256, margin: 2 });

    res.json({
      qr_code: qrToken,
      qr_image: qrDataUrl,
      reservation: {
        id: reservation.id,
        date: reservation.reservation_date,
        time: reservation.reservation_time,
        table_number: reservation.table_number,
        restaurant_name: reservation.restaurant_name,
        user_name: reservation.user_name,
        party_size: reservation.party_size,
        status: reservation.status,
        checked_in: reservation.checked_in,
      },
    });
  } catch (err) {
    console.error('QR generate error:', err.message);
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
};

const verifyQr = async (req, res) => {
  const { qr_code, check_in } = req.body;
  if (!qr_code) {
    return res.status(400).json({ message: 'QR code is required' });
  }

  try {
    const result = await pool.query(
      `SELECT r.*, t.table_number, t.location, rest.name AS restaurant_name, u.name AS user_name, u.email, u.phone
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       JOIN restaurants rest ON t.restaurant_id = rest.id
       JOIN users u ON r.user_id = u.id
       WHERE r.qr_code = $1 AND r.status IN ('confirmed', 'checked_in')`,
      [qr_code.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid QR code or reservation not confirmed', valid: false });
    }

    const r = result.rows[0];

    if (r.qr_used || r.checked_in) {
      return res.status(400).json({
        valid: false,
        alreadyUsed: true,
        message: 'This QR code has already been used for check-in',
        reservation: {
          id: r.id,
          user_name: r.user_name,
          checked_in_at: r.checked_in_at,
          status: r.status,
        },
      });
    }

    if (check_in) {
      await pool.query(
        `UPDATE reservations SET checked_in = true, qr_used = true, checked_in_at = NOW(), status = 'checked_in' WHERE id = $1`,
        [r.id]
      );

      await sendNotification({
        userId: r.user_id,
        email: r.email,
        phone: r.phone,
        type: 'check_in',
        subject: 'TableReserve — Checked In',
        message: templates.checkIn(r.user_name, r.table_number, r.restaurant_name),
        io: req.app.get('io'),
        socketEvent: 'notification',
        socketPayload: { type: 'check_in', message: `Checked in at Table ${r.table_number}` },
      });
    }

    res.json({
      valid: true,
      checked_in: !!check_in,
      message: check_in ? 'Guest checked in successfully!' : 'Reservation verified successfully',
      reservation: {
        id: r.id,
        user_name: r.user_name,
        email: r.email,
        date: r.reservation_date,
        time: r.reservation_time,
        table_number: r.table_number,
        location: r.location,
        restaurant_name: r.restaurant_name,
        party_size: r.party_size,
        status: check_in ? 'checked_in' : r.status,
      },
    });
  } catch (err) {
    console.error('QR verify error:', err.message);
    res.status(500).json({ message: 'QR verification failed' });
  }
};

module.exports = { getReservationQr, verifyQr, generateQrToken };
