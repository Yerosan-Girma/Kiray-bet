const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const House = require('../models/House');
const Inquiry = require('../models/Inquiry');
const Message = require('../models/Message');
const logger = require('../utils/logger');

let io;
const onlineUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin or any local dev frontend
        callback(null, true);
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      if (!user) {
        socket.user = null;
        return next();
      }

      socket.user = user;
      next();
    } catch (err) {
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    if (!socket.user) {
      logger.info('Anonymous visitor connected to socket for public updates');
      return;
    }

    logger.info(`User ${socket.user.email} connected`);
    const socketUserId = socket.user.id;
    onlineUsers.set(socketUserId, (onlineUsers.get(socketUserId) || 0) + 1);
    socket.join(`user_${socketUserId}`);
    io.emit('user-online', { userId: socketUserId });

    // Join a room based on inquiry ID
    socket.on('join-inquiry', (inquiryId) => {
      socket.join(`inquiry_${inquiryId}`);
      logger.info(`User ${socket.user.email} joined inquiry ${inquiryId}`);
    });

    // Leave room
    socket.on('leave-inquiry', (inquiryId) => {
      socket.leave(`inquiry_${inquiryId}`);
    });

    // Send message
    socket.on('send-message', async ({ inquiryId, message }) => {
      try {
        const inquiry = await Inquiry.findById(inquiryId);
        if (!inquiry) throw new Error('Inquiry not found');

        // Check if user is participant (renter or owner/broker)
        const isRenter = inquiry.userId.toString() === socket.user.id;
        const isOwner = inquiry.houseId.listedBy.toString() === socket.user.id;
        // For simplicity, we assume broker is also listedBy? Actually listedBy can be owner or broker.
        // We'll check if user is the listedBy or the renter
        const house = await House.findById(inquiry.houseId);
        const isListedBy = house.listedBy.toString() === socket.user.id;

        if (!isRenter && !isListedBy) {
          socket.emit('error', { message: 'Not authorized to reply to this inquiry' });
          return;
        }

        const reply = {
          userId: socket.user.id,
          message,
          createdAt: new Date(),
        };
        inquiry.replies.push(reply);
        inquiry.status = 'active';
        await inquiry.save();

        // Emit to all participants in the room
        io.to(`inquiry_${inquiryId}`).emit('new-message', {
          inquiryId,
          reply,
          sender: {
            id: socket.user.id,
            name: socket.user.name,
            role: socket.user.role,
          },
        });

        // Send notification to other participants (omitted for brevity)

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Typing indicator
    socket.on('typing', ({ inquiryId, isTyping }) => {
      socket.to(`inquiry_${inquiryId}`).emit('user-typing', {
        userId: socket.user.id,
        isTyping,
      });
    });

    // ── Private DM rooms (owner ↔ broker) ──────────────────────────────────
    socket.on('join-dm', (conversationId) => {
      socket.join(`dm_${conversationId}`);
    });

    socket.on('leave-dm', (conversationId) => {
      socket.leave(`dm_${conversationId}`);
    });

    socket.on('send-dm', async ({ conversationId, receiverId, content, houseId }) => {
      try {
        const msg = await Message.create({
          conversationId,
          senderId: socket.user.id,
          receiverId,
          content,
          houseId: houseId || null,
        });

        const populated = await msg.populate('senderId', 'name profileImage role');

        io.to(`dm_${conversationId}`).emit('new-dm', populated);

        // Notify receiver
        const { createNotification } = require('../services/notificationService');
        const notification = await createNotification(
          receiverId,
          'new_message',
          `New message from ${socket.user.name}`,
          { conversationId, senderId: socket.user.id }
        );
        io.to(`user_${receiverId}`).emit('notification', notification);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('dm-typing', ({ conversationId, isTyping }) => {
      socket.to(`dm_${conversationId}`).emit('dm-user-typing', {
        userId: socket.user.id,
        name: socket.user.name,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`User ${socket.user.email} disconnected`);
      const remaining = (onlineUsers.get(socketUserId) || 1) - 1;
      if (remaining > 0) {
        onlineUsers.set(socketUserId, remaining);
      } else {
        onlineUsers.delete(socketUserId);
        io.emit('user-offline', { userId: socketUserId });
      }
    });
  });

  return io;
};

const dummyIO = {
  to: () => dummyIO,
  in: () => dummyIO,
  emit: () => {},
};

const getIO = () => {
  if (!io) {
    logger.warn('Socket.io not initialized; returning mock socket broadcaster');
    return dummyIO;
  }
  return io;
};

module.exports = { initSocket, getIO };
