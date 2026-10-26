const User = require('../models/User');
const House = require('../models/House');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Inquiry = require('../models/Inquiry');
const Favorite = require('../models/Favorite');
const Notification = require('../models/Notification');
const { AppError } = require('../utils/AppError');
const { getIO } = require('../config/socket');
const { sendEmail } = require('./emailService');

const idOf = (value) => value?._id?.toString?.() || value?.toString?.();

const getDashboardStats = async () => {
  const totalUsers = await User.countDocuments();
  const totalOwners = await User.countDocuments({ role: 'owner' });
  const totalBrokers = await User.countDocuments({ role: 'broker' });
  const totalRenters = await User.countDocuments({ role: 'renter' });
  const totalListings = await House.countDocuments();
  const premiumUsers = await User.countDocuments({ isPremium: true, premiumExpiry: { $gt: new Date() } });
  const pendingListings = await House.countDocuments({ status: 'pending' });
  const pendingUsers = await User.countDocuments({ isApproved: false, role: { $ne: 'admin' } });
  const pendingBrokerApplications = await User.countDocuments({ brokerApplicationStatus: 'pending' });
  const pendingOwnerSubmissions = await House.countDocuments({ brokerSubmissionStatus: 'pending_broker' });
  const approvedListings = await House.countDocuments({ status: 'approved' });
  const rejectedListings = await House.countDocuments({ status: 'rejected' });

  const transactions = await Transaction.find({ status: 'success' });
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
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
    pendingUsers,
    pendingBrokerApplications,
    pendingOwnerSubmissions,
    approvedListings,
    rejectedListings,
    totalRevenue,
    monthlyRevenue: totalRevenue,
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
  if (user.role === 'broker' && user.brokerApplicationStatus !== 'approved') {
    throw new AppError('Brokers must pay the 500 ETB fee and be approved via the Broker Applications section', 400);
  }
  user.isApproved = true;
  await user.save();

  await AuditLog.create({
    adminId,
    action: 'approve_user',
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
    action: 'suspend_user',
    targetId: userId,
    targetType: 'user',
    details: { reason, expiry: expiryDate },
  });

  // Notify user
  const notif = await Notification.create({
    userId: userId,
    type: 'listing_flagged',
    message: `Your account has been suspended. Reason: ${reason}`,
    data: { reason, expiryDate },
  });
  const io = getIO();
  io.to(`user_${userId}`).emit('notification', notif);

  // Send email to user
  try {
    await sendEmail({
      to: user.email,
      subject: 'Account Suspension Notice',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">Account Suspended</h2>
          <p>Hello ${user.name},</p>
          <p>Your account has been suspended due to a violation of our terms of service.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          ${expiryDate ? `<p><strong>Suspension expires:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>` : ''}
          <p>If you believe this is an error, please contact our support team.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send suspension email:', emailError);
  }

  return user;
};

const banUser = async (adminId, userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.status = 'banned';
  await user.save();

  await AuditLog.create({
    adminId,
    action: 'ban_user',
    targetId: userId,
    targetType: 'user',
    details: { status: 'banned' },
  });

  // Notify user
  const notif = await Notification.create({
    userId: userId,
    type: 'listing_flagged',
    message: 'Your account has been permanently banned.',
    data: { status: 'banned' },
  });
  const io = getIO();
  io.to(`user_${userId}`).emit('notification', notif);

  // Send email to user
  try {
    await sendEmail({
      to: user.email,
      subject: 'Account Banned Notice',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">Account Permanently Banned</h2>
          <p>Hello ${user.name},</p>
          <p>Your account has been permanently banned due to a serious violation of our terms of service.</p>
          <p>You will no longer be able to access your account or use our platform.</p>
          <p>If you believe this is an error, please contact our support team.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send ban email:', emailError);
  }

  return user;
};

const restoreUser = async (adminId, userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.status = 'active';
  user.suspensionReason = '';
  user.suspensionExpiry = null;
  await user.save();

  await AuditLog.create({
    adminId,
    action: 'restore_user',
    targetId: userId,
    targetType: 'user',
    details: { previousStatus: user.status, newStatus: 'active' },
  });

  // Notify user
  const notif = await Notification.create({
    userId: userId,
    type: 'listing_approved',
    message: 'Your account has been restored and is now active.',
    data: { status: 'active' },
  });
  const io = getIO();
  io.to(`user_${userId}`).emit('notification', notif);

  // Send email to user
  try {
    await sendEmail({
      to: user.email,
      subject: 'Account Restored',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">Account Restored</h2>
          <p>Hello ${user.name},</p>
          <p>Your account has been restored and is now active. You can log in and use the platform normally.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send restoration email:', emailError);
  }

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
    .populate('ownerId', 'name email phone')
    .populate('brokerId', 'name email phone brokerCompanyName')
    .populate('assignedBroker', 'name email phone brokerCompanyName')
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await House.countDocuments(query);
  return { listings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const approveListing = async (adminId, listingId) => {
  const house = await House.findById(listingId);
  if (!house) throw new AppError('Listing not found', 404);

  const brokerId = idOf(house.brokerId) || idOf(house.assignedBroker) || idOf(house.listedBy);
  const ownerId = idOf(house.ownerId) || idOf(house.listedBy);
  const broker = await User.findOne({
    _id: brokerId,
    role: 'broker',
    $or: [{ isApproved: true }, { brokerApplicationStatus: 'approved' }],
    status: 'active',
  });
  if (!broker) throw new AppError('Listing must be assigned to an approved broker before approval', 400);

  house.ownerId = ownerId;
  house.brokerId = broker._id;
  house.assignedBroker = broker._id;
  house.listedBy = broker._id;
  house.uploadedBy = house.uploadedBy || broker._id;
  house.status = 'approved';
  house.isActive = true;
  if (house.brokerSubmissionStatus === 'pending_broker') {
    house.brokerSubmissionStatus = 'accepted';
  }
  await house.save();

  await AuditLog.create({
    adminId,
    action: 'approve_listing',
    targetId: listingId,
    targetType: 'house',
    details: { status: 'approved' },
  });

  if (house.brokerId) {
    const notif = await Notification.create({
      userId: house.brokerId,
      type: 'listing_approved',
      message: `Your listing "${house.title}" has been approved by the admin.`,
      data: { houseId: house._id },
    });
    const io = getIO();
    io.to(`user_${house.brokerId}`).emit('notification', notif);

    try {
      await sendEmail({
        to: broker.email,
        subject: 'Listing Approved',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C9922A;">Listing Approved</h2>
            <p>Hello ${broker.name},</p>
            <p>Your listing <strong>"${house.title}"</strong> has been approved by the admin and is now live on the platform.</p>
            <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }
  }

  if (house.ownerId && idOf(house.ownerId) !== idOf(house.brokerId)) {
    const ownerNotification = await Notification.create({
      userId: house.ownerId,
      type: 'listing_approved',
      message: `Your property "${house.title}" has been published.`,
      data: { houseId: house._id },
    });
    const io = getIO();
    io.to(`user_${house.ownerId}`).emit('notification', ownerNotification);
  }

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

  // Notify broker/owner
  if (house.listedBy) {
    const notif = await Notification.create({
      userId: house.listedBy,
      type: 'listing_rejected',
      message: `Your listing "${house.title}" has been rejected by the admin. Reason: ${reason}`,
      data: { houseId: house._id, reason },
    });
    const io = getIO();
    io.to(`user_${house.listedBy}`).emit('notification', notif);

    // Send email
    const broker = await User.findById(house.listedBy);
    try {
      await sendEmail({
        to: broker.email,
        subject: 'Listing Rejected',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C9922A;">Listing Rejected</h2>
            <p>Hello ${broker.name},</p>
            <p>Your listing <strong>"${house.title}"</strong> has been rejected by the admin.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>You may edit and resubmit the listing after addressing the feedback provided.</p>
            <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }
  }

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

const suspendListing = async (adminId, listingId, reason = '') => {
  const house = await House.findById(listingId);
  if (!house) throw new AppError('Listing not found', 404);
  house.status = 'inactive';
  house.isActive = false;
  house.flagReason = reason;
  await house.save();

  await AuditLog.create({
    adminId,
    action: 'suspend_listing',
    targetId: listingId,
    targetType: 'house',
    details: { reason },
  });

  return house;
};

const getTransactions = async (filters = {}, page = 1, limit = 10) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
  if (filters.type) query.type = filters.type;
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

const getBrokerApplications = async (filters = {}, page = 1, limit = 10) => {
  const query = { brokerApplicationStatus: { $ne: 'none' } };
  // Only show applications that have completed payment (pending, approved, rejected)
  // Don't show payment_pending applications to admin
  if (filters.status) {
    query.brokerApplicationStatus = filters.status;
  } else {
    query.brokerApplicationStatus = { $in: ['pending', 'approved', 'rejected'] };
  }

  const skip = (page - 1) * limit;
  const applicants = await User.find(query)
    .select('-password -refreshToken')
    .populate('brokerRegistrationTxId')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await User.countDocuments(query);
  return { applicants, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const approveBroker = async (adminId, brokerId) => {
  const broker = await User.findById(brokerId);
  if (!broker) throw new AppError('Broker not found', 404);
  if (broker.brokerApplicationStatus !== 'pending') {
    throw new AppError('No pending application found', 400);
  }

  const paidTx = await Transaction.findOne({
    userId: brokerId,
    type: 'broker_registration',
    status: 'success',
  });
  if (!paidTx) {
    throw new AppError('Cannot approve broker: Payment of 500 ETB registration fee has not been confirmed.', 400);
  }

  const previousRole = broker.role;
  broker.role = 'broker';
  broker.isApproved = true;
  broker.brokerApplicationStatus = 'approved';
  await broker.save({ validateBeforeSave: false });

  await AuditLog.create({
    adminId,
    action: 'approve_broker',
    targetId: brokerId,
    targetType: 'broker_application',
    details: { previousRole, newRole: 'broker' },
  });

  const notif = await Notification.create({
    userId: brokerId,
    type: 'broker_approved',
    message: 'Congratulations! Your broker application has been approved.',
    data: { adminId }
  });
  const io = getIO();
  io.to(`user_${brokerId}`).emit('notification', notif);

  try {
    await sendEmail({
      to: broker.email,
      subject: 'Broker Application Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">Broker Application Approved</h2>
          <p>Hello ${broker.name},</p>
          <p>Your broker application has been approved. You can now access the Broker Dashboard.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email:', emailError);
  }

  return broker;
};

const rejectBroker = async (adminId, brokerId, reason) => {
  const broker = await User.findById(brokerId);
  if (!broker) throw new AppError('Broker not found', 404);

  broker.brokerApplicationStatus = 'rejected';
  broker.brokerApplicationNotes = reason || 'Application did not meet requirements';
  await broker.save({ validateBeforeSave: false });

  await AuditLog.create({
    adminId,
    action: 'reject_broker',
    targetId: brokerId,
    targetType: 'broker_application',
    details: { reason },
  });

  const notif = await Notification.create({
    userId: brokerId,
    type: 'broker_rejected',
    message: `Your broker application was rejected. Reason: ${reason || 'Does not meet requirements'}`,
    data: { adminId, reason }
  });
  const io = getIO();
  io.to(`user_${brokerId}`).emit('notification', notif);

  try {
    await sendEmail({
      to: broker.email,
      subject: 'Broker Application Rejected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">Broker Application Rejected</h2>
          <p>Hello ${broker.name},</p>
          <p>Your broker application was rejected.</p>
          <p><strong>Reason:</strong> ${reason || 'Application did not meet requirements'}</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email:', emailError);
  }

  return broker;
};

const suspendBroker = async (adminId, brokerId, reason, expiryDate) => {
  const broker = await User.findById(brokerId);
  if (!broker) throw new AppError('Broker not found', 404);
  
  broker.status = 'suspended';
  broker.suspensionReason = reason;
  broker.suspensionExpiry = expiryDate || null;
  await broker.save();

  await AuditLog.create({
    adminId,
    action: 'suspend_user',
    targetId: brokerId,
    targetType: 'user',
    details: { reason, expiry: expiryDate },
  });

  const notif = await Notification.create({
    userId: brokerId,
    type: 'listing_flagged',
    message: `Your broker account has been suspended. Reason: ${reason}`,
    data: { reason, expiryDate },
  });
  const io = getIO();
  io.to(`user_${brokerId}`).emit('notification', notif);

  return broker;
};

const getOwnerProperties = async (ownerId, page = 1, limit = 10) => {
  const query = { ownerId };
  const skip = (page - 1) * limit;
  
  const properties = await House.find(query)
    .populate('assignedBroker', 'name email phone')
    .populate('brokerId', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await House.countDocuments(query);
  return { properties, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const getReportedConversations = async (page = 1, limit = 10) => {
  const Conversation = require('../models/Conversation');
  const query = { isReported: true };
  const skip = (page - 1) * limit;
  
  const conversations = await Conversation.find(query)
    .populate('participants', 'name email phone')
    .sort({ reportedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await Conversation.countDocuments(query);
  return { conversations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const resolveReport = async (adminId, reportId, resolution) => {
  const Conversation = require('../models/Conversation');
  const conversation = await Conversation.findById(reportId);
  if (!conversation) throw new AppError('Report not found', 404);
  
  conversation.isReported = false;
  conversation.resolution = resolution;
  conversation.resolvedBy = adminId;
  conversation.resolvedAt = new Date();
  await conversation.save();

  await AuditLog.create({
    adminId,
    action: 'user_reported',
    targetId: reportId,
    targetType: 'message',
    details: { resolution },
  });

  return conversation;
};

module.exports = {
  getDashboardStats,
  getUsers,
  approveUser,
  suspendUser,
  banUser,
  restoreUser,
  getListings,
  approveListing,
  rejectListing,
  suspendListing,
  deleteListing,
  getTransactions,
  getAuditLogs,
  getBrokerApplications,
  approveBroker,
  rejectBroker,
  suspendBroker,
  getOwnerProperties,
  getReportedConversations,
  resolveReport,
};
