const mongoose = require('mongoose');

const rentSchema = new mongoose.Schema(
  {
    houseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    brokerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    leaseStartDate: {
      type: Date,
      required: true,
    },
    leaseEndDate: {
      type: Date,
      required: true,
    },
    monthlyRent: {
      type: Number,
      required: true,
      min: 0,
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentSchedule: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'telebirr', 'chapa', 'mpesa'],
      default: 'bank_transfer',
    },
    status: {
      type: String,
      enum: ['active', 'terminated', 'completed', 'pending'],
      default: 'pending',
    },
    agreementDocument: {
      type: String,
      default: '',
    },
    terms: {
      type: String,
      trim: true,
    },
    isAutoRenew: {
      type: Boolean,
      default: false,
    },
    noticePeriod: {
      type: Number,
      default: 30,
    },
    paymentHistory: [{
      amount: Number,
      paymentDate: Date,
      dueDate: Date,
      status: {
        type: String,
        enum: ['paid', 'pending', 'overdue', 'partial'],
        default: 'pending',
      },
      transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
      },
      notes: String,
    }],
    terminationDate: {
      type: Date,
      default: null,
    },
    terminationReason: {
      type: String,
      default: '',
    },
    terminatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
rentSchema.index({ houseId: 1, status: 1 });
rentSchema.index({ tenantId: 1, status: 1 });
rentSchema.index({ landlordId: 1, status: 1 });
rentSchema.index({ brokerId: 1, status: 1 });
rentSchema.index({ leaseEndDate: 1, status: 1 });

// Pre-save validation
rentSchema.pre('save', function (next) {
  if (this.leaseStartDate >= this.leaseEndDate) {
    next(new Error('Lease end date must be after start date'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Rent', rentSchema);
