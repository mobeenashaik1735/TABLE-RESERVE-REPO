const sendSms = async (phone, message) => {
  if (!phone) return { sent: false, reason: 'no_phone' };

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE) {
    try {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: phone,
      });
      return { sent: true };
    } catch (err) {
      console.log(`[SMS Info] Twilio delivery skipped: ${err.message}`);
    }
  }

  console.log('\n========== SMS (dev mode — configure Twilio or use console) ==========');
  console.log(`To: ${phone}`);
  console.log(message);
  console.log('=======================================================================\n');
  return { sent: false, devMode: true };
};

module.exports = sendSms;
