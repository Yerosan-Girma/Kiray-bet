const Inquiry = require('../models/Inquiry');
const House = require('../models/House');
const Notification = require('../models/Notification');
const { AppError } = require('../utils/AppError');
const { getIO } = require('../config/socket');

const createInquiry = async (userId, houseId, contactPhone, message) => {
  const house = await House.findById(houseId);
  if (!house) throw new AppError('House not found', 404);

  const inquiry = await Inquiry.create({
    houseId,
    userId,
    contactPhone,
    replies: [{ userId, message }],
  });

  // Increment inquiry count
  house.inquiryCount += 1;
  await house.save();

  // Notify owner/broker (listedBy)
  const notification = await Notification.create({
    userId: house.listedBy,
    type: 'new_inquiry',
    message: `New inquiry from ${userId} for your house ${house.title}`,
    data: { inquiryId: inquiry._id, houseId: house._id },
  });

  // Emit via socket to the owner if online
  const io = getIO();
  io.to(`user_${house.listedBy}`).emit('notification', notification);

  return inquiry;
};

const getInquiriesForUser = async (userId, role, page = 1, limit = 10) => {
  let query = {};
  if (role === 'admin') {
    // Admins see all
  } else if (role === 'renter') {
    query.userId = userId;
  } else if (['owner', 'broker'].includes(role)) {
    // Get houses listed by this user
    const houses = await House.find({ listedBy: userId }).select('_id');
    const houseIds = houses.map((h) => h._id);
    query.houseId = { $in: houseIds };
  } else {
    throw new AppError('Unauthorized', 403);
  }

  const skip = (page - 1) * limit;
  const inquiries = await Inquiry.find(query)
    .populate('userId', 'name email phone')
    .populate('houseId', 'title location price images')
    .populate('replies.userId', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Inquiry.countDocuments(query);

  return {
    inquiries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const addReply = async (inquiryId, userId, message) => {
  const inquiry = await Inquiry.findById(inquiryId);
  if (!inquiry) throw new AppError('Inquiry not found', 404);

  // Check if user is participant (renter or listedBy)
  const house = await House.findById(inquiry.houseId);
  const isRenter = inquiry.userId.toString() === userId;
  const isListedBy = house.listedBy.toString() === userId;
  if (!isRenter && !isListedBy) {
    throw new AppError('Not authorized to reply', 403);
  }

  const reply = { userId, message };
  inquiry.replies.push(reply);
  inquiry.status = 'active';
  await inquiry.save();

  // Notify the other party
  const otherUserId = isRenter ? house.listedBy : inquiry.userId;
  const notification = await Notification.create({
    userId: otherUserId,
    type: 'new_reply',
    message: `New reply on inquiry ${inquiry._id}`,
    data: { inquiryId: inquiry._id },
  });

  const io = getIO();
  io.to(`user_${otherUserId}`).emit('notification', notification);

  return reply;
};

module.exports = { createInquiry, getInquiriesForUser, addReply };