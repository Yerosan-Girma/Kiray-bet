const User = require('../models/User');
const House = require('../models/House');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../utils/AppError');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const { createNotification } = require('./notificationService');
const { getIO } = require('../config/socket');
const { sendEmail } = require('./emailService');
const { ensureConversation } = require('./messageService');

// ── Apply to become a broker ──────────────────────────────────────────────────
const applyBroker = async (userId, applicationData, paymentMethod) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  if (!['telebirr', 'bank_transfer'].includes(paymentMethod)) {
    throw new AppError('Unsupported broker registration payment method', 400);
  }
  if (user.role === 'broker' && user.brokerApplicationStatus === 'approved') {
    throw new AppError('You are already an approved broker', 400);
  }
  if (user.brokerApplicationStatus === 'pending') {
    throw new AppError('You already have an application under review', 400);
  }

  // Create or reuse pending transaction (payment not yet confirmed)
  const REGISTRATION_FEE = 500;
  let transaction;

  if (user.brokerApplicationStatus === 'payment_pending' && user.brokerRegistrationTxId) {
    transaction = await Transaction.findOne({
      _id: user.brokerRegistrationTxId,
      userId,
      type: 'broker_registration',
      status: 'pending',
    });
  }

  if (!transaction) {
    const reference = `BROKER-${uuidv4()}`;
    transaction = await Transaction.create({
      userId,
      amount: REGISTRATION_FEE,
      paymentMethod,
      reference,
      status: 'pending', // Payment must be confirmed first
      type: 'broker_registration',
    });
  } else {
    transaction.paymentMethod = paymentMethod;
    await transaction.save();
  }

  // Save application data to user, status is 'payment_pending'
  if (applicationData.fullName) user.name = applicationData.fullName;
  if (applicationData.phone) user.phone = applicationData.phone;
  user.brokerCompanyName = applicationData.companyName || '';
  user.brokerOfficeAddress = applicationData.officeAddress || '';
  user.brokerYearsExperience = applicationData.yearsExperience || 0;
  user.brokerDescription = applicationData.description || '';
  user.brokerNationalId = applicationData.nationalId || '';
  user.brokerDocuments = Array.isArray(applicationData.supportingDocuments)
    ? applicationData.supportingDocuments
    : [];
  user.brokerApplicationStatus = 'payment_pending';
  user.brokerApplicationNotes = '';
  user.brokerRegistrationTxId = transaction._id;
  await user.save({ validateBeforeSave: false });

  // Audit log
  await AuditLog.create({
    userId,
    action: 'broker_payment_initiated',
    targetId: user._id,
    targetType: 'broker_application',
    details: { transactionId: transaction._id, paymentMethod, amount: REGISTRATION_FEE },
  });

  return { transaction, user };
};

// ── Confirm broker payment (called after payment succeeds) ───────────────────
const confirmBrokerPayment = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new AppError('Transaction not found', 404);
  if (transaction.type !== 'broker_registration') throw new AppError('Invalid transaction type', 400);
  if (transaction.status === 'success') throw new AppError('Payment already confirmed', 400);

  const user = await User.findById(transaction.userId);
  if (!user) throw new AppError('User not found', 404);

  // Update transaction status
  transaction.status = 'success';
  transaction.receiptNumber = `RCP-${uuidv4().slice(0, 8).toUpperCase()}`;
  await transaction.save();

  // Change user status to 'pending' (now ready for admin review)
  user.brokerApplicationStatus = 'pending';
  user.brokerRegistrationTxId = transaction._id;
  await user.save({ validateBeforeSave: false });

  // Audit log
  await AuditLog.create({
    userId: user._id,
    action: 'broker_payment_confirmed',
    targetId: user._id,
    targetType: 'broker_application',
    details: { transactionId: transaction._id, receiptNumber: transaction.receiptNumber },
  });

  // Notify all admins that application is ready for review
  const admins = await User.find({ role: 'admin' });
  const io = getIO();
  for (const admin of admins) {
    const notif = await createNotification(
      admin._id,
      'broker_application_received',
      `New broker application from ${user.name} (Payment Confirmed: 500 ETB)`,
      { applicantId: user._id, transactionId: transaction._id }
    );
    if (io) {
      io.to(`user_${admin._id}`).emit('notification', notif);
    }

    // Send email to admin
    try {
      await sendEmail({
        to: admin.email,
        subject: 'New Broker Application Received (Payment Verified)',
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
              <li>Company: ${user.brokerCompanyName || 'Not provided'}</li>
              <li>Office: ${user.brokerOfficeAddress || 'Not provided'}</li>
              <li>Years of Experience: ${user.brokerYearsExperience || 0}</li>
              <li>Fee: ETB 500 (Payment Confirmed: ${transaction.receiptNumber})</li>
            </ul>
            <p>The registration fee has been paid and verified. Please review the application in your admin dashboard.</p>
            <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send email to admin:', emailError);
    }
  }

  // Notify applicant that payment is confirmed and application is under review
  const userNotif = await createNotification(
    user._id,
    'payment_confirmed',
    'Payment of 500 ETB confirmed! Your broker application is now under admin review.',
    { transactionId: transaction._id, receiptNumber: transaction.receiptNumber }
  );
  if (io) {
    io.to(`user_${user._id}`).emit('notification', userNotif);
  }

  try {
    await sendEmail({
      to: user.email,
      subject: 'Payment Confirmed - Application Under Review',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">Payment Confirmed</h2>
          <p>Hello ${user.name},</p>
          <p>Your broker registration fee of <strong>500 ETB</strong> has been confirmed successfully (Receipt: ${transaction.receiptNumber}).</p>
          <p>Your application is now under admin review. You will receive a notification once it is approved or rejected.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send email to user:', emailError);
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

  // Verify that the 500 ETB registration fee was paid and confirmed
  const paidTx = await Transaction.findOne({
    userId: applicantId,
    type: 'broker_registration',
    status: 'success',
  });
  if (!paidTx) {
    throw new AppError('Cannot approve broker: Payment of 500 ETB registration fee has not been confirmed.', 400);
  }

  const previousRole = user.role;
  user.role = 'broker';
  user.isApproved = true;
  user.brokerApplicationStatus = 'approved';
  await user.save({ validateBeforeSave: false });

  await AuditLog.create({
    adminId,
    action: 'approve_broker',
    targetId: applicantId,
    targetType: 'broker_application',
    details: { previousRole, newRole: 'broker', transactionId: paidTx._id },
  });

  const io = getIO();
  const notif = await createNotification(
    applicantId,
    'broker_approved',
    'Congratulations! Your broker application has been approved. You now have full broker privileges.',
    { adminId }
  );
  if (io) {
    io.to(`user_${applicantId}`).emit('notification', notif);
  }

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
            <li>Receive renter inquiries</li>
            <li>Create rental agreements</li>
          </ul>
          <p>Thank you for joining Kiray Bet as an approved broker.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
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
  if (io) {
    io.to(`user_${applicantId}`).emit('notification', notif);
  }

  // Send email to applicant
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
          <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
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
    brokerApplicationStatus: 'approved',
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

  const broker = await User.findOne({
    _id: brokerIdParam,
    role: 'broker',
    isApproved: true,
    brokerApplicationStatus: 'approved',
    status: 'active',
  });
  if (!broker) throw new AppError('Selected broker is not approved or not active', 404);
  if (owner.status !== 'active') throw new AppError('Your account is not active', 403);

  if (owner.role === 'renter') {
    owner.role = 'owner';
    await owner.save({ validateBeforeSave: false });
  }

  const house = await House.create({
    ...propertyData,
    listedBy: brokerIdParam,
    ownerId,
    brokerId: brokerIdParam,
    uploadedBy: brokerIdParam,
    assignedBroker: brokerIdParam,
    status: 'pending',
    brokerSubmissionStatus: 'pending_broker',
  });

  await ensureConversation({
    senderId: ownerId,
    receiverId: brokerIdParam,
    houseId: house._id,
    createdBy: ownerId,
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
  if (io) {
    io.to(`user_${brokerIdParam}`).emit('notification', notif);
  }

  // Send email to broker
  try {
    await sendEmail({
      to: broker.email,
      subject: 'New Property Submission from Owner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C9922A;">New Property Submission</h2>
          <p>Hello ${broker.name},</p>
          <p>A property owner has submitted a new property for you to review and list.</p>
          <p><strong>Property Details:</strong></p>
          <ul>
              <li>Owner: ${owner.name}</li>
              <li>Owner Email: ${owner.email}</li>
              <li>Property Title: ${house.title}</li>
              <li>Location: ${house.location}</li>
              <li>Price: ETB ${house.price.toLocaleString()}</li>
          </ul>
          <p>Please review the submission in your broker dashboard.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
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

  const io = getIO();

  if (action === 'accept') {
    house.brokerSubmissionStatus = 'accepted';
    house.brokerId = brokerId;
    house.assignedBroker = brokerId;
    house.listedBy = brokerId;
    house.uploadedBy = brokerId;
    house.status = 'pending'; // ready for broker to publish
    await house.save();

    const notif = await createNotification(
      house.ownerId,
      'owner_submission_accepted',
      `Your property "${house.title}" was accepted by the broker and is ready to be published.`,
      { houseId: house._id }
    );
    if (io) {
      io.to(`user_${house.ownerId}`).emit('notification', notif);
    }

    // Send email to owner
    const owner = await User.findById(house.ownerId);
    if (owner) {
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
              <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email to owner:', emailError);
      }
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
    if (io) {
      io.to(`user_${house.ownerId}`).emit('notification', notif);
    }

    // Send email to owner
    const owner = await User.findById(house.ownerId);
    if (owner) {
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
              <p style="color: #666; font-size: 12px;">This is an automated email from Kiray Bet.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email to owner:', emailError);
      }
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
  confirmBrokerPayment,
  approveBrokerApplication,
  rejectBrokerApplication,
  getBrokerApplications,
  getApprovedBrokers,
  ownerSubmitToBroker,
  brokerRespondToSubmission,
  getBrokerSubmissions,
};
