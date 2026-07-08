const paymentService = require('../services/paymentService');
const { catchAsync } = require('../utils/AppError');

exports.createPayment = catchAsync(async (req, res) => {
  const { amount, paymentMethod } = req.body;
  const transaction = await paymentService.createPayment(req.user.id, amount, paymentMethod);
  res.status(201).json({ success: true, data: transaction });
});

exports.getPaymentStatus = catchAsync(async (req, res) => {
  const transaction = await paymentService.getPaymentStatus(req.params.id, req.user.id);
  res.json({ success: true, data: transaction });
});

exports.getPaymentHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await paymentService.getPaymentHistory(req.user.id, parseInt(page), parseInt(limit));
  res.json({ success: true, data: result.transactions, pagination: result.pagination });
});

// Webhook callback (no auth, public)
exports.paymentCallback = catchAsync(async (req, res) => {
  const { reference, status, receiptNumber, failureReason } = req.body;
  await paymentService.handlePaymentCallback(reference, status, receiptNumber, failureReason);
  res.json({ success: true, message: 'Callback processed' });
});