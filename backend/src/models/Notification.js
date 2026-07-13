const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'new_inquiry',
        'new_reply',
        'listing_approved',
        'listing_rejected',
        'premium_activated',
        'listing_flagged',
        'broker_application_received',
        'broker_approved',
        'broker_rejected',
        'new_owner_submission',
        'owner_submission_accepted',
        'owner_submission_rejected',
        'new_message',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);