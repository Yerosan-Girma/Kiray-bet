const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['chapa', 'telebirr', 'mpesa'],
      required: true,
    },
    reference: {
      type: String,
      unique: true,
      required: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    checkoutRequestId: {
      type: String,
    },
    merchantRequestId: {
      type: String,
    },
    failureReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ userId: 1, status: 1 });


module.exports = mongoose.model('Transaction', transactionSchema);