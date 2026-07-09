const pool = require('../config/db');
const { calculateDynamicPrice } = require('../utils/pricing');
const { sendNotification, templates } = require('../utils/notifications');

const Stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const pool = require('../config/db');
const { calculateDynamicPrice } = require('../utils/pricing');
const { sendNotification, templates } = require('../utils/notifications');

const Stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

const createCheckoutSession = async (req, res) => {
  const { reservation_id, user_email, payment_type, origin } = req.body;

  if (!reservation_id) {
    return res.status(400).json({ message: 'reservation_id is required' });
  }

  try {
    // 🟢 FIXED: Removed 'status = confirmed' restriction so it accepts new/pending reservations too
    const resv = await pool.query(
      `SELECT r.*, t.table_number, rest.name AS restaurant_name
       FROM reservations r 
       JOIN tables t ON r.table_id = t.id 
       JOIN restaurants rest ON t.restaurant_id = rest.id
       WHERE r.id = $1`,
      [reservation_id]
    );
    
    if (resv.rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const r = resv.rows[0];
    const amount = parseFloat(r.deposit_amount) || 5;
    const onlineType = payment_type || r.payment_type || 'card';
    const typeLabel = { upi: 'UPI', card: 'Card', netbanking: 'Net Banking' }[onlineType] || 'Card';
    const date = String(r.reservation_date).slice(0, 10);
    const time = String(r.reservation_time).slice(0, 5);

    const clientOrigin = origin || req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null) || 'http://localhost:3000';

    // Bypassing real Stripe in local/preview development to avoid iframe blocking (which causes blank screens)
    const isDevelopmentOrPreview = !process.env.STRIPE_SECRET_KEY ||
      clientOrigin.includes('localhost') ||
      clientOrigin.includes('run.app') ||
      clientOrigin.includes('aistudio') ||
      process.env.NODE_ENV !== 'production';

    if (isDevelopmentOrPreview || !Stripe) {
      return res.json({
        mockPayment: true,
        reservation_id,
        amount,
        url: `${clientOrigin}/mock-payment?reservation_id=${reservation_id}&type=${onlineType}`,
      });
    }

    const session = await Stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user_email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Table ${r.table_number} at ${r.restaurant_name} (${typeLabel})` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: { reservation_id: String(reservation_id) },
      success_url: `${clientOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservation_id}`,
      cancel_url: `${clientOrigin}/my-reservations`,
    });

    res.json({ url: session.url, reservation_id, amount });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ message: 'Payment session failed: ' + err.message });
  }
};

const completeMockPayment = async (req, res) => {
  const reservationId = parseInt(req.params.reservation_id, 10);
  try {
    const result = await markReservationPaid(reservationId, req.app.get('io'));
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Payment failed' });
  }
};

const verifySession = async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ message: 'session_id is required' });
  try {
    if (!Stripe) return res.status(400).json({ message: 'Stripe not configured' });
    const session = await Stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') return res.status(400).json({ message: 'Payment not completed' });
    const reservationId = parseInt(session.metadata.reservation_id, 10);
    const result = await markReservationPaid(reservationId, req.app.get('io'));
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

async function markReservationPaid(reservationId, io) {
  const resv = await pool.query(
    `SELECT r.*, u.email, u.name, u.phone, t.table_number, rest.name AS restaurant_name
     FROM reservations r JOIN users u ON r.user_id = u.id
     JOIN tables t ON r.table_id = t.id JOIN restaurants rest ON t.restaurant_id = rest.id
     WHERE r.id = $1`,
    [reservationId]
  );
  if (resv.rows.length === 0) return { error: 'Reservation not found' };

  const r = resv.rows[0];
  if (r.payment_status === 'paid') {
    return { reservation_id: reservationId, confirmed: true, alreadyProcessed: true };
  }

  // Update payment status AND make sure status is set to confirmed upon payment completion!
  await pool.query(
    `UPDATE reservations SET payment_status = 'paid', status = 'confirmed', payment_method = COALESCE(payment_method, 'online') WHERE id = $1`,
    [reservationId]
  );

  const date = String(r.reservation_date).slice(0, 10);
  const time = String(r.reservation_time).slice(0, 5);

  await sendNotification({
    userId: r.user_id,
    email: r.email,
    phone: r.phone,
    type: 'payment_confirmation',
    subject: 'TableReserve — Payment Received',
    message: `Hi ${r.name},\n\nPayment of $${r.deposit_amount} received for your booking at ${r.restaurant_name}.\nTable ${r.table_number} on ${date} at ${time}.\n\nYour reservation is confirmed!`,
    io,
    socketEvent: 'notification',
    socketPayload: { type: 'payment_confirmation', message: 'Online payment received' },
  });

  return { reservation_id: reservationId, confirmed: true, message: 'Payment successful!' };
}

module.exports = { createCheckoutSession, verifySession, completeMockPayment };
const createCheckoutSession = async (req, res) => {
  const { reservation_id, user_email, payment_type, origin } = req.body;

  if (!reservation_id) {
    return res.status(400).json({ message: 'reservation_id is required' });
  }

  try {
    const resv = await pool.query(
      `SELECT r.*, t.table_number, rest.name AS restaurant_name
       FROM reservations r JOIN tables t ON r.table_id = t.id JOIN restaurants rest ON t.restaurant_id = rest.id
       WHERE r.id = $1 AND r.status = 'confirmed'`,
      [reservation_id]
    );
    if (resv.rows.length === 0) {
      return res.status(404).json({ message: 'Confirmed reservation not found' });
    }

    const r = resv.rows[0];
    const amount = parseFloat(r.deposit_amount) || 5;
    const onlineType = payment_type || r.payment_type || 'card';
    const typeLabel = { upi: 'UPI', card: 'Card', netbanking: 'Net Banking' }[onlineType] || 'Card';
    const date = String(r.reservation_date).slice(0, 10);
    const time = String(r.reservation_time).slice(0, 5);

    const clientOrigin = origin || req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null) || 'http://localhost:3000';

    // Bypassing real Stripe in local/preview development to avoid iframe blocking (which causes blank screens)
    const isDevelopmentOrPreview = !process.env.STRIPE_SECRET_KEY ||
      clientOrigin.includes('localhost') ||
      clientOrigin.includes('run.app') ||
      clientOrigin.includes('aistudio') ||
      process.env.NODE_ENV !== 'production';

    if (isDevelopmentOrPreview || !Stripe) {
      return res.json({
        mockPayment: true,
        reservation_id,
        amount,
        url: `${clientOrigin}/mock-payment?reservation_id=${reservation_id}&type=${onlineType}`,
      });
    }

    const session = await Stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user_email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Table ${r.table_number} at ${r.restaurant_name} (${typeLabel})` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: { reservation_id: String(reservation_id) },
      success_url: `${clientOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservation_id}`,
      cancel_url: `${clientOrigin}/my-reservations`,
    });

    res.json({ url: session.url, reservation_id, amount });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ message: 'Payment session failed: ' + err.message });
  }
};

const completeMockPayment = async (req, res) => {
  const reservationId = parseInt(req.params.reservation_id, 10);
  try {
    const result = await markReservationPaid(reservationId, req.app.get('io'));
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Payment failed' });
  }
};

const verifySession = async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ message: 'session_id is required' });
  try {
    if (!Stripe) return res.status(400).json({ message: 'Stripe not configured' });
    const session = await Stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') return res.status(400).json({ message: 'Payment not completed' });
    const reservationId = parseInt(session.metadata.reservation_id, 10);
    const result = await markReservationPaid(reservationId, req.app.get('io'));
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

async function markReservationPaid(reservationId, io) {
  const resv = await pool.query(
    `SELECT r.*, u.email, u.name, u.phone, t.table_number, rest.name AS restaurant_name
     FROM reservations r JOIN users u ON r.user_id = u.id
     JOIN tables t ON r.table_id = t.id JOIN restaurants rest ON t.restaurant_id = rest.id
     WHERE r.id = $1`,
    [reservationId]
  );
  if (resv.rows.length === 0) return { error: 'Reservation not found' };

  const r = resv.rows[0];
  if (r.payment_status === 'paid') {
    return { reservation_id: reservationId, confirmed: true, alreadyProcessed: true };
  }

  await pool.query(
    `UPDATE reservations SET payment_status = 'paid', payment_method = COALESCE(payment_method, 'online') WHERE id = $1`,
    [reservationId]
  );

  const date = String(r.reservation_date).slice(0, 10);
  const time = String(r.reservation_time).slice(0, 5);

  await sendNotification({
    userId: r.user_id,
    email: r.email,
    phone: r.phone,
    type: 'payment_confirmation',
    subject: 'TableReserve — Payment Received',
    message: `Hi ${r.name},\n\nPayment of $${r.deposit_amount} received for your booking at ${r.restaurant_name}.\nTable ${r.table_number} on ${date} at ${time}.\n\nYour reservation is confirmed!`,
    io,
    socketEvent: 'notification',
    socketPayload: { type: 'payment_confirmation', message: 'Online payment received' },
  });

  return { reservation_id: reservationId, confirmed: true, message: 'Payment successful!' };
}

module.exports = { createCheckoutSession, verifySession, completeMockPayment };
