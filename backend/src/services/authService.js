const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AppError } = require('../utils/AppError');
const { sendEmail } = require('../utils/email');
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
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
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

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Password Reset',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 10 minutes.</p>`,
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

module.exports = {
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
