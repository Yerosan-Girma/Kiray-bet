const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AppError } = require('../utils/AppError');
const {
  sendEmail,
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
  getWelcomeEmailTemplate,
} = require('./emailService');
const logger = require('../utils/logger');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

const register = async (userData) => {
  const { email, password, name, phone, role } = userData;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  // Create user: prevent direct registration as broker/admin
  // To become a broker, applicants must pay 500 ETB registration fee and be approved
  const assignedRole = role === 'owner' ? 'owner' : 'renter';
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: assignedRole,
  });

  // Generate email verification token (for simplicity we use jwt)
  const verificationToken = jwt.sign(
    { id: user._id },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1d' }
  );

  // Send verification email (async, we don't wait)
  try {
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      html: getVerificationEmailTemplate({ name: user.name, verifyUrl }),
    });
  } catch (err) {
    logger.error(`Email sending failed: ${err.message}`);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isApproved: user.isApproved,
      isPremium: user.isPremium,
      status: user.status,
      profileImage: user.profileImage || '',
      brokerApplicationStatus: user.brokerApplicationStatus || 'none',
    },
    accessToken,
    refreshToken,
  };
};

const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new AppError('Account locked. Try again later.', 403);
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
    }
    await user.save({ validateBeforeSave: false });
    throw new AppError('Invalid email or password', 401);
  }

  // Reset failed attempts on successful login
  user.failedLoginAttempts = 0;
  user.lockUntil = null;

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isApproved: user.isApproved,
      isPremium: user.isPremium,
      status: user.status,
      profileImage: user.profileImage || '',
      brokerApplicationStatus: user.brokerApplicationStatus || 'none',
    },
    accessToken,
    refreshToken,
  };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  const accessToken = generateAccessToken(user);
  return { accessToken };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Password Reset',
    html: getPasswordResetEmailTemplate({ name: user.name, resetUrl }),
  });
};

const resetPassword = async (token, newPassword) => {
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: resetTokenHash,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError('Invalid or expired token', 400);
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new AppError('Incorrect old password', 401);
  }

  user.password = newPassword;
  await user.save();
};

const verifyEmail = async (token) => {
  if (!token) {
    throw new AppError('Verification token is required', 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.emailVerified = true;
  await user.save({ validateBeforeSave: false });

  // Send Welcome Email
  try {
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Kiray Bet! 🏠',
      html: getWelcomeEmailTemplate({ name: user.name, role: user.role, siteUrl: frontendUrl }),
    });
  } catch (err) {
    logger.warn(`Welcome email sending failed: ${err.message}`);
  }

  return user;
};

const googleLogin = async (idToken) => {
  if (!idToken) {
    throw new AppError('Google ID token is required', 400);
  }

  // Validate Google ID token via Google tokeninfo API
  let googlePayload;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      throw new Error('Google token verification failed');
    }
    googlePayload = await res.json();
  } catch (err) {
    throw new AppError('Invalid or expired Google token', 401);
  }

  const { sub: googleId, email, name, picture, email_verified, aud } = googlePayload;
  if (!email) {
    throw new AppError('No email associated with this Google account', 400);
  }

  // Security verification: ensure token was generated for our client ID
  if (process.env.GOOGLE_CLIENT_ID && aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google token audience does not match this application', 401);
  }

  // Find user by googleId or email
  let user = await User.findOne({
    $or: [{ googleId }, { email: email.toLowerCase() }],
  });

  if (user) {
    if (user.status === 'banned') {
      throw new AppError('Your account has been banned. Please contact support.', 403);
    }
    if (user.status === 'suspended') {
      if (user.suspensionExpiry && user.suspensionExpiry > new Date()) {
        throw new AppError(`Your account is suspended until ${user.suspensionExpiry.toLocaleDateString()}. Reason: ${user.suspensionReason || 'Terms violation'}`, 403);
      } else {
        user.status = 'active';
        user.suspensionReason = '';
        user.suspensionExpiry = null;
      }
    }

    // Link Google info
    if (!user.googleId) user.googleId = googleId;
    if (!user.emailVerified && (email_verified === 'true' || email_verified === true)) user.emailVerified = true;
    if (!user.profileImage && picture) user.profileImage = picture;
  } else {
    // Auto-register new Google user as renter
    user = new User({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      googleId,
      profileImage: picture || '',
      role: 'renter',
      emailVerified: email_verified === 'true' || email_verified === true,
      status: 'active',
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      isApproved: user.isApproved,
      isPremium: user.isPremium,
      status: user.status,
    },
    accessToken,
    refreshToken,
  };
};

module.exports = {
  googleLogin,
  verifyEmail,
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  generateAccessToken,
  generateRefreshToken,
};
