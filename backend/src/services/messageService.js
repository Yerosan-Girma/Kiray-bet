const Message = require('../models/Message');
const User = require('../models/User');
const House = require('../models/House');
const Notification = require('../models/Notification');
const { AppError } = require('../utils/AppError');
const { getIO } = require('../config/socket');
const { sendEmail } = require('./emailService');

const getConversationId = (id1, id2) =>
  [id1.toString(), id2.toString()].sort().join('_');

const getConversations = async (userId) => {
  // Find all unique conversation partners
  const sent = await Message.find({ senderId: userId })
    .distinct('receiverId');
  const received = await Message.find({ receiverId: userId })
    .distinct('senderId');

  const partnerIds = [...new Set([...sent.map(String), ...received.map(String)])];

  const conversations = await Promise.all(
    partnerIds.map(async (partnerId) => {
      const convId = getConversationId(userId, partnerId);
      const lastMsg = await Message.findOne({ conversationId: convId })
        .sort({ createdAt: -1 })
        .lean();
      const partner = await User.findById(partnerId)
        .select('name email profileImage role')
        .lean();
      const unread = await Message.countDocuments({
        conversationId: convId,
        receiverId: userId,
        read: false,
      });
      return { conversationId: convId, partner, lastMessage: lastMsg, unreadCount: unread };
    })
  );

  return conversations.filter((c) => c.partner).sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || 0;
    const bTime = b.lastMessage?.createdAt || 0;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
};

const getMessages = async (userId, partnerId, page = 1, limit = 50) => {
  const convId = getConversationId(userId, partnerId);
  const skip = (page - 1) * limit;

  const messages = await Message.find({ conversationId: convId })
    .populate('senderId', 'name profileImage role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Mark received messages as read
  await Message.updateMany(
    { conversationId: convId, receiverId: userId, read: false },
    { read: true }
  );

  const total = await Message.countDocuments({ conversationId: convId });

  return {
    messages: messages.reverse(), // oldest first
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const sendMessage = async (senderId, receiverId, content, houseId = null) => {
  // Validate receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) throw new AppError('Recipient not found', 404);

  const sender = await User.findById(senderId);
  const convId = getConversationId(senderId, receiverId);
  const msg = await Message.create({
    conversationId: convId,
    senderId,
    receiverId,
    content,
    houseId,
  });

  // Create notification for receiver
  const notification = await Notification.create({
    userId: receiverId,
    type: 'new_message',
    message: `New message from ${sender.name}`,
    data: { conversationId: convId, houseId },
  });

  // Emit via socket
  const io = getIO();
  io.to(`user_${receiverId}`).emit('notification', notification);
  io.to(`user_${receiverId}`).emit('new_message', msg);

  // Send email notification
  try {
    let houseInfo = '';
    if (houseId) {
      const house = await House.findById(houseId);
      if (house) {
        houseInfo = `<p><strong>Regarding Property:</strong> ${house.title}</p>`;
      }
    }

    await sendEmail({
      to: receiver.email,
      subject: 'New Message Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">New Message Received</h2>
          <p>Hello ${receiver.name},</p>
          <p>You have received a new message from <strong>${sender.name}</strong>.</p>
          ${houseInfo}
          <p><strong>Message:</strong></p>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${content}</p>
          <p>Please continue the conversation in your dashboard.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email for new message:', emailError);
  }

  const populated = await msg.populate('senderId', 'name profileImage role');
  return populated;
};

module.exports = { getConversationId, getConversations, getMessages, sendMessage };
