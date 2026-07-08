const notificationService = require('../services/notificationService');
const { catchAsync } = require('../utils/AppError');

exports.getNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await notificationService.getNotifications(req.user.id, parseInt(page), parseInt(limit));
  res.json({ success: true, data: result });
});

exports.markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(req.user.id, req.params.id);
  res.json({ success: true, data: notification });
});

exports.deleteNotification = catchAsync(async (req, res) => {
  await notificationService.deleteNotification(req.user.id, req.params.id);
  res.json({ success: true, message: 'Notification deleted' });
});