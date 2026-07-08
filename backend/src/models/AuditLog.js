const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'house', 'transaction', 'inquiry'],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Prevent updates and deletes (use middleware or just don't expose endpoints)
auditLogSchema.pre('save', function (next) {
  // You could add logic to prevent updates if needed
  next();
});

module.exports = mongoose.model('AuditLog', auditLogSchema);