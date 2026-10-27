const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendEmail } = require('../services/emailService');
const { catchAsync, AppError } = require('../utils/AppError');

// Strict rate limit for contact form — 5 submissions per hour per IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many messages sent. Please try again in an hour.' },
});

router.post('/', contactLimiter, catchAsync(async (req, res) => {
  const { name, email, phone, subject, message, category } = req.body;

  if (!name || !email || !subject || !message) {
    throw new AppError('Name, email, subject, and message are required.', 400);
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  if (message.length < 10) {
    throw new AppError('Message must be at least 10 characters.', 400);
  }

  if (message.length > 2000) {
    throw new AppError('Message must be under 2000 characters.', 400);
  }

  const adminEmail = process.env.SMTP_USER || 'yerosang463@gmail.com';

  // Email to admin
  await sendEmail({
    to: adminEmail,
    subject: `[Contact] ${subject} — from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #E8B84B, #C9922A); padding: 24px 32px;">
          <h2 style="margin: 0; color: #070C17; font-size: 22px;">New Contact Message</h2>
          <p style="margin: 4px 0 0; color: #070C17; opacity: 0.7; font-size: 14px;">Via Kiray Bet Contact Form</p>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; font-size: 13px; width: 100px;">Name</td><td style="padding: 8px 0; font-weight: 600; color: #111;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Email</td><td style="padding: 8px 0; font-weight: 600; color: #111;"><a href="mailto:${email}" style="color: #C9922A;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Phone</td><td style="padding: 8px 0; font-weight: 600; color: #111;">${phone}</td></tr>` : ''}
            ${category ? `<tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Category</td><td style="padding: 8px 0; font-weight: 600; color: #111;">${category}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Subject</td><td style="padding: 8px 0; font-weight: 600; color: #111;">${subject}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 20px; background: #fff; border-radius: 8px; border-left: 4px solid #E8B84B;">
            <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 24px; font-size: 12px; color: #999;">Sent from Kiray Bet contact form · ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `,
  });

  // Auto-reply to user
  await sendEmail({
    to: email,
    subject: 'We received your message — Kiray Bet',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #070C17; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #E8B84B, #C9922A); padding: 24px 32px;">
          <h2 style="margin: 0; color: #070C17; font-size: 22px;">Message Received!</h2>
          <p style="margin: 4px 0 0; color: #070C17; opacity: 0.7; font-size: 14px;">We'll get back to you shortly</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #e0e0e0; font-size: 15px; line-height: 1.6;">Hi <strong style="color: #E8B84B;">${name}</strong>,</p>
          <p style="color: #aaa; font-size: 14px; line-height: 1.7;">
            Thank you for reaching out to Kiray Bet. We've received your message about <strong style="color: #E8B84B;">"${subject}"</strong> and our team will respond within 24–48 hours.
          </p>
          <div style="margin: 24px 0; padding: 16px 20px; background: rgba(232,184,75,0.08); border-radius: 8px; border: 1px solid rgba(232,184,75,0.2);">
            <p style="margin: 0; color: #ccc; font-size: 13px; line-height: 1.6;">Your message: <br/><em style="color: #999;">"${message.slice(0, 200)}${message.length > 200 ? '...' : ''}"</em></p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 32px;">This is an automated confirmation from Kiray Bet. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  });

  res.json({ success: true, message: 'Your message has been sent! We\'ll be in touch within 24–48 hours.' });
}));

module.exports = router;
