const Notification = require('../models/Notification');
const { AppError } = require('../utils/AppError');

const getNotifications = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await Notification.countDocuments({ userId });
  const unreadCount = await Notification.countDocuments({ userId, read: false });
  return { notifications, unreadCount, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({ _id: notificationId, userId });
  if (!notification) throw new AppError('Notification not found', 404);
  notification.read = true;
  await notification.save();
  return notification;
};

const deleteNotification = async (userId, notificationId) => {
  const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
  if (!result) throw new AppError('Notification not found', 404);
  return result;
};

const createNotification = async (userId, type, message, data = {}) => {
  return await Notification.create({ userId, type, message, data });
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  createNotification,
};