// backend/utils/email.js — Nodemailer utility
const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: config.mail.user, pass: config.mail.pass }
});

async function sendMail({ to, subject, html }) {
  if (!config.mail.user) {
    console.log('📧 Mail skipped (MAIL_USER not set):', to, subject);
    return { skipped: true };
  }
  try {
    const info = await transporter.sendMail({
      from: config.mail.user,
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
