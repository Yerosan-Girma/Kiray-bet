const User = require('../models/User');
const House = require('../models/House');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Inquiry = require('../models/Inquiry');
const Favorite = require('../models/Favorite');
const { AppError } = require('../utils/AppError');

const getDashboardStats = async () => {
  const totalUsers = await User.countDocuments();
  const totalOwners = await User.countDocuments({ role: 'owner' });
  const totalBrokers = await User.countDocuments({ role: 'broker' });
  const totalRenters = await User.countDocuments({ role: 'renter' });
  const totalListings = await House.countDocuments();
  const premiumUsers = await User.countDocuments({ isPremium: true, premiumExpiry: { $gt: new Date() } });
  const pendingListings = await House.countDocuments({ status: 'pending' });
  const approvedListings = await House.countDocuments({ status: 'approved' });
  const rejectedListings = await House.countDocuments({ status: 'rejected' });

  const transactions = await Transaction.find({ status: 'success' });
  const monthlyRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTransactions = await Transaction.countDocuments();

  // Most viewed, favorited, contacted houses
  const mostViewed = await House.find().sort({ views: -1 }).limit(5).select('title views');
  const mostFavorited = await Favorite.aggregate([
    { $group: { _id: '$houseId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'houses', localField: '_id', foreignField: '_id', as: 'house' } },
    { $unwind: '$house' },
    { $project: { 'house.title': 1, count: 1 } }
  ]);
  const mostContacted = await Inquiry.aggregate([
    { $group: { _id: '$houseId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'houses', localField: '_id', foreignField: '_id', as: 'house' } },
    { $unwind: '$house' },
    { $project: { 'house.title': 1, count: 1 } }
  ]);

  return {
    totalUsers,
    totalOwners,
    totalBrokers,
    totalRenters,
    totalListings,
    premiumUsers,
    pendingListings,
    approvedListings,
    rejectedListings,
    monthlyRevenue,
    totalTransactions,
    mostViewed,
    mostFavorited,
    mostContacted,
  };
};

const getUsers = async (filters = {}, page = 1, limit = 10) => {
  const query = {};
  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const users = await User.find(query).select('-password -refreshToken').skip(skip).limit(limit).lean();
  const total = await User.countDocuments(query);
  return { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const approveUser = async (adminId, userId, targetType = 'user') => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.isApproved = true;
  await user.save();

  await AuditLog.create({
    adminId,
    action: 'approve',
    targetId: userId,
    targetType,
    details: { status: 'approved' },
  });
  return user;
};

const suspendUser = async (adminId, userId, reason, expiryDate) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.status = 'suspended';
  user.suspensionReason = reason;
  user.suspensionExpiry = expiryDate || null;
  await user.save();

  await AuditLog.create({
    adminId,
    action: 'suspend',
    targetId: userId,
    targetType: 'user',
    details: { reason, expiry: expiryDate },
  });
  return user;
};

const banUser = async (adminId, userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.status = 'banned';
  await user.save();

  await AuditLog.create({
    adminId,
    action: 'ban',
    targetId: userId,
    targetType: 'user',
    details: { status: 'banned' },
  });
  return user;
};

const getListings = async (filters = {}, page = 1, limit = 10) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.isFlagged !== undefined) query.isFlagged = filters.isFlagged === 'true';
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const skip = (page - 1) * limit;
  const listings = await House.find(query)
    .populate('listedBy', 'name email')
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await House.countDocuments(query);
  return { listings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const approveListing = async (adminId, listingId) => {
  const house = await House.findById(listingId);
  if (!house) throw new AppError('Listing not found', 404);
  house.status = 'approved';
  await house.save();

  await AuditLog.create({
    adminId,
    action: 'approve_listing',
    targetId: listingId,
    targetType: 'house',
    details: { status: 'approved' },
  });
  return house;
};

const rejectListing = async (adminId, listingId, reason) => {
  const house = await House.findById(listingId);
  if (!house) throw new AppError('Listing not found', 404);
  house.status = 'rejected';
  await house.save();

  await AuditLog.create({
    adminId,
    action: 'reject_listing',
    targetId: listingId,
    targetType: 'house',
    details: { reason },
  });
  return house;
};

const deleteListing = async (adminId, listingId) => {
  const house = await House.findById(listingId);
  if (!house) throw new AppError('Listing not found', 404);
  await house.deleteOne();

  await AuditLog.create({
    adminId,
    action: 'delete_listing',
    targetId: listingId,
    targetType: 'house',
    details: { deleted: true },
  });
  return house;
};

const getTransactions = async (filters = {}, page = 1, limit = 10) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
  if (filters.userId) query.userId = filters.userId;

  const skip = (page - 1) * limit;
  const transactions = await Transaction.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await Transaction.countDocuments(query);
  return { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const getAuditLogs = async (filters = {}, page = 1, limit = 10) => {
  const query = {};
  if (filters.action) query.action = filters.action;
  if (filters.targetType) query.targetType = filters.targetType;
  if (filters.adminId) query.adminId = filters.adminId;

  const skip = (page - 1) * limit;
  const logs = await AuditLog.find(query)
    .populate('adminId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await AuditLog.countDocuments(query);
  return { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

module.exports = {
  getDashboardStats,
  getUsers,
  approveUser,
  suspendUser,
  banUser,
  getListings,
  approveListing,
  rejectListing,
  deleteListing,
  getTransactions,
  getAuditLogs,
};