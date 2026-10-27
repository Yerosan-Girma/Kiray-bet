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

/**
 * Branded HTML Email Template Generators
 */
const getVerificationEmailTemplate = ({ name, verifyUrl }) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #eaeaea;">
    <div style="background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #C9922A;">
      <h1 style="color: #E8B84B; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">Kiray Bet (ኪራይ ቤት)</h1>
      <p style="color: #9ca3af; margin: 6px 0 0; font-size: 14px;">Ethiopia's Premier Home Rental Platform</p>
    </div>
    <div style="padding: 36px 32px; color: #374151;">
      <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-top: 0;">Verify Your Email Address</h2>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        Hello <strong>${name || 'Valued User'}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 28px;">
        Thank you for joining Kiray Bet! To complete your registration and secure your account, please verify your email address by clicking the button below:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" style="background: linear-gradient(135deg, #E8B84B 0%, #C9922A 100%); color: #070C17; padding: 14px 32px; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(201, 146, 42, 0.35);">
          Verify Email Address
        </a>
      </div>
      <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin-top: 28px;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${verifyUrl}" style="color: #C9922A; word-break: break-all;">${verifyUrl}</a>
      </p>
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 28px 0;" />
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        This verification link will expire in 24 hours. If you did not create an account on Kiray Bet, please disregard this email.
      </p>
    </div>
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
      © ${new Date().getFullYear()} Kiray Bet. Addis Ababa, Ethiopia. All rights reserved.
    </div>
  </div>
`;

const getPasswordResetEmailTemplate = ({ name, resetUrl }) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #eaeaea;">
    <div style="background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #C9922A;">
      <h1 style="color: #E8B84B; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">Kiray Bet (ኪራይ ቤት)</h1>
      <p style="color: #9ca3af; margin: 6px 0 0; font-size: 14px;">Ethiopia's Premier Home Rental Platform</p>
    </div>
    <div style="padding: 36px 32px; color: #374151;">
      <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-top: 0;">Password Reset Request</h2>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        Hello <strong>${name || 'Valued User'}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 28px;">
        We received a request to reset the password for your Kiray Bet account. Click the button below to choose a new password:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #E8B84B 0%, #C9922A 100%); color: #070C17; padding: 14px 32px; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(201, 146, 42, 0.35);">
          Reset My Password
        </a>
      </div>
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; margin: 24px 0;">
        <p style="font-size: 13px; color: #92400e; margin: 0;">
          <strong>Security Notice:</strong> This link is only valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email or contact support if you suspect unauthorized activity.
        </p>
      </div>
      <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin-top: 24px;">
        If the button doesn't work, copy and paste this URL into your browser:<br/>
        <a href="${resetUrl}" style="color: #C9922A; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
      © ${new Date().getFullYear()} Kiray Bet. Addis Ababa, Ethiopia. All rights reserved.
    </div>
  </div>
`;

const getWelcomeEmailTemplate = ({ name, role, siteUrl }) => {
  const roleText = role === 'broker' ? 'as an approved Real Estate Broker' : role === 'owner' ? 'as a Property Owner' : 'as a Renter';
  const roleAction = role === 'broker'
    ? 'Start managing client listings, receiving property submissions from owners, and connecting with high-intent tenants across Ethiopia.'
    : role === 'owner'
    ? 'Submit your property details to verified brokers across Addis Ababa for fast, hassle-free tenant placement.'
    : 'Discover thousands of verified apartments, villas, and houses for rent with transparent pricing and direct broker contact.';

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #eaeaea;">
    <div style="background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 36px 24px; text-align: center; border-bottom: 3px solid #C9922A;">
      <h1 style="color: #E8B84B; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 0.5px;">Kiray Bet (ኪራይ ቤት)</h1>
      <p style="color: #9ca3af; margin: 8px 0 0; font-size: 14px;">Welcome to Ethiopia's #1 Home Rental Marketplace</p>
    </div>
    <div style="padding: 36px 32px; color: #374151;">
      <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin-top: 0;">Welcome aboard, ${name || 'Friend'}! 🎉</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
        Your email has been verified and your account is active ${roleText}.
      </p>
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #C9922A;">
        <h4 style="margin: 0 0 8px; color: #1e293b; font-size: 15px;">What you can do next:</h4>
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">${roleAction}</p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${siteUrl}/properties" style="background: linear-gradient(135deg, #E8B84B 0%, #C9922A 100%); color: #070C17; padding: 14px 32px; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(201, 146, 42, 0.35);">
          Explore Properties Now
        </a>
      </div>
      <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
        Need assistance or have questions? Contact our dedicated support team through our contact page or email us directly at <a href="mailto:${process.env.SMTP_USER || 'support@kiraybet.com'}" style="color: #C9922A;">${process.env.SMTP_USER || 'support@kiraybet.com'}</a>.
      </p>
    </div>
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
      © ${new Date().getFullYear()} Kiray Bet. Addis Ababa, Ethiopia. All rights reserved.
    </div>
  </div>
  `;
};

module.exports = {
  sendEmail,
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
  getWelcomeEmailTemplate,
};
