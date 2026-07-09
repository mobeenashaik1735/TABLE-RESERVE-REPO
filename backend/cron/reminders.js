const cron = require('node-cron');
const pool = require('../config/db');
const { sendNotification, templates } = require('../utils/notifications');

function startReminderCron(io) {
  cron.schedule('*/15 * * * *', async () => {
    try {
      let rows = [];
      if (pool.isSQLite) {
        // Fetch candidate reservations and filter in JS to avoid time/date casting errors in SQLite
        const result = await pool.query(
          `SELECT r.*, u.email, u.name, u.phone, t.table_number, rest.name AS restaurant_name
           FROM reservations r
           JOIN users u ON r.user_id = u.id
           JOIN tables t ON r.table_id = t.id
           JOIN restaurants rest ON t.restaurant_id = rest.id
           WHERE r.status IN ('confirmed', 'checked_in')
           AND r.reminder_sent = $1`,
          [false]
        );

        const now = new Date();
        const minTime = now.getTime() + 45 * 60 * 1000;
        const maxTime = now.getTime() + 75 * 60 * 1000;

        rows = result.rows.filter(r => {
          try {
            const dateStr = String(r.reservation_date).slice(0, 10);
            const timeStr = String(r.reservation_time).slice(0, 5);
            const bookingDateTime = new Date(`${dateStr}T${timeStr}:00`);
            const timeMs = bookingDateTime.getTime();
            return timeMs >= minTime && timeMs <= maxTime;
          } catch (e) {
            return false;
          }
        });
      } else {
        const result = await pool.query(
          `SELECT r.*, u.email, u.name, u.phone, t.table_number, rest.name AS restaurant_name
           FROM reservations r
           JOIN users u ON r.user_id = u.id
           JOIN tables t ON r.table_id = t.id
           JOIN restaurants rest ON t.restaurant_id = rest.id
           WHERE r.status IN ('confirmed', 'checked_in')
           AND r.reminder_sent = false
           AND (r.reservation_date + r.reservation_time)::timestamp
               BETWEEN NOW() + INTERVAL '45 minutes' AND NOW() + INTERVAL '75 minutes'`
        );
        rows = result.rows;
      }

      for (const r of rows) {
        const date = r.reservation_date?.slice?.(0, 10) || r.reservation_date;
        const time = r.reservation_time?.slice?.(0, 5) || r.reservation_time;

        await sendNotification({
          userId: r.user_id,
          email: r.email,
          phone: r.phone,
          type: 'reminder',
          subject: 'TableReserve — Reservation Reminder (1 hour)',
          message: templates.reminder(r.name, date, time, r.table_number, r.restaurant_name),
          io,
          socketEvent: 'notification',
          socketPayload: { type: 'reminder', message: `Reminder: Table ${r.table_number} at ${time}` },
        });

        await pool.query('UPDATE reservations SET reminder_sent = $1 WHERE id = $2', [true, r.id]);
      }

      if (rows.length > 0) {
        console.log(`Sent ${rows.length} reservation reminder(s)`);
      }
    } catch (err) {
      console.error('Reminder cron error:', err.message);
    }
  });

  console.log('Reminder cron scheduled (every 15 min)');
}

module.exports = { startReminderCron };
