const House = require('../models/House');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../utils/AppError');
const { deleteFromCloudinary } = require('../utils/cloudinary');
const { createNotification } = require('./notificationService');
const { getIO } = require('../config/socket');
const { sendEmail } = require('./emailService');

const createHouse = async (houseData, userId) => {
  // Check if user is owner or broker
  const user = await User.findById(userId);
  if (!['owner', 'broker', 'admin'].includes(user.role)) {
    throw new AppError('Only owners and brokers can list houses', 403);
  }

  // Check premium status for listing limits
  const isPremium = user.isPremium && user.premiumExpiry > Date.now();
  if (!isPremium) {
    const activeListings = await House.countDocuments({
      listedBy: userId,
      status: { $ne: 'rejected' },
    });
    if (activeListings >= 1) {
      throw new AppError('Free account can only have 1 active listing. Upgrade to premium.', 403);
    }
  }

  // Create house
  const house = await House.create({
    ...houseData,
    listedBy: userId,
    isPremium: isPremium && houseData.isPremium, // only if user premium
  });

  return house;
};

const getHouseById = async (houseId) => {
  const house = await House.findById(houseId).populate('listedBy', 'name email phone profileImage');
  if (!house) throw new AppError('House not found', 404);

  // Increment view count
  house.views += 1;
  await house.save();

  return house;
};

const updateHouse = async (houseId, updateData, userId, role) => {
  const house = await House.findById(houseId);
  if (!house) throw new AppError('House not found', 404);

  // Authorization: only owner or admin can update
  if (house.listedBy.toString() !== userId && role !== 'admin') {
    throw new AppError('Not authorized to update this listing', 403);
  }

  // Check if status is being changed to approved (property published)
  const wasNotApproved = house.status !== 'approved';
  Object.assign(house, updateData);
  await house.save();

  // If property was just published, notify owner
  if (wasNotApproved && house.status === 'approved' && house.ownerId) {
    const notif = await createNotification(
      house.ownerId,
      'listing_approved',
      `Your property "${house.title}" has been published successfully and is now visible on the website.`,
      { houseId: house._id }
    );
    const io = getIO();
    io.to(`user_${house.ownerId}`).emit('notification', notif);

    // Send email to owner
    const owner = await User.findById(house.ownerId);
    try {
      await sendEmail({
        to: owner.email,
        subject: 'Property Published Successfully',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C9922A;">Property Published Successfully</h2>
            <p>Hello ${owner.name},</p>
            <p>Your property <strong>"${house.title}"</strong> has been published successfully and is now visible on the website.</p>
            <p><strong>Property Details:</strong></p>
            <ul>
              <li>Title: ${house.title}</li>
              <li>Location: ${house.location}</li>
              <li>Price: KSh ${house.price.toLocaleString()}</li>
              <li>Property Type: ${house.propertyType}</li>
            </ul>
            <p>You can view your property listing on the website. Potential renters can now contact the broker for inquiries.</p>
            <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send email to owner:', emailError);
    }

    // Audit log
    await AuditLog.create({
      userId: userId,
      action: 'property_published',
      targetId: house._id,
      targetType: 'house',
      details: { previousStatus: 'pending', newStatus: 'approved' },
    });
  }

  return house;
};

const deleteHouse = async (houseId, userId, role) => {
  const house = await House.findById(houseId);
  if (!house) throw new AppError('House not found', 404);

  if (house.listedBy.toString() !== userId && role !== 'admin') {
    throw new AppError('Not authorized to delete this listing', 403);
  }

  // Delete images from Cloudinary
  for (const image of house.images) {
    try {
      await deleteFromCloudinary(image);
    } catch (err) {
      // log but continue
    }
  }

  // Audit log before deletion
  await AuditLog.create({
    userId: userId,
    adminId: role === 'admin' ? userId : null,
    action: 'delete_listing',
    targetId: house._id,
    targetType: 'house',
    details: { title: house.title, status: house.status },
  });

  await house.deleteOne();
  return house;
};

const getHouses = async (filters, page = 1, limit = 10) => {
  const query = { isActive: true, status: 'approved' };

  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  if (filters.city) {
    query.location = { $regex: filters.city, $options: 'i' };
  }
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = filters.minPrice;
    if (filters.maxPrice) query.price.$lte = filters.maxPrice;
  }
  if (filters.bedrooms) query.bedrooms = filters.bedrooms;
  if (filters.bathrooms) query.bathrooms = filters.bathrooms;
  if (filters.propertyType) query.propertyType = filters.propertyType;
  if (filters.amenities && filters.amenities.length) {
    query.amenities = { $all: filters.amenities };
  }
  if (filters.isPremium !== undefined) query.isPremium = filters.isPremium;

  let sort = {};
  if (filters.sort === 'newest') sort = { createdAt: -1 };
  else if (filters.sort === 'oldest') sort = { createdAt: 1 };
  else if (filters.sort === 'price_asc') sort = { price: 1 };
  else if (filters.sort === 'price_desc') sort = { price: -1 };
  else if (filters.sort === 'views') sort = { views: -1 };
  else if (filters.sort === 'inquiries') sort = { inquiryCount: -1 };
  else sort = { createdAt: -1 };

  const skip = (page - 1) * limit;
  const houses = await House.find(query)
    .populate('listedBy', 'name email phone profileImage')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await House.countDocuments(query);

  return {
    houses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getNearbyHouses = async (longitude, latitude, radius = 10, page = 1, limit = 10) => {
  const query = {
    coordinates: {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: radius * 1000, // convert km to meters
      },
    },
    isActive: true,
    status: 'approved',
  };

  const skip = (page - 1) * limit;
  const houses = await House.find(query)
    .populate('listedBy', 'name email phone profileImage')
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await House.countDocuments(query);

  return {
    houses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  createHouse,
  getHouseById,
  updateHouse,
  deleteHouse,
  getHouses,
  getNearbyHouses,
};