const inquiryService = require('../services/inquiryService');
const { catchAsync } = require('../utils/AppError');

exports.createInquiry = catchAsync(async (req, res) => {
  const { houseId, contactPhone, message } = req.body;
  const inquiry = await inquiryService.createInquiry(req.user.id, houseId, contactPhone, message);
  res.status(201).json({ success: true, data: inquiry });
});

exports.getInquiries = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await inquiryService.getInquiriesForUser(req.user.id, req.user.role, parseInt(page), parseInt(limit));
  res.json({ success: true, data: result.inquiries, pagination: result.pagination });
});

exports.addReply = catchAsync(async (req, res) => {
  const { message } = req.body;
  const reply = await inquiryService.addReply(req.params.id, req.user.id, message);
  res.status(201).json({ success: true, data: reply });
});