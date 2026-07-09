const sendEmail = require('./mailer');
const sendSms = require('./sms');
const pool = require('../config/db');

async function sendNotification({ userId, email, phone, type, subject, message, io, socketEvent, socketPayload }) {
  const results = { email: null, sms: null };

  if (email) {
    results.email = await sendEmail(email, subject, message);
  }

  if (phone) {
    results.sms = await sendSms(phone, `${subject}\n\n${message}`);
  }

  if (io && socketEvent && userId) {
    io.to(`user_${userId}`).emit(socketEvent, socketPayload || { type, message });
  }

  const sent_via_smtp = !!(results.email && results.email.sent);
  const sent_via_sms = !!(results.sms && results.sms.sent);

  try {
    await pool.query(
      `INSERT INTO notifications (user_id, email, phone, type, subject, message, sent_via_smtp, sent_via_sms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId || null, email || null, phone || null, type || 'general', subject || '', message || '', sent_via_smtp, sent_via_sms]
    );
  } catch (err) {
    console.error('Failed to save notification to DB:', err.message);
  }

  console.log(`[Notification] ${type} → user ${userId || email}${phone ? ` / ${phone}` : ''}`);
  return results;
}

const templates = {
  bookingConfirmation: (name, date, time, tableNumber, restaurantName, qrCode) =>
    `Hi ${name},\n\nYour table reservation is CONFIRMED!\n\nRestaurant: ${restaurantName}\nDate: ${date}\nTime: ${time}\nTable: ${tableNumber}\n\nYour QR Code: ${qrCode}\n\nShow this QR code at the restaurant for check-in.\n\nThank you for choosing TableReserve!`,

  otp: (name, otp) =>
    `Hi ${name},\n\nYour TableReserve verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,

  reminder: (name, date, time, tableNumber, restaurantName) =>
    `Hi ${name},\n\nReminder: Your reservation is in 1 hour!\n\nRestaurant: ${restaurantName}\nDate: ${date}\nTime: ${time}\nTable: ${tableNumber}\n\nSee you soon!`,

  cancellation: (name, date, time, restaurantName) =>
    `Hi ${name},\n\nYour reservation at ${restaurantName} for ${date} at ${time} has been cancelled.\n\nWe hope to see you again soon!`,

  waitlistAvailable: (name, restaurantName, date, time) =>
    `Hi ${name},\n\nGreat news! A table is now available at ${restaurantName} on ${date} at ${time}.\n\nLog in to TableReserve now to book before it's taken!`,

  waitlistJoined: (name, restaurantName, date, time) =>
    `Hi ${name},\n\nYou've been added to the waitlist at ${restaurantName} for ${date} at ${time}.\n\nWe'll notify you by email and SMS when a table opens up!`,

  checkIn: (name, tableNumber, restaurantName) =>
    `Hi ${name},\n\nYou have been checked in at ${restaurantName}, Table ${tableNumber}.\n\nEnjoy your meal!`,
};

module.exports = { sendNotification, templates };
