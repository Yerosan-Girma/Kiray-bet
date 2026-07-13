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
    parseInt(limit)
  );
  res.json({ success: true, data: result.messages, pagination: result.pagination });
});

exports.sendMessage = catchAsync(async (req, res) => {
  const { content, houseId } = req.body;
  const msg = await messageService.sendMessage(
    req.user.id,
    req.params.partnerId,
    content,
    houseId
  );
  res.status(201).json({ success: true, data: msg });
});
