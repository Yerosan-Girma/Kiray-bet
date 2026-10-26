const Rent = require('../models/Rent');
const House = require('../models/House');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../utils/AppError');
const { getIO } = require('../config/socket');
const { sendEmail } = require('./emailService');

const idOf = (value) => value?._id?.toString?.() || value?.toString?.();

// ── Create rental agreement (Broker action) ──────────────────────────────────
const createRentalAgreement = async (brokerId, houseId, tenantId, rentalData) => {
  const house = await House.findById(houseId);
  if (!house) throw new AppError('House not found', 404);
  if (house.status !== 'approved') throw new AppError('House must be published to create rental agreement', 400);
  if (house.status === 'rented') throw new AppError('House is already rented', 400);

  const broker = await User.findById(brokerId);
  if (!broker || broker.role !== 'broker') throw new AppError('Broker not found', 404);

  const tenant = await User.findById(tenantId);
  if (!tenant) throw new AppError('Tenant not found', 404);

  const ownerId = idOf(house.ownerId) || idOf(house.listedBy);
  const owner = await User.findById(ownerId);
  if (!owner) throw new AppError('Property owner not found', 404);

  // Validate dates
  const leaseStart = new Date(rentalData.leaseStartDate);
  const leaseEnd = new Date(rentalData.leaseEndDate);
  if (leaseStart >= leaseEnd) throw new AppError('Lease end date must be after start date', 400);

  // Create rental agreement
  const rent = await Rent.create({
    houseId,
    tenantId,
    landlordId: ownerId,
    brokerId,
    leaseStartDate: leaseStart,
    leaseEndDate: leaseEnd,
    monthlyRent: rentalData.monthlyRent,
    securityDeposit: rentalData.securityDeposit || 0,
    paymentSchedule: rentalData.paymentSchedule || 'monthly',
    paymentMethod: rentalData.paymentMethod || 'bank_transfer',
    status: 'active',
    terms: rentalData.terms || '',
    isAutoRenew: rentalData.isAutoRenew || false,
    noticePeriod: rentalData.noticePeriod || 30,
    agreementDocument: rentalData.agreementDocument || '',
  });

  // Update house status
  house.status = 'rented';
  house.isActive = false; // Hide from listings
  await house.save();

  // Audit log
  await AuditLog.create({
    userId: brokerId,
    adminId: null,
    action: 'rental_agreement_created',
    targetId: rent._id,
    targetType: 'rent',
    details: {
      houseId: house._id,
      tenantId: tenant._id,
      landlordId: owner._id,
      monthlyRent: rent.monthlyRent,
    },
  });

  const io = getIO();

  // Notify owner
  const ownerNotification = await Notification.create({
    userId: owner._id,
    type: 'property_rented',
    message: `Your property "${house.title}" has been rented to ${tenant.name}. Broker: ${broker.name}`,
    data: {
      rentId: rent._id,
      houseId: house._id,
      tenantId: tenant._id,
      brokerId: broker._id,
    },
  });
  io.to(`user_${owner._id}`).emit('notification', ownerNotification);

  // Send email to owner
  try {
    await sendEmail({
      to: owner.email,
      subject: 'Property Rented Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">Property Rented Successfully</h2>
          <p>Hello ${owner.name},</p>
          <p>Great news! Your property <strong>"${house.title}"</strong> has been rented.</p>
          <p><strong>Rental Details:</strong></p>
          <ul>
            <li>Tenant: ${tenant.name} (${tenant.email})</li>
            <li>Broker: ${broker.name} (${broker.email})</li>
            <li>Monthly Rent: ETB ${rent.monthlyRent.toLocaleString()}</li>
            <li>Lease Start: ${leaseStart.toLocaleDateString()}</li>
            <li>Lease End: ${leaseEnd.toLocaleDateString()}</li>
            <li>Security Deposit: ETB ${rent.securityDeposit.toLocaleString()}</li>
          </ul>
          <p>The broker has created a rental agreement. You can view the details in your dashboard.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email to owner:', emailError);
  }

  // Notify tenant
  const tenantNotification = await Notification.create({
    userId: tenant._id,
    type: 'rental_agreement_created',
    message: `Rental agreement created for "${house.title}". Lease starts ${leaseStart.toLocaleDateString()}`,
    data: {
      rentId: rent._id,
      houseId: house._id,
      landlordId: owner._id,
      brokerId: broker._id,
    },
  });
  io.to(`user_${tenant._id}`).emit('notification', tenantNotification);

  // Send email to tenant
  try {
    await sendEmail({
      to: tenant.email,
      subject: 'Rental Agreement Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">Rental Agreement Created</h2>
          <p>Hello ${tenant.name},</p>
          <p>Your rental agreement for <strong>"${house.title}"</strong> has been created by the broker.</p>
          <p><strong>Rental Details:</strong></p>
          <ul>
            <li>Property: ${house.title}</li>
            <li>Location: ${house.location}</li>
            <li>Monthly Rent: ETB ${rent.monthlyRent.toLocaleString()}</li>
            <li>Lease Start: ${leaseStart.toLocaleDateString()}</li>
            <li>Lease End: ${leaseEnd.toLocaleDateString()}</li>
            <li>Security Deposit: ETB ${rent.securityDeposit.toLocaleString()}</li>
            <li>Payment Method: ${rent.paymentMethod}</li>
          </ul>
          <p>Please contact the broker for payment instructions and lease agreement document.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email to tenant:', emailError);
  }

  return rent;
};

// ── Get rentals for a user ───────────────────────────────────────────────────
const getRentalsForUser = async (userId, role, page = 1, limit = 10) => {
  let query = {};
  if (role === 'admin') {
    // Admins see all
  } else if (role === 'renter') {
    query.tenantId = userId;
  } else if (role === 'owner') {
    query.landlordId = userId;
  } else if (role === 'broker') {
    query.brokerId = userId;
  } else {
    throw new AppError('Unauthorized', 403);
  }

  const skip = (page - 1) * limit;
  const rentals = await Rent.find(query)
    .populate('houseId', 'title location price images')
    .populate('tenantId', 'name email phone')
    .populate('landlordId', 'name email phone')
    .populate('brokerId', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Rent.countDocuments(query);

  return {
    rentals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// ── Get single rental by ID ─────────────────────────────────────────────────
const getRentalById = async (rentId, userId, role) => {
  const rent = await Rent.findById(rentId)
    .populate('houseId', 'title location price images')
    .populate('tenantId', 'name email phone')
    .populate('landlordId', 'name email phone')
    .populate('brokerId', 'name email phone');

  if (!rent) throw new AppError('Rental not found', 404);

  // Check authorization
  if (role !== 'admin') {
    const userIdStr = idOf(userId);
    const isTenant = idOf(rent.tenantId) === userIdStr;
    const isLandlord = idOf(rent.landlordId) === userIdStr;
    const isBroker = idOf(rent.brokerId) === userIdStr;

    if (!isTenant && !isLandlord && !isBroker) {
      throw new AppError('Not authorized to view this rental', 403);
    }
  }

  return rent;
};

// ── Update rental status (terminate/complete) ───────────────────────────────
const updateRentalStatus = async (rentId, userId, role, status, terminationReason = '') => {
  const rent = await Rent.findById(rentId);
  if (!rent) throw new AppError('Rental not found', 404);

  // Authorization check
  if (role !== 'admin') {
    const userIdStr = idOf(userId);
    const isLandlord = idOf(rent.landlordId) === userIdStr;
    const isBroker = idOf(rent.brokerId) === userIdStr;

    if (!isLandlord && !isBroker) {
      throw new AppError('Only landlord or broker can update rental status', 403);
    }
  }

  if (status === 'terminated') {
    rent.status = 'terminated';
    rent.terminationDate = new Date();
    rent.terminationReason = terminationReason;
    rent.terminatedBy = userId;
  } else if (status === 'completed') {
    rent.status = 'completed';
  } else {
    throw new AppError('Invalid status', 400);
  }

  await rent.save();

  // If terminated, make house available again
  if (status === 'terminated') {
    const house = await House.findById(rent.houseId);
    if (house) {
      house.status = 'approved';
      house.isActive = true;
      await house.save();
    }
  }

  // Audit log
  await AuditLog.create({
    userId,
    action: 'rental_status_updated',
    targetId: rent._id,
    targetType: 'rent',
    details: { previousStatus: rent.status, newStatus: status, terminationReason },
  });

  // Notify relevant parties
  const io = getIO();
  const parties = [rent.tenantId, rent.landlordId, rent.brokerId];

  for (const partyId of parties) {
    if (idOf(partyId) !== idOf(userId)) {
      const notification = await Notification.create({
        userId: partyId,
        type: 'rental_status_updated',
        message: `Rental agreement status updated to ${status}`,
        data: { rentId: rent._id, status },
      });
      io.to(`user_${partyId}`).emit('notification', notification);
    }
  }

  return rent;
};

// ── Add payment record to rental ────────────────────────────────────────────
const addPaymentRecord = async (rentId, userId, role, paymentData) => {
  const rent = await Rent.findById(rentId);
  if (!rent) throw new AppError('Rental not found', 404);

  // Only broker or admin can add payment records
  if (role !== 'admin' && role !== 'broker') {
    throw new AppError('Unauthorized', 403);
  }

  const payment = {
    amount: paymentData.amount,
    paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date(),
    dueDate: paymentData.dueDate ? new Date(paymentData.dueDate) : new Date(),
    status: paymentData.status || 'paid',
    transactionId: paymentData.transactionId || null,
    notes: paymentData.notes || '',
  };

  rent.paymentHistory.push(payment);
  await rent.save();

  // Audit log
  await AuditLog.create({
    userId,
    action: 'payment_record_added',
    targetId: rent._id,
    targetType: 'rent',
    details: { amount: payment.amount, status: payment.status },
  });

  return rent;
};

module.exports = {
  createRentalAgreement,
  getRentalsForUser,
  getRentalById,
  updateRentalStatus,
  addPaymentRecord,
};
