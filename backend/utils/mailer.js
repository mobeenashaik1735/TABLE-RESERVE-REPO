const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
}

const sendEmail = async (to, subject, text, html) => {
  const transport = getTransporter();
  if (!transport) {
    console.log('\n========== EMAIL (dev mode — configure EMAIL_USER/EMAIL_PASS) ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log('=========================================================================\n');
    return { sent: false, devMode: true };
  }
  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });
    return { sent: true };
  } catch (err) {
    console.log(`[Mailer Info] SMTP delivery attempt finished. Detail: ${err.message}`);
    if (err.message.includes('535') || err.message.includes('accepted')) {
      console.log('\n💡 [SMTP AUTHENTICATION TIP] Gmail credentials were not accepted (Status 535).');
      console.log('   To fix this: Please generate a 16-character "App Password" under your Google Account Security settings.');
      console.log('   Note that you must enable 2-Step Verification on your Google account first to use App Passwords.\n');
    }
    console.log(`[EMAIL FALLBACK] To: ${to} | Subject: ${subject}\n${text}`);
    return { sent: false, error: err.message };
  }
};

module.exports = sendEmail;
