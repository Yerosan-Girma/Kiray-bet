const authService = require('../services/authService');
const { catchAsync } = require('../utils/AppError');

exports.register = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(201).json({
    success: true,
    message: 'User registered. Please verify your email.',
    data: { user, accessToken },
  });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({
    success: true,
    message: 'Login successful',
    data: { user, accessToken },
  });
});

exports.refreshToken = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const { accessToken } = await authService.refreshAccessToken(refreshToken);
  res.json({ success: true, data: { accessToken } });
});

exports.logout = catchAsync(async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.json({ success: true, message: 'Reset link sent to email' });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  res.json({ success: true, message: 'Password reset successful' });
});

exports.changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, oldPassword, newPassword);
  res.json({ success: true, message: 'Password changed' });
});

exports.getProfile = catchAsync(async (req, res) => {
  res.json({ success: true, data: req.user });
});