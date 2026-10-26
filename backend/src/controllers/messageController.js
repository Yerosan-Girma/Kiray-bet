const messageService = require('../services/messageService');
const { catchAsync } = require('../utils/AppError');

exports.getConversations = catchAsync(async (req, res) => {
  const conversations = await messageService.getConversations(req.user.id);
  res.json({ success: true, data: conversations });
});

exports.getMessages = catchAsync(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const result = await messageService.getMessages(
    req.user.id,
    req.params.partnerId,
    parseInt(page),
    parseInt(limit),
    req.query.houseId || null
  );
  res.json({
    success: true,
    data: result.messages,
    conversation: result.conversation,
    pagination: result.pagination,
  });
});

exports.sendMessage = catchAsync(async (req, res) => {
  const { content, houseId } = req.body;
  const msg = await messageService.sendMessage(
    req.user.id,
    req.params.partnerId,
    content,
    houseId || null,
    req.body.conversationId || null
  );
  res.status(201).json({ success: true, data: msg });
});

exports.ensureConversation = catchAsync(async (req, res) => {
  const conversation = await messageService.ensureConversation({
    senderId: req.user.id,
    receiverId: req.body.partnerId,
    houseId: req.body.houseId || null,
    createdBy: req.user.id,
  });

  res.status(201).json({ success: true, data: conversation });
});
