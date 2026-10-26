const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: '2dsphere',
      },
    },
    bedrooms: {
      type: Number,
      required: [true, 'Number of bedrooms is required'],
      min: 0,
    },
    bathrooms: {
      type: Number,
      required: [true, 'Number of bathrooms is required'],
      min: 0,
    },
    sqft: {
      type: Number,
      default: 0,
    },
    propertyType: {
      type: String,
      enum: ['apartment', 'house', 'condo', 'studio', 'villa', 'townhouse', 'penthouse', 'beach house'],
      required: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'Maximum 10 images allowed',
      },
      default: [],
    },
    listedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    brokerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'inactive', 'rented'],
      default: 'pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    inquiryCount: {
      type: Number,
      default: 0,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
    },
    // Owner → Broker submission fields
    assignedBroker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    brokerSubmissionStatus: {
      type: String,
      enum: ['none', 'pending_broker', 'accepted', 'rejected'],
      default: 'none',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
houseSchema.index({ coordinates: '2dsphere' });
houseSchema.index({ title: 'text', description: 'text', location: 'text' });
houseSchema.index({ price: 1 });
houseSchema.index({ propertyType: 1 });
houseSchema.index({ bedrooms: 1 });
houseSchema.index({ bathrooms: 1 });
houseSchema.index({ status: 1 });
houseSchema.index({ isActive: 1 });
houseSchema.index({ isPremium: 1 });
houseSchema.index({ ownerId: 1 });
houseSchema.index({ brokerId: 1 });
houseSchema.index({ assignedBroker: 1, brokerSubmissionStatus: 1 });

module.exports = mongoose.model('House', houseSchema);
