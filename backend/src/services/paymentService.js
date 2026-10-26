const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../utils/AppError');
const logger = require('../utils/logger');

// Payment gateways (abstracted)
const processChapa = async (amount, reference, user) => {
  // Placeholder: implement Chapa API call
  logger.info(`Processing Chapa payment for ${user.email}, amount ${amount}, ref ${reference}`);
  // Simulate success
  return { status: 'success', reference, receiptNumber: `CH-${uuidv4().slice(0, 8)}` };
};

const processTelebirr = async (amount, reference, user) => {
  logger.info(`Processing Telebirr payment for ${user.email}, amount ${amount}, ref ${reference}`);
  return { status: 'success', reference, receiptNumber: `TB-${uuidv4().slice(0, 8)}` };
};

const processMpesa = async (amount, reference, user) => {
  logger.info(`Processing M-Pesa payment for ${user.email}, amount ${amount}, ref ${reference}`);
  return { status: 'success', reference, receiptNumber: `MP-${uuidv4().slice(0, 8)}` };
};

const createPayment = async (userId, amount, paymentMethod) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const reference = `PAY-${uuidv4()}`;
  const transaction = await Transaction.create({
    userId,
    amount,
    paymentMethod,
    reference,
    status: 'pending',
  });

  let paymentResult;
  switch (paymentMethod) {
    case 'chapa':
      paymentResult = await processChapa(amount, reference, user);
      break;
    case 'telebirr':
      paymentResult = await processTelebirr(amount, reference, user);
      break;
    case 'mpesa':
      paymentResult = await processMpesa(amount, reference, user);
      break;
    default:
      throw new AppError('Unsupported payment method', 400);
  }

  if (paymentResult.status === 'success') {
    transaction.status = 'success';
    transaction.receiptNumber = paymentResult.receiptNumber;
    await transaction.save();

    // Upgrade user to premium for 30 days
    user.isPremium = true;
    user.premiumExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    // Create notification
    const { createNotification } = require('./notificationService');
    await createNotification(userId, 'premium_activated', 'Your premium subscription is now active!', { transactionId: transaction._id });
  } else {
    transaction.status = 'failed';
    transaction.failureReason = paymentResult.failureReason || 'Payment failed';
    await transaction.save();
    throw new AppError('Payment failed', 400);
  }

  return transaction;
};

const getPaymentStatus = async (transactionId, userId) => {
  const transaction = await Transaction.findOne({ _id: transactionId, userId });
  if (!transaction) throw new AppError('Transaction not found', 404);
  return transaction;
};

const getPaymentHistory = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const transactions = await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await Transaction.countDocuments({ userId });
  return { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

// Webhook callback handler for payment gateways
const handlePaymentCallback = async (reference, status, receiptNumber = null, failureReason = '') => {
  const transaction = await Transaction.findOne({ reference });
  if (!transaction) throw new AppError('Transaction not found', 404);
  if (status === 'success') {
    transaction.status = 'success';
    transaction.receiptNumber = receiptNumber;
    await transaction.save();
    const user = await User.findById(transaction.userId);
    user.isPremium = true;
    user.premiumExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();
    const { createNotification } = require('./notificationService');
    await createNotification(transaction.userId, 'premium_activated', 'Premium activated!', { transactionId: transaction._id });
  } else {
    transaction.status = 'failed';
    transaction.failureReason = failureReason;
    await transaction.save();
  }
  return transaction;
};

module.exports = {
  createPayment,
  getPaymentStatus,
  getPaymentHistory,
  handlePaymentCallback,
};
