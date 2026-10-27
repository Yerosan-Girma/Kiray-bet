const authService = require('../services/authService');
const { catchAsync } = require('../utils/AppError');

const isProduction = process.env.NODE_ENV === 'production';
const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

exports.register = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  res.cookie('refreshToken', refreshToken, getCookieOptions());
  res.status(201).json({
    success: true,
    message: 'User registered. Please verify your email.',
    data: { user, accessToken },
  });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);
  res.cookie('refreshToken', refreshToken, getCookieOptions());
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
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
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

exports.verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.body;
  await authService.verifyEmail(token);
  res.json({ success: true, message: 'Email verified successfully' });
});

exports.googleLogin = catchAsync(async (req, res) => {
  const { credential, idToken } = req.body;
  const token = credential || idToken;
  const { user, accessToken, refreshToken } = await authService.googleLogin(token);
  res.cookie('refreshToken', refreshToken, getCookieOptions());
  res.json({
    success: true,
    message: 'Google login successful',
    data: { user, accessToken },
  });
});
