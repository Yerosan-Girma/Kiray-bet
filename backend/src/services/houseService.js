const House = require('../models/House');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../utils/AppError');
const { deleteFromCloudinary } = require('../utils/cloudinary');
const { createNotification } = require('./notificationService');
const { getIO } = require('../config/socket');
const { sendEmail } = require('./emailService');

const idOf = (value) => value?._id?.toString?.() || value?.toString?.();

const requireActiveApprovedBroker = async (userOrId) => {
  const user = (userOrId && typeof userOrId === 'object' && userOrId.role)
    ? userOrId
    : await User.findById(userOrId).select('-password -refreshToken');

  if (!user || user.role !== 'broker') {
    throw new AppError('Only admin-approved brokers can manage listings', 403);
  }

  // A broker is considered approved if isApproved is true OR brokerApplicationStatus is 'approved'
  if (!user.isApproved && user.brokerApplicationStatus !== 'approved') {
    throw new AppError('Broker dashboard access requires admin approval. Please wait for your application to be reviewed.', 403);
  }

  if (user.status !== 'active') {
    throw new AppError('Your broker account is not active', 403);
  }

  return user;
};

const emitToUser = (userId, event, payload) => {
  try {
    getIO().to(`user_${userId}`).emit(event, payload);
  } catch {
    // Socket.IO may not be initialized in non-server contexts.
  }
};

const createHouse = async (houseData, userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  // Enforce that only admin-approved brokers can create listings
  if (user.role !== 'admin') {
    await requireActiveApprovedBroker(user);
  }

  const brokerId = user.role === 'broker' ? userId : houseData.brokerId || houseData.assignedBroker || null;
  const ownerId = houseData.ownerId || (user.role === 'broker' ? userId : null);

  if (houseData.status === 'approved' && (!ownerId || !brokerId)) {
    throw new AppError('Published listings must have both ownerId and brokerId', 400);
  }

  // Skip premium limit check for now to allow testing
  // const isPremium = user.isPremium && user.premiumExpiry > Date.now();
  // if (user.role === 'broker' && !isPremium) {
  //   const activeListings = await House.countDocuments({
  //     listedBy: userId,
  //     status: { $nin: ['rejected', 'inactive', 'rented'] },
  //   });
  //   if (activeListings >= 1) {
  //     throw new AppError('Free account can only have 1 active listing. Upgrade to premium.', 403);
  //   }
  // }

  const house = await House.create({
    ...houseData,
    listedBy: userId,
    ownerId,
    brokerId,
    assignedBroker: brokerId,
    uploadedBy: userId,
    isActive: houseData.status === 'approved' ? true : (houseData.isActive !== undefined ? houseData.isActive : true),
    isPremium: houseData.isPremium || false,
    brokerSubmissionStatus: houseData.brokerSubmissionStatus || (user.role === 'broker' ? 'accepted' : 'none'),
  });

  if (house.status === 'approved') {
    const notif = await createNotification(
      userId,
      'listing_approved',
      `Your property "${house.title}" has been published and is now live on the website.`,
      { houseId: house._id }
    );
    emitToUser(userId, 'notification', notif);
  }

  return house;
};

const getHouseById = async (houseId) => {
  const house = await House.findById(houseId)
    .populate('listedBy', 'name email phone profileImage role isApproved brokerCompanyName')
    .populate('brokerId', 'name email phone profileImage role isApproved brokerCompanyName')
    .populate('assignedBroker', 'name email phone profileImage role isApproved brokerCompanyName')
    .populate('ownerId', 'name email phone profileImage role');
  if (!house) throw new AppError('House not found', 404);

  house.views += 1;
  await house.save();

  return house;
};

const assertCanManageHouse = async (house, userId, role) => {
  if (role === 'admin') return;

  if (role !== 'broker') {
    throw new AppError('Owners submit properties to brokers and cannot publish listings directly', 403);
  }

  await requireActiveApprovedBroker(userId);

  if (idOf(house.listedBy) !== idOf(userId) && idOf(house.brokerId) !== idOf(userId)) {
    throw new AppError('Not authorized to manage this listing', 403);
  }
};

const prepareForPublish = async (house, userId, role) => {
  const brokerId = idOf(house.brokerId) || idOf(house.assignedBroker) || idOf(house.listedBy);
  if (!brokerId) throw new AppError('Published listings must have a brokerId', 400);

  const broker = await requireActiveApprovedBroker(brokerId);
  // ownerId: preserve the original property owner, fall back to broker only if truly unset
  const ownerId = idOf(house.ownerId) || userId;
  if (!ownerId) throw new AppError('Published listings must have an ownerId', 400);

  house.ownerId = ownerId;
  house.brokerId = broker._id;
  house.assignedBroker = broker._id;
  house.listedBy = broker._id;
  house.uploadedBy = role === 'broker' ? userId : house.uploadedBy || broker._id;
  house.isActive = true;   // always make visible when published
  house.status = 'approved';

  return { broker, ownerId };
};

const updateHouse = async (houseId, updateData, userId, role) => {
  const house = await House.findById(houseId);
  if (!house) throw new AppError('House not found', 404);

  await assertCanManageHouse(house, userId, role);

  // Preserve the original ownerId — never let updateData overwrite it with the broker's id
  const originalOwnerId = idOf(house.ownerId);

  const wasNotApproved = house.status !== 'approved';
  Object.assign(house, updateData);

  // Restore ownerId if updateData wiped it out
  if (originalOwnerId && !idOf(house.ownerId)) {
    house.ownerId = originalOwnerId;
  }

  if (house.status === 'approved') {
    await prepareForPublish(house, userId, role);
    if (house.brokerSubmissionStatus === 'pending_broker') {
      house.brokerSubmissionStatus = 'accepted';
    }
  }

  await house.save();

  // Notify broker when they publish a listing directly
  if (wasNotApproved && house.status === 'approved' && role === 'broker') {
    const notif = await createNotification(
      userId,
      'listing_approved',
      `Your property "${house.title}" has been published and is now live on the website.`,
      { houseId: house._id }
    );
    emitToUser(userId, 'notification', notif);
  }

  if (wasNotApproved && house.status === 'approved' && house.ownerId) {
    const notif = await createNotification(
      house.ownerId,
      'listing_approved',
      `Your property "${house.title}" has been published successfully and is now visible on the website.`,
      { houseId: house._id }
    );
    emitToUser(house.ownerId, 'notification', notif);

    const owner = await User.findById(house.ownerId);
    if (owner) {
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
                <li>Price: ETB ${house.price.toLocaleString()}</li>
                <li>Property Type: ${house.propertyType}</li>
              </ul>
              <p>Potential renters can now contact the assigned broker for inquiries.</p>
              <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email to owner:', emailError);
      }
    }

    await AuditLog.create({
      userId,
      adminId: role === 'admin' ? userId : null,
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

  await assertCanManageHouse(house, userId, role);

  for (const image of house.images) {
    try {
      await deleteFromCloudinary(image);
    } catch {
      // Continue even if an external image cleanup fails.
    }
  }

  await AuditLog.create({
    userId,
    adminId: role === 'admin' ? userId : null,
    action: 'delete_listing',
    targetId: house._id,
    targetType: 'house',
    details: { title: house.title, status: house.status },
  });

  await house.deleteOne();
  return house;
};

const getHouses = async (filters = {}, page = 1, limit = 10) => {
  let query = {};

  if (filters.status === 'rented') {
    query.status = 'rented';
  } else if (filters.status === 'all') {
    query.status = { $in: ['approved', 'rented'] };
  } else {
    // Default: only available (active, approved) properties
    query.status = 'approved';
    query.isActive = true;
  }

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
    .populate('listedBy', 'name email phone profileImage role isApproved brokerCompanyName')
    .populate('brokerId', 'name email phone profileImage role isApproved brokerCompanyName')
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
        $maxDistance: radius * 1000,
      },
    },
    isActive: true,
    status: 'approved',
  };

  const skip = (page - 1) * limit;
  const houses = await House.find(query)
    .populate('listedBy', 'name email phone profileImage role isApproved brokerCompanyName')
    .populate('brokerId', 'name email phone profileImage role isApproved brokerCompanyName')
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

const getMyListings = async (userId) => {
  return House.find({ $or: [{ listedBy: userId }, { brokerId: userId }, { assignedBroker: userId }] })
    .populate('assignedBroker', 'name email phone')
    .populate('brokerId', 'name email phone profileImage role')
    .populate('ownerId', 'name email phone profileImage role')
    .sort({ createdAt: -1 });
};

const getOwnerSubmissions = async (ownerId) => {
  return House.find({ ownerId })
    .populate('assignedBroker', 'name email phone profileImage role brokerCompanyName')
    .populate('brokerId', 'name email phone profileImage role brokerCompanyName')
    .populate('ownerId', 'name email phone profileImage role')
    .sort({ createdAt: -1 });
};

module.exports = {
  createHouse,
  getHouseById,
  updateHouse,
  deleteHouse,
  getHouses,
  getNearbyHouses,
  getMyListings,
  getOwnerSubmissions,
};
