const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const House = require('../models/House');
const Notification = require('../models/Notification');
const { AppError } = require('../utils/AppError');
const { getIO } = require('../config/socket');
const { sendEmail } = require('./emailService');

const idOf = (value) => value?._id?.toString?.() || value?.toString?.();

const buildOwnerBrokerKey = (ownerId, brokerId) =>
  `owner_${ownerId}_broker_${brokerId}`;

const buildRenterBrokerKey = (renterId, brokerId, houseId) =>
  `renter_${renterId}_broker_${brokerId}_house_${houseId}`;

const emitToUser = (userId, event, payload) => {
  try {
    getIO().to(`user_${userId}`).emit(event, payload);
  } catch {
    // Socket.IO may not be initialized in non-server contexts.
  }
};

const getBrokerIdForHouse = (house) =>
  idOf(house.brokerId) || idOf(house.assignedBroker) || idOf(house.listedBy);

const assertApprovedBroker = async (brokerId) => {
  const broker = await User.findOne({
    _id: brokerId,
    role: 'broker',
    // isApproved: true,
    // brokerApplicationStatus: 'approved',
    status: 'active',
  });

  if (!broker) {
    throw new AppError('Broker not found', 404);
  }

  return broker;
};

const resolveConversationContext = async (senderId, receiverId, houseId = null) => {
  const [sender, receiver] = await Promise.all([
    User.findById(senderId).select('-password -refreshToken'),
    User.findById(receiverId).select('-password -refreshToken'),
  ]);

  if (!sender) throw new AppError('Sender not found', 404);
  if (!receiver) throw new AppError('Recipient not found', 404);

  if (houseId) {
    const house = await House.findById(houseId);
    if (!house) throw new AppError('House not found', 404);

    const brokerId = getBrokerIdForHouse(house);
    if (!brokerId) throw new AppError('This property has no assigned broker', 400);
    await assertApprovedBroker(brokerId);

    const senderIsBroker = idOf(sender._id) === brokerId;
    const receiverIsBroker = idOf(receiver._id) === brokerId;
    const senderIsOwner = idOf(house.ownerId) === idOf(sender._id);
    const receiverIsOwner = idOf(house.ownerId) === idOf(receiver._id);

    if ((senderIsBroker && receiverIsOwner) || (receiverIsBroker && senderIsOwner)) {
      const ownerId = senderIsOwner ? idOf(sender._id) : idOf(receiver._id);
      return {
        type: 'owner_broker',
        conversationKey: buildOwnerBrokerKey(ownerId, brokerId),
        participants: [ownerId, brokerId],
        ownerId,
        brokerId,
        renterId: null,
        houseId: idOf(house._id),
      };
    }

    if (senderIsBroker || receiverIsBroker) {
      const renter = senderIsBroker ? receiver : sender;
      if (idOf(renter._id) === idOf(house.ownerId)) {
        throw new AppError('Owners must use the owner-broker conversation for this property', 400);
      }

      return {
        type: 'renter_broker',
        conversationKey: buildRenterBrokerKey(idOf(renter._id), brokerId, idOf(house._id)),
        participants: [idOf(renter._id), brokerId],
        ownerId: idOf(house.ownerId) || null,
        brokerId,
        renterId: idOf(renter._id),
        houseId: idOf(house._id),
      };
    }

    throw new AppError('Renters can only contact the broker assigned to this property', 403);
  }

  const senderIsBroker = sender.role === 'broker';
  const receiverIsBroker = receiver.role === 'broker';

  if (senderIsBroker || receiverIsBroker) {
    const broker = senderIsBroker ? sender : receiver;
    const other = senderIsBroker ? receiver : sender;
    const existingConversation = await Conversation.findOne({
      type: 'owner_broker',
      ownerId: other._id,
      brokerId: broker._id,
    });
    const assignedProperty = await House.exists({
      ownerId: other._id,
      assignedBroker: broker._id,
    });

    if (!existingConversation && !assignedProperty) {
      throw new AppError('Select this broker through a property submission before messaging', 403);
    }

    return {
      type: 'owner_broker',
      conversationKey: buildOwnerBrokerKey(idOf(other._id), idOf(broker._id)),
      participants: [idOf(other._id), idOf(broker._id)],
      ownerId: idOf(other._id),
      brokerId: idOf(broker._id),
      renterId: null,
      houseId: existingConversation?.houseId ? idOf(existingConversation.houseId) : null,
    };
  }

  throw new AppError('A property context is required for this conversation', 400);
};

const ensureConversation = async ({ senderId, receiverId, houseId = null, createdBy = null }) => {
  const context = await resolveConversationContext(senderId, receiverId, houseId);

  let conversation = await Conversation.findOne({ conversationKey: context.conversationKey });
  if (!conversation) {
    conversation = await Conversation.create({
      ...context,
      createdBy: createdBy || senderId,
      readBy: [{ userId: createdBy || senderId, readAt: new Date() }],
    });
  } else if (context.houseId && !conversation.houseId) {
    conversation.houseId = context.houseId;
    await conversation.save();
  }

  return conversation;
};

const getConversationForMessage = async ({ senderId, receiverId, houseId = null, conversationId = null }) => {
  if (conversationId) {
    const conversation = await Conversation.findOne({ conversationKey: conversationId });
    if (!conversation) throw new AppError('Conversation not found', 404);

    const participantIds = conversation.participants.map(idOf);
    if (!participantIds.includes(idOf(senderId))) {
      throw new AppError('Not authorized for this conversation', 403);
    }

    const resolvedReceiverId = receiverId || participantIds.find((id) => id !== idOf(senderId));
    if (!resolvedReceiverId || !participantIds.includes(idOf(resolvedReceiverId))) {
      throw new AppError('Recipient is not part of this conversation', 403);
    }

    return { conversation, receiverId: resolvedReceiverId };
  }

  if (!receiverId) throw new AppError('Recipient is required', 400);
  const conversation = await ensureConversation({ senderId, receiverId, houseId, createdBy: senderId });
  return { conversation, receiverId };
};

const hydrateConversation = async (conversation, userId) => {
  const participantIds = conversation.participants.map(idOf);
  const partnerId = participantIds.find((id) => id !== idOf(userId));

  const [partner, lastMessage, unreadCount, house] = await Promise.all([
    User.findById(partnerId).select('name email phone profileImage role isApproved').lean(),
    Message.findOne({ conversationId: conversation.conversationKey })
      .sort({ createdAt: -1 })
      .lean(),
    Message.countDocuments({
      conversationId: conversation.conversationKey,
      receiverId: userId,
      read: false,
    }),
    conversation.houseId
      ? House.findById(conversation.houseId).select('title location price images status').lean()
      : null,
  ]);

  return {
    conversationId: conversation.conversationKey,
    type: conversation.type,
    partner,
    house,
    brokerId: idOf(conversation.brokerId),
    ownerId: idOf(conversation.ownerId),
    renterId: idOf(conversation.renterId),
    lastMessage,
    unreadCount,
    updatedAt: conversation.lastMessageAt || conversation.updatedAt,
  };
};

const getConversations = async (userId) => {
  const conversations = await Conversation.find({
    participants: userId,
    status: 'active',
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  const hydrated = await Promise.all(
    conversations.map((conversation) => hydrateConversation(conversation, userId))
  );

  return hydrated.filter((conversation) => conversation.partner);
};

const markConversationRead = async (userId, conversationKey) => {
  await Message.updateMany(
    { conversationId: conversationKey, receiverId: userId, read: false },
    { read: true }
  );

  await Conversation.updateOne(
    { conversationKey, participants: userId },
    {
      $pull: { readBy: { userId } },
    }
  );
  await Conversation.updateOne(
    { conversationKey, participants: userId },
    {
      $push: { readBy: { userId, readAt: new Date() } },
    }
  );

  try {
    getIO().to(`dm_${conversationKey}`).emit('dm-read-receipt', {
      conversationId: conversationKey,
      userId,
      readAt: new Date(),
    });
  } catch {
    // Socket.IO may not be initialized in non-server contexts.
  }
};

const getMessages = async (userId, partnerId, page = 1, limit = 50, houseId = null) => {
  const conversation = await ensureConversation({
    senderId: userId,
    receiverId: partnerId,
    houseId,
    createdBy: userId,
  });
  const skip = (page - 1) * limit;

  const messages = await Message.find({ conversationId: conversation.conversationKey })
    .populate('senderId', 'name profileImage role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  await markConversationRead(userId, conversation.conversationKey);

  const total = await Message.countDocuments({ conversationId: conversation.conversationKey });
  const hydratedConversation = await hydrateConversation(conversation.toObject(), userId);

  return {
    conversation: hydratedConversation,
    messages: messages.reverse(),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const sendMessage = async (senderId, receiverId, content, houseId = null, conversationId = null) => {
  if (!content || !content.trim()) throw new AppError('Message content is required', 400);

  const { conversation, receiverId: resolvedReceiverId } = await getConversationForMessage({
    senderId,
    receiverId,
    houseId,
    conversationId,
  });

  const [sender, receiver] = await Promise.all([
    User.findById(senderId).select('name email profileImage role'),
    User.findById(resolvedReceiverId).select('name email profileImage role'),
  ]);
  if (!receiver) throw new AppError('Recipient not found', 404);

  const msg = await Message.create({
    conversationId: conversation.conversationKey,
    senderId,
    receiverId: resolvedReceiverId,
    content: content.trim(),
    houseId: conversation.houseId || houseId || null,
  });

  conversation.lastMessageId = msg._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  const notification = await Notification.create({
    userId: resolvedReceiverId,
    type: 'new_message',
    message: `New message from ${sender.name}`,
    data: {
      conversationId: conversation.conversationKey,
      houseId: conversation.houseId || houseId || null,
      senderId,
    },
  });

  emitToUser(resolvedReceiverId, 'notification', notification);
  emitToUser(resolvedReceiverId, 'new_message', msg);

  try {
    let houseInfo = '';
    if (conversation.houseId || houseId) {
      const house = await House.findById(conversation.houseId || houseId);
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
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${content.trim()}</p>
          <p>Please continue the conversation in your dashboard.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email for new message:', emailError);
  }

  const populated = await msg.populate('senderId', 'name profileImage role');
  return populated;
};

module.exports = {
  buildOwnerBrokerKey,
  buildRenterBrokerKey,
  ensureConversation,
  getConversations,
  getMessages,
  markConversationRead,
  sendMessage,
};
