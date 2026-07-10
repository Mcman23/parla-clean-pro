// backend/utils/email.js — Nodemailer utility
const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  auth: { user: config.mail.user, pass: config.mail.pass }
});

async function sendMail({ to, subject, html }) {
  if (!config.mail.user) {
    console.log('📧 Mail skipped (SMTP not configured):', to, subject);
    return { skipped: true };
  }
  try {
    const info = await transporter.sendMail({
      from: config.mail.from,
      to, subject, html
    });
    console.log('📧 Mail sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('📧 Mail error:', err.message);
    return { error: err.message };
  }
}

module.exports = { sendMail };
