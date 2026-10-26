const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Some actions may not be initiated by admin
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // User who performed the action
    },
    action: {
      type: String,
      required: true,
      enum: [
        'approve_user',
        'approve_broker',
        'reject_broker',
        'suspend_user',
        'ban_user',
        'restore_user',
        'approve_listing',
        'reject_listing',
        'suspend_listing',
        'delete_listing',
        'broker_application_submitted',
        'property_submitted',
        'property_published',
        'inquiry_created',
        'payment_verified',
        'user_reported',
        'listing_reported',
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'house', 'transaction', 'inquiry', 'broker_application', 'notification', 'message'],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Audit logs are append-only.
auditLogSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified()) {
    return next(new Error('Audit logs cannot be edited'));
  }
  next();
});

auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'], function (next) {
  next(new Error('Audit logs cannot be edited'));
});

// Indexes for efficient querying
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
