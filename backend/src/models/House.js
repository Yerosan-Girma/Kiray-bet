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
    propertyType: {
      type: String,
      enum: ['apartment', 'house', 'condo', 'studio', 'villa', 'townhouse'],
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
    isPremium: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'inactive'],
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

module.exports = mongoose.model('House', houseSchema);