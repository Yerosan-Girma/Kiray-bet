const Inquiry = require('../models/Inquiry');
const House = require('../models/House');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../utils/AppError');
const { getIO } = require('../config/socket');
const { sendEmail } = require('./emailService');

const createInquiry = async (userId, houseId, contactPhone, message) => {
  const house = await House.findById(houseId);
  if (!house) throw new AppError('House not found', 404);

  const renter = await User.findById(userId);
  const broker = await User.findById(house.listedBy);

  const inquiry = await Inquiry.create({
    houseId,
    userId,
    contactPhone,
    replies: [{ userId, message }],
  });

  // Increment inquiry count
  house.inquiryCount += 1;
  await house.save();

  // Audit log
  await AuditLog.create({
    userId: userId,
    action: 'inquiry_created',
    targetId: inquiry._id,
    targetType: 'inquiry',
    details: { houseId: house._id, houseTitle: house.title },
  });

  // Notify broker (listedBy)
  const notification = await Notification.create({
    userId: house.listedBy,
    type: 'new_inquiry',
    message: `New inquiry from ${renter.name} for your house ${house.title}`,
    data: { inquiryId: inquiry._id, houseId: house._id },
  });

  // Emit via socket to the broker if online
  const io = getIO();
  io.to(`user_${house.listedBy}`).emit('notification', notification);

  // Send email to broker
  try {
    await sendEmail({
      to: broker.email,
      subject: 'New Property Inquiry Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">New Property Inquiry</h2>
          <p>Hello ${broker.name},</p>
          <p>You have received a new inquiry for your property listing.</p>
          <p><strong>Inquiry Details:</strong></p>
          <ul>
            <li>Renter: ${renter.name}</li>
            <li>Renter Email: ${renter.email}</li>
            <li>Contact Phone: ${contactPhone || 'Not provided'}</li>
            <li>Property: ${house.title}</li>
            <li>Location: ${house.location}</li>
          </ul>
          <p><strong>Message:</strong></p>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
          <p>Please respond to the inquiry in your dashboard.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email to broker:', emailError);
  }

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
  const otherUser = await User.findById(otherUserId);
  const currentUser = await User.findById(userId);

  const notification = await Notification.create({
    userId: otherUserId,
    type: 'new_reply',
    message: `New reply on inquiry for ${house.title}`,
    data: { inquiryId: inquiry._id, houseId: house._id },
  });

  const io = getIO();
  io.to(`user_${otherUserId}`).emit('notification', notification);

  // Send email to the other party
  try {
    await sendEmail({
      to: otherUser.email,
      subject: 'New Reply to Your Property Inquiry',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">New Reply to Your Inquiry</h2>
          <p>Hello ${otherUser.name},</p>
          <p>You have received a new reply regarding your inquiry for <strong>${house.title}</strong>.</p>
          <p><strong>Reply from:</strong> ${currentUser.name}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
          <p>Please continue the conversation in your dashboard.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email for inquiry reply:', emailError);
  }

  return reply;
};

module.exports = { createInquiry, getInquiriesForUser, addReply };