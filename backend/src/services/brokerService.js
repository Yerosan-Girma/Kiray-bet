const User = require('../models/User');
const House = require('../models/House');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../utils/AppError');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('./notificationService');
const { getIO } = require('../config/socket');
const { sendEmail } = require('./emailService');

// ── Apply to become a broker ──────────────────────────────────────────────────
const applyBroker = async (userId, applicationData, paymentMethod) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'broker' && user.brokerApplicationStatus === 'approved') {
    throw new AppError('You are already an approved broker', 400);
  }
  if (user.brokerApplicationStatus === 'pending') {
    throw new AppError('You already have a pending application', 400);
  }

  // Process mock registration payment (500 KSh flat fee)
  const REGISTRATION_FEE = 500;
  const reference = `BROKER-${uuidv4()}`;
  const receiptNumber = `RCP-${uuidv4().slice(0, 8).toUpperCase()}`;

  const transaction = await Transaction.create({
    userId,
    amount: REGISTRATION_FEE,
    paymentMethod,
    reference,
    receiptNumber,
    status: 'success', // mock — instantly succeeds
    type: 'broker_registration',
  });

  // Save application data to user
  user.brokerCompanyName = applicationData.companyName || '';
  user.brokerOfficeAddress = applicationData.officeAddress || '';
  user.brokerYearsExperience = applicationData.yearsExperience || 0;
  user.brokerDescription = applicationData.description || '';
  user.brokerNationalId = applicationData.nationalId || '';
  user.brokerApplicationStatus = 'pending';
  user.brokerRegistrationTxId = transaction._id;
  // If they submitted as non-broker role, keep existing role — admin will change to broker on approval
  await user.save({ validateBeforeSave: false });

  // Audit log
  await AuditLog.create({
    userId,
    action: 'broker_application_submitted',
    targetId: user._id,
    targetType: 'broker_application',
    details: { transactionId: transaction._id, paymentMethod },
  });

  // Notify all admins
  const admins = await User.find({ role: 'admin' });
  const io = getIO();
  for (const admin of admins) {
    const notif = await createNotification(
      admin._id,
      'broker_application_received',
      `New broker application from ${user.name}`,
      { applicantId: userId, transactionId: transaction._id }
    );
    io.to(`user_${admin._id}`).emit('notification', notif);

    // Send email to admin
    try {
      await sendEmail({
        to: admin.email,
        subject: 'New Broker Application Received',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C9922A;">New Broker Application</h2>
            <p>Hello ${admin.name},</p>
            <p>A new broker application has been submitted by <strong>${user.name}</strong>.</p>
            <p><strong>Application Details:</strong></p>
            <ul>
              <li>Name: ${user.name}</li>
              <li>Email: ${user.email}</li>
              <li>Phone: ${user.phone || 'Not provided'}</li>
              <li>Company: ${applicationData.companyName || 'Not provided'}</li>
              <li>Years of Experience: ${applicationData.yearsExperience || 0}</li>
            </ul>
            <p>Please review the application in your admin dashboard.</p>
            <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send email to admin:', emailError);
    }
  }

  return { transaction, user };
};

// ── Admin: approve broker application ────────────────────────────────────────
const approveBrokerApplication = async (adminId, applicantId) => {
  const user = await User.findById(applicantId);
  if (!user) throw new AppError('User not found', 404);
  if (user.brokerApplicationStatus !== 'pending') {
    throw new AppError('No pending application found', 400);
  }

  user.role = 'broker';
  user.isApproved = true;
  user.brokerApplicationStatus = 'approved';
  await user.save({ validateBeforeSave: false });

  await AuditLog.create({
    adminId,
    action: 'approve_broker',
    targetId: applicantId,
    targetType: 'broker_application',
    details: { previousRole: user.role, newRole: 'broker' },
  });

  const io = getIO();
  const notif = await createNotification(
    applicantId,
    'broker_approved',
    'Congratulations! Your broker application has been approved.',
    { adminId }
  );
  io.to(`user_${applicantId}`).emit('notification', notif);

  // Send email to broker
  try {
    await sendEmail({
      to: user.email,
      subject: 'Broker Application Approved - Congratulations!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">Congratulations! Your Broker Application Has Been Approved</h2>
          <p>Hello ${user.name},</p>
          <p>We are pleased to inform you that your broker application has been approved.</p>
          <p>You can now log in and access your <strong>Broker Dashboard</strong> to:</p>
          <ul>
            <li>Manage property listings</li>
            <li>Review owner submissions</li>
            <li>Publish properties</li>
            <li>Communicate with owners and renters</li>
          </ul>
          <p>Thank you for joining RentalWPA as a broker. We look forward to working with you!</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email to broker:', emailError);
  }

  return user;
};

// ── Admin: reject broker application ─────────────────────────────────────────
const rejectBrokerApplication = async (adminId, applicantId, reason) => {
  const user = await User.findById(applicantId);
  if (!user) throw new AppError('User not found', 404);

  user.brokerApplicationStatus = 'rejected';
  user.brokerApplicationNotes = reason || 'Application did not meet requirements';
  await user.save({ validateBeforeSave: false });

  await AuditLog.create({
    adminId,
    action: 'reject_broker',
    targetId: applicantId,
    targetType: 'broker_application',
    details: { reason },
  });

  const io = getIO();
  const notif = await createNotification(
    applicantId,
    'broker_rejected',
    `Your broker application was rejected. Reason: ${reason || 'Does not meet requirements'}`,
    { adminId, reason }
  );
  io.to(`user_${applicantId}`).emit('notification', notif);

  // Send email to broker
  try {
    await sendEmail({
      to: user.email,
      subject: 'Broker Application Status Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">Broker Application Status Update</h2>
          <p>Hello ${user.name},</p>
          <p>We regret to inform you that your broker application was not approved at this time.</p>
          <p><strong>Reason:</strong> ${reason || 'Application did not meet requirements'}</p>
          <p>You are welcome to submit another application after addressing the feedback provided.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email to broker:', emailError);
  }

  return user;
};

// ── Get broker applications (admin) ──────────────────────────────────────────
const getBrokerApplications = async (filters = {}, page = 1, limit = 10) => {
  const query = { brokerApplicationStatus: { $ne: 'none' } };
  if (filters.status) query.brokerApplicationStatus = filters.status;

  const skip = (page - 1) * limit;
  const applicants = await User.find(query)
    .select('-password -refreshToken')
    .populate('brokerRegistrationTxId')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await User.countDocuments(query);
  return { applicants, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

// ── Get approved brokers (public — owners need to pick one) ──────────────────
const getApprovedBrokers = async () => {
  const brokers = await User.find({
    role: 'broker',
    isApproved: true,
    status: 'active',
  })
    .select('name email phone profileImage brokerCompanyName brokerYearsExperience brokerDescription brokerOfficeAddress')
    .lean();
  return brokers;
};

// ── Owner submits property to a broker ───────────────────────────────────────
const ownerSubmitToBroker = async (ownerId, brokerIdParam, propertyData) => {
  const owner = await User.findById(ownerId);
  if (!owner) throw new AppError('Owner not found', 404);

  const broker = await User.findOne({ _id: brokerIdParam, role: 'broker', isApproved: true });
  if (!broker) throw new AppError('Broker not found or not approved', 404);

  const house = await House.create({
    ...propertyData,
    listedBy: brokerIdParam, // broker will be the publisher
    ownerId,
    assignedBroker: brokerIdParam,
    status: 'pending',
    brokerSubmissionStatus: 'pending_broker',
  });

  // Audit log
  await AuditLog.create({
    userId: ownerId,
    action: 'property_submitted',
    targetId: house._id,
    targetType: 'house',
    details: { brokerId: brokerIdParam, assignedBroker: brokerIdParam },
  });

  const io = getIO();
  const notif = await createNotification(
    brokerIdParam,
    'new_owner_submission',
    `${owner.name} submitted a property for you to list: "${house.title}"`,
    { houseId: house._id, ownerId }
  );
  io.to(`user_${brokerIdParam}`).emit('notification', notif);

  // Send email to broker
  try {
    await sendEmail({
      to: broker.email,
      subject: 'New Property Submission from Owner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">New Property Submission</h2>
          <p>Hello ${broker.name},</p>
          <p>A property owner has submitted a new property for you to list.</p>
          <p><strong>Property Details:</strong></p>
          <ul>
            <li>Owner: ${owner.name}</li>
            <li>Owner Email: ${owner.email}</li>
            <li>Property Title: ${house.title}</li>
            <li>Location: ${house.location}</li>
            <li>Price: KSh ${house.price.toLocaleString()}</li>
          </ul>
          <p>Please review the submission in your broker dashboard.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email to broker:', emailError);
  }

  return house;
};

// ── Broker accepts or rejects owner submission ────────────────────────────────
const brokerRespondToSubmission = async (brokerId, houseId, action, notes = '') => {
  const house = await House.findOne({ _id: houseId, assignedBroker: brokerId });
  if (!house) throw new AppError('Submission not found', 404);

  if (action === 'accept') {
    house.brokerSubmissionStatus = 'accepted';
    house.status = 'pending'; // still needs admin approval
    await house.save();

    const notif = await createNotification(
      house.ownerId,
      'owner_submission_accepted',
      `Your property "${house.title}" was accepted by the broker and is now under review.`,
      { houseId: house._id }
    );
    const io = getIO();
    io.to(`user_${house.ownerId}`).emit('notification', notif);

    // Send email to owner
    const owner = await User.findById(house.ownerId);
    try {
      await sendEmail({
        to: owner.email,
        subject: 'Property Accepted by Broker',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C9922A;">Property Accepted</h2>
            <p>Hello ${owner.name},</p>
            <p>Your property <strong>"${house.title}"</strong> has been accepted by your broker and is now ready to be published.</p>
            <p>The broker will review and publish your property shortly. You will receive another notification when it goes live.</p>
            <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send email to owner:', emailError);
    }
  } else {
    house.brokerSubmissionStatus = 'rejected';
    house.status = 'rejected';
    await house.save();

    const notif = await createNotification(
      house.ownerId,
      'owner_submission_rejected',
      `Your property "${house.title}" was rejected by the broker. ${notes ? 'Reason: ' + notes : ''}`,
      { houseId: house._id, notes }
    );
    const io = getIO();
    io.to(`user_${house.ownerId}`).emit('notification', notif);

    // Send email to owner
    const owner = await User.findById(house.ownerId);
    try {
      await sendEmail({
        to: owner.email,
        subject: 'Property Submission Status Update',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C9922A;">Property Submission Status Update</h2>
            <p>Hello ${owner.name},</p>
            <p>Your property <strong>"${house.title}"</strong> was rejected by the broker.</p>
            <p><strong>Reason:</strong> ${notes || 'Property does not meet requirements'}</p>
            <p>You may edit and resubmit the property after addressing the feedback provided.</p>
            <p style="color: #666; font-size: 12px;">This is an automated email from RentalWPA.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send email to owner:', emailError);
    }
  }

  return house;
};

// ── Broker: get assigned submissions ─────────────────────────────────────────
const getBrokerSubmissions = async (brokerId, status) => {
  const query = { assignedBroker: brokerId };
  if (status) query.brokerSubmissionStatus = status;

  const houses = await House.find(query)
    .populate('ownerId', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();
  return houses;
};

module.exports = {
  applyBroker,
  approveBrokerApplication,
  rejectBrokerApplication,
  getBrokerApplications,
  getApprovedBrokers,
  ownerSubmitToBroker,
  brokerRespondToSubmission,
  getBrokerSubmissions,
};
