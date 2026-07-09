const pool = require('../config/db');
const { sendNotification, templates } = require('../utils/notifications');

const joinWaitlist = async (req, res) => {
  const { user_id, restaurant_id, requested_date, requested_time, party_size, guest_name, guest_phone, guest_email } = req.body;

  try {
    const existing = await pool.query(
      `SELECT id FROM waitlist WHERE restaurant_id = $1 AND requested_date = $2 AND requested_time = $3
       AND user_id = $4 AND status IN ('waiting', 'notified')`,
      [restaurant_id, requested_date, requested_time, user_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You are already on the waitlist for this time slot' });
    }

    const position = await pool.query(
      `SELECT COUNT(*) FROM waitlist WHERE restaurant_id = $1 AND requested_date = $2 AND requested_time = $3 AND status = 'waiting'`,
      [restaurant_id, requested_date, requested_time]
    );

    const user = await pool.query('SELECT name, email, phone FROM users WHERE id = $1', [user_id]);
    const u = user.rows[0] || {};

    const entry = await pool.query(
      `INSERT INTO waitlist (user_id, restaurant_id, requested_date, requested_time, party_size, guest_name, guest_phone, guest_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        user_id, restaurant_id, requested_date, requested_time, party_size,
        guest_name?.trim() || u.name,
        guest_phone?.trim() || u.phone,
        (guest_email || u.email)?.toLowerCase(),
      ]
    );

    const restaurant = await pool.query('SELECT name FROM restaurants WHERE id = $1', [restaurant_id]);
    const restaurantName = restaurant.rows[0]?.name || 'the restaurant';
    const dateStr = requested_date?.slice?.(0, 10) || requested_date;
    const timeStr = requested_time?.slice?.(0, 5) || requested_time;
    const queuePos = parseInt(position.rows[0].count, 10) + 1;

    await sendNotification({
      userId: user_id,
      email: guest_email || u.email,
      phone: guest_phone || u.phone,
      type: 'waitlist_joined',
      subject: 'TableReserve — Waitlist Confirmation',
      message: templates.waitlistJoined(guest_name || u.name, restaurantName, dateStr, timeStr)
        + `\n\nYour position in queue: #${queuePos}`,
      io: req.app.get('io'),
      socketEvent: 'notification',
      socketPayload: { type: 'waitlist', message: `Added to waitlist — position #${queuePos}` },
    });

    res.status(201).json({
      ...entry.rows[0],
      queue_position: queuePos,
      message: `Added to waitlist at position #${queuePos}. No payment required.`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const leaveWaitlist = async (req, res) => {
  const { id } = req.params;
  const waitlistId = parseInt(id, 10);
  try {
    const entry = await pool.query(
      `SELECT w.*, u.email, u.phone, COALESCE(w.guest_name, u.name) AS name, r.name AS restaurant_name
       FROM waitlist w JOIN users u ON w.user_id = u.id JOIN restaurants r ON w.restaurant_id = r.id
       WHERE w.id = $1`,
      [waitlistId]
    );
    if (entry.rows.length === 0) return res.status(404).json({ message: 'Waitlist entry not found' });

    await pool.query(`UPDATE waitlist SET status = 'cancelled' WHERE id = $1`, [waitlistId]);

    const w = entry.rows[0];
    await sendNotification({
      userId: w.user_id,
      email: w.guest_email || w.email,
      phone: w.guest_phone || w.phone,
      type: 'waitlist_cancelled',
      subject: 'TableReserve — Left Waitlist',
      message: `Hi ${w.name},\n\nYou have been removed from the waitlist at ${w.restaurant_name}.`,
      io: req.app.get('io'),
      socketEvent: 'notification',
      socketPayload: { type: 'cancellation', message: 'Removed from waitlist' },
    });

    res.json({ message: 'Removed from waitlist successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyWaitlist = async (req, res) => {
  const { user_id } = req.params;
  const userIdInt = parseInt(user_id, 10);
  try {
    const result = await pool.query(
      `SELECT w.*, r.name AS restaurant_name, r.emoji,
        (SELECT COUNT(*) + 1 FROM waitlist w2 WHERE w2.restaurant_id = w.restaurant_id
         AND w2.requested_date = w.requested_date AND w2.requested_time = w.requested_time
         AND w2.status = 'waiting' AND w2.created_at < w.created_at) AS queue_position
       FROM waitlist w JOIN restaurants r ON w.restaurant_id = r.id
       WHERE w.user_id = $1 AND w.status NOT IN ('fulfilled', 'cancelled')
       ORDER BY w.created_at DESC`,
      [userIdInt]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const notifyWaitlist = async (restaurant_id, date, time, party_size, io) => {
  const result = await pool.query(
    `SELECT w.*, u.email AS user_email, u.phone AS user_phone,
            COALESCE(w.guest_email, u.email) AS notify_email,
            COALESCE(w.guest_phone, u.phone) AS notify_phone,
            COALESCE(w.guest_name, u.name) AS notify_name,
            r.name AS restaurant_name
     FROM waitlist w JOIN users u ON w.user_id = u.id JOIN restaurants r ON w.restaurant_id = r.id
     WHERE w.restaurant_id = $1 AND w.requested_date = $2 AND w.requested_time = $3
     AND w.party_size <= $4 AND w.status = 'waiting'
     ORDER BY w.created_at ASC LIMIT 1`,
    [restaurant_id, date, time, party_size]
  );

  if (result.rows.length > 0) {
    const entry = result.rows[0];
    await pool.query(`UPDATE waitlist SET status = 'notified' WHERE id = $1`, [entry.id]);

    const dateStr = date?.slice?.(0, 10) || date;
    const timeStr = time?.slice?.(0, 5) || time;

    await sendNotification({
      userId: entry.user_id,
      email: entry.notify_email,
      phone: entry.notify_phone,
      type: 'waitlist_available',
      subject: 'TableReserve — Table Available! Confirm Now',
      message: templates.waitlistAvailable(entry.notify_name, entry.restaurant_name, dateStr, timeStr)
        + '\n\nLog in to My Bookings to confirm your reservation and choose a payment method.',
      io,
      socketEvent: 'notification',
      socketPayload: {
        type: 'waitlist_available',
        message: `Table available at ${entry.restaurant_name}! Confirm in My Bookings.`,
        waitlist_id: entry.id,
        restaurant_id,
      },
    });
    return entry;
  }
  return null;
};

module.exports = { joinWaitlist, leaveWaitlist, getMyWaitlist, notifyWaitlist };
