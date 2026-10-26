const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const isPlaceholderConfig =
  !process.env.SMTP_USER ||
  process.env.SMTP_USER.includes('your_email') ||
  process.env.SMTP_PASS === 'your_app_password';

let transporter;
if (!isPlaceholderConfig) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const sendEmail = async (options) => {
  if (isPlaceholderConfig || process.env.NODE_ENV === 'test') {
    logger.info(`[Email Service - Simulated] To: ${options.to} | Subject: "${options.subject}"`);
    return { success: true, simulated: true };
  }

  try {
    const mailOptions = {
      from: `Kiray Bet <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to}`);
    return { success: true };
  } catch (err) {
    logger.warn(`Email sending to ${options.to} failed: ${err.message}. Continuing without throwing.`);
    return { success: false, error: err.message };
  }
};

module.exports = { sendEmail };
