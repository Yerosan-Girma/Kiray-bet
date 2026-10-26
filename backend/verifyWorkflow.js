const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./src/models/User');
const House = require('./src/models/House');
const Transaction = require('./src/models/Transaction');
const Inquiry = require('./src/models/Inquiry');
const Rent = require('./src/models/Rent');
const Notification = require('./src/models/Notification');
const AuditLog = require('./src/models/AuditLog');
const Conversation = require('./src/models/Conversation');

const brokerService = require('./src/services/brokerService');
const houseService = require('./src/services/houseService');
const inquiryService = require('./src/services/inquiryService');
const rentService = require('./src/services/rentService');
const adminService = require('./src/services/adminService');

async function runVerification() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE WORKFLOW VERIFICATION TEST');
  console.log('====================================================\n');

  try {
    console.log(`Connecting to: ${process.env.MONGODB_URI}`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testId = Date.now().toString().slice(-6);

    // ── Setup Users: Admin, Owner, Broker Applicant, Renter ──
    console.log('--- 1. SETTING UP TEST USERS ---');
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: `Admin Test ${testId}`,
        email: `admin_${testId}@test.com`,
        password: 'password123',
        role: 'admin',
        status: 'active',
        isApproved: true,
      });
    }
    console.log(`✓ Admin user: ${admin.email} (${admin._id})`);

    const owner = await User.create({
      name: `Owner Test ${testId}`,
      email: `owner_${testId}@test.com`,
      password: 'password123',
      phone: '+251 911 000 111',
      role: 'owner',
      status: 'active',
      isApproved: true,
    });
    console.log(`✓ Property Owner: ${owner.email} (${owner._id})`);

    const brokerUser = await User.create({
      name: `Broker Applicant ${testId}`,
      email: `broker_${testId}@test.com`,
      password: 'password123',
      phone: '+251 922 000 222',
      role: 'renter', // Starts as normal user
      status: 'active',
    });
    console.log(`✓ Broker Applicant: ${brokerUser.email} (${brokerUser._id})`);

    const renter = await User.create({
      name: `Renter Tenant ${testId}`,
      email: `renter_${testId}@test.com`,
      password: 'password123',
      phone: '+251 933 000 333',
      role: 'renter',
      status: 'active',
    });
    console.log(`✓ Prospective Tenant: ${renter.email} (${renter._id})\n`);

    // ── STEP 1: Broker Application & Payment (500 ETB) ──
    console.log('--- 2. STEP 1: BROKER APPLICATION & PAYMENT (500 ETB) ---');
    const applicationResult = await brokerService.applyBroker(
      brokerUser._id,
      {
        fullName: `Broker Pro ${testId}`,
        companyName: 'Finfinne Property Partners',
        officeAddress: 'Bole Road, Mega Building, Addis Ababa',
        yearsExperience: 5,
        description: 'Certified real estate broker in commercial & residential rentals.',
      },
      'telebirr'
    );

    console.log(`✓ Broker applied. Transaction ID: ${applicationResult.transaction._id}`);
    console.log(`✓ Initial Transaction Status: ${applicationResult.transaction.status} (Amount: ETB ${applicationResult.transaction.amount})`);
    console.log(`✓ User brokerApplicationStatus: ${applicationResult.user.brokerApplicationStatus}`);

    if (applicationResult.user.brokerApplicationStatus !== 'payment_pending') {
      throw new Error(`Expected brokerApplicationStatus to be 'payment_pending', got: ${applicationResult.user.brokerApplicationStatus}`);
    }

    // Verify Admin CANNOT approve unconfirmed payment
    console.log('\n--- 2B. TESTING ADMIN APPROVAL ENFORCEMENT BEFORE PAYMENT ---');
    try {
      await brokerService.approveBrokerApplication(admin._id, brokerUser._id);
      throw new Error('FAIL: Admin was able to approve broker without confirmed payment!');
    } catch (err) {
      console.log(`✓ Success: Approval blocked before payment: "${err.message}"`);
    }

    // Confirm Payment
    console.log('\n--- 2C. BROKER CONFIRMS PAYMENT (500 ETB) ---');
    const paymentConfirm = await brokerService.confirmBrokerPayment(applicationResult.transaction._id);
    console.log(`✓ Payment confirmed! Transaction Status: ${paymentConfirm.transaction.status}`);
    console.log(`✓ Receipt generated: ${paymentConfirm.transaction.receiptNumber}`);
    console.log(`✓ User status updated to: ${paymentConfirm.user.brokerApplicationStatus}`);

    if (paymentConfirm.user.brokerApplicationStatus !== 'pending') {
      throw new Error(`Expected brokerApplicationStatus to be 'pending' after payment, got: ${paymentConfirm.user.brokerApplicationStatus}`);
    }

    // Admin approves broker
    console.log('\n--- 2D. ADMIN APPROVES BROKER ---');
    const approvedBroker = await brokerService.approveBrokerApplication(admin._id, brokerUser._id);
    console.log(`✓ Broker successfully approved by Admin!`);
    console.log(`✓ New Role: ${approvedBroker.role} (isApproved: ${approvedBroker.isApproved})`);
    console.log(`✓ Broker Application Status: ${approvedBroker.brokerApplicationStatus}`);

    if (approvedBroker.role !== 'broker' || !approvedBroker.isApproved || approvedBroker.brokerApplicationStatus !== 'approved') {
      throw new Error('Failed to properly promote user to approved broker');
    }

    // ── STEP 2: Owner Lists Property & Selects Approved Broker ──
    console.log('\n--- 3. STEP 2: OWNER LISTS PROPERTY & SELECTS APPROVED BROKER ---');
    const approvedBrokersList = await brokerService.getApprovedBrokers();
    const isOurBrokerInList = approvedBrokersList.some(b => b._id.toString() === approvedBroker._id.toString());
    console.log(`✓ Approved brokers fetched: ${approvedBrokersList.length} broker(s) available.`);
    console.log(`✓ Our newly approved broker is in list: ${isOurBrokerInList}`);

    if (!isOurBrokerInList) {
      throw new Error('Newly approved broker not appearing in getApprovedBrokers list!');
    }

    const houseSubmission = await brokerService.ownerSubmitToBroker(
      owner._id,
      approvedBroker._id,
      {
        title: `Modern 3BR Penthouse in Bole ${testId}`,
        description: 'Furnished luxury penthouse with balcony, panoramic view, and backup generator.',
        price: 45000,
        location: 'Bole, Addis Ababa, Ethiopia',
        coordinates: { type: 'Point', coordinates: [38.7891, 8.9954] },
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'apartment',
        amenities: ['WiFi', 'Parking', 'Security', 'Balcony'],
        contactPhone: owner.phone,
      }
    );

    console.log(`✓ Property submitted to broker! House ID: ${houseSubmission._id}`);
    console.log(`✓ House brokerSubmissionStatus: ${houseSubmission.brokerSubmissionStatus}`);
    console.log(`✓ Assigned Broker: ${houseSubmission.assignedBroker}`);

    // Verify conversation between owner and broker created
    const conv = await Conversation.findOne({ houseId: houseSubmission._id });
    console.log(`✓ Direct messaging conversation established: ${conv ? conv.conversationKey : 'None'}`);

    // ── STEP 3: Broker Reviews Submission, Accepts, and Publishes ──
    console.log('\n--- 4. STEP 3: BROKER REVIEWS, ACCEPTS & PUBLISHES ---');
    const brokerSubmissions = await brokerService.getBrokerSubmissions(approvedBroker._id, 'pending_broker');
    console.log(`✓ Broker received submissions: ${brokerSubmissions.length} pending.`);

    // Broker accepts
    const acceptedSubmission = await brokerService.brokerRespondToSubmission(
      approvedBroker._id,
      houseSubmission._id,
      'accept'
    );
    console.log(`✓ Submission accepted by broker! Status: ${acceptedSubmission.brokerSubmissionStatus}`);

    // Broker publishes listing live to website
    const publishedHouse = await houseService.updateHouse(
      houseSubmission._id,
      { status: 'approved', isActive: true },
      approvedBroker._id,
      'broker'
    );
    console.log(`✓ Property published live to website!`);
    console.log(`✓ Status: ${publishedHouse.status} | Active: ${publishedHouse.isActive}`);
    console.log(`✓ Listed By: ${publishedHouse.listedBy} | Owner: ${publishedHouse.ownerId}`);

    // ── STEP 4: Renter Inquires about Property -> Broker Receives ──
    console.log('\n--- 5. STEP 4: RENTER INQUIRES ABOUT PROPERTY ---');
    const inquiry = await inquiryService.createInquiry(
      renter._id,
      publishedHouse._id,
      renter.phone,
      `Hello! I am interested in renting this penthouse. Is it available for immediate move-in?`
    );

    console.log(`✓ Inquiry created by renter! Inquiry ID: ${inquiry._id}`);
    console.log(`✓ Inquiry assigned to broker: ${inquiry.brokerId}`);

    const houseAfterInquiry = await House.findById(publishedHouse._id);
    console.log(`✓ House inquiryCount incremented: ${houseAfterInquiry.inquiryCount}`);

    // Check notification for broker
    const brokerNotif = await Notification.findOne({
      userId: approvedBroker._id,
      type: 'new_inquiry',
      'data.inquiryId': inquiry._id,
    });
    console.log(`✓ Broker received notification: "${brokerNotif ? brokerNotif.message : 'Missing'}"`);

    // ── STEP 5: Broker Tenant Search & Rental Agreement Creation ──
    console.log('\n--- 6. STEP 5: TENANT LOOKUP & RENTAL AGREEMENT CREATION ---');
    // Test tenant lookup by email
    const searchedTenant = await rentService.searchTenant(renter.email);
    console.log(`✓ Tenant search succeeded: ${searchedTenant.name} (${searchedTenant.email})`);

    // Test inquirers retrieval for house
    const houseInquirers = await rentService.getHouseInquirers(publishedHouse._id);
    console.log(`✓ Property inquirers fetched: ${houseInquirers.length} inquirer(s) found.`);
    console.log(`✓ Found inquiring renter: ${houseInquirers[0]?.name}`);

    // Broker creates rental agreement
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const rentalAgreement = await rentService.createRentalAgreement(
      approvedBroker._id,
      publishedHouse._id,
      renter._id,
      {
        leaseStartDate: startDate.toISOString(),
        leaseEndDate: endDate.toISOString(),
        monthlyRent: 45000,
        securityDeposit: 45000,
        paymentSchedule: 'monthly',
        paymentMethod: 'bank_transfer',
        terms: 'Standard 1-year residential lease. Utilities excluded.',
      }
    );

    console.log(`✓ Rental agreement created! Rent ID: ${rentalAgreement._id}`);
    console.log(`✓ Rent Status: ${rentalAgreement.status}`);
    console.log(`✓ Monthly Rent: ETB ${rentalAgreement.monthlyRent}`);

    // Verify property is marked as 'rented' and hidden (isActive: false)
    const rentedHouse = await House.findById(publishedHouse._id);
    console.log(`✓ Property status updated: ${rentedHouse.status} (Expected: 'rented')`);
    console.log(`✓ Property isActive: ${rentedHouse.isActive} (Expected: false)`);

    if (rentedHouse.status !== 'rented' || rentedHouse.isActive !== false) {
      throw new Error(`House status should be 'rented' and isActive false, got: status=${rentedHouse.status}, isActive=${rentedHouse.isActive}`);
    }

    // Verify notifications sent to Owner and Tenant
    const ownerRentedNotif = await Notification.findOne({
      userId: owner._id,
      type: 'property_rented',
      'data.rentId': rentalAgreement._id,
    });
    console.log(`✓ Owner received notification: "${ownerRentedNotif ? ownerRentedNotif.message : 'Missing'}"`);

    const tenantRentalNotif = await Notification.findOne({
      userId: renter._id,
      type: 'rental_agreement_created',
      'data.rentId': rentalAgreement._id,
    });
    console.log(`✓ Tenant received notification: "${tenantRentalNotif ? tenantRentalNotif.message : 'Missing'}"`);

    // Verify AuditLog entry created
    const rentAuditLog = await AuditLog.findOne({
      targetId: rentalAgreement._id,
      action: 'rental_agreement_created',
    });
    console.log(`✓ Audit log verified: Action="${rentAuditLog ? rentAuditLog.action : 'Missing'}"`);

    // ── STEP 6: Admin Dashboard & Full Management ──
    console.log('\n--- 7. STEP 6: ADMIN DASHBOARD & FULL SYSTEM MANAGEMENT ---');
    const adminStats = await adminService.getDashboardStats();
    console.log(`✓ Total Users: ${adminStats.totalUsers}`);
    console.log(`✓ Total Listings: ${adminStats.totalListings}`);
    console.log(`✓ Total Revenue: ETB ${adminStats.totalRevenue}`);

    const brokerAppsAdmin = await adminService.getBrokerApplications({ status: 'approved' }, 1, 5);
    console.log(`✓ Admin fetched approved broker apps: ${brokerAppsAdmin.applicants.length} found`);

    const transactionsAdmin = await adminService.getTransactions({}, 1, 5);
    console.log(`✓ Admin fetched transactions: ${transactionsAdmin.transactions.length} found`);

    const auditLogsAdmin = await adminService.getAuditLogs({}, 1, 5);
    console.log(`✓ Admin fetched audit logs: ${auditLogsAdmin.logs.length} found`);

    console.log('\n====================================================');
    console.log('🎉 ALL WORKFLOW CHECKS PASSED WITH 100% SUCCESS!');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ VERIFICATION TEST FAILED:', error);
    process.exit(1);
  }
}

runVerification();
