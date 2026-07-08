const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `RentalWPA <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}`);
  } catch (err) {
    logger.error(`Email sending failed: ${err.message}`);
    throw new Error('Email could not be sent');
  }
};

module.exports = { sendEmail };