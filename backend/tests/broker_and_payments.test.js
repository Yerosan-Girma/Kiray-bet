const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');
const { generateAccessToken } = require('../src/services/authService');

describe('Broker Application & Payment Gateway API Endpoints', () => {
  let admin, applicant, stranger;
  let adminToken, applicantToken, strangerToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    admin = await User.create({
      name: 'Admin Boss',
      email: 'admin.boss@example.com',
      password: 'password123',
      role: 'admin',
      status: 'active',
      isApproved: true,
    });
    adminToken = generateAccessToken(admin);

    applicant = await User.create({
      name: 'Broker Candidate',
      email: 'candidate@example.com',
      password: 'password123',
      phone: '+251911556677',
      role: 'renter',
      status: 'active',
    });
    applicantToken = generateAccessToken(applicant);

    stranger = await User.create({
      name: 'Stranger User',
      email: 'stranger@example.com',
      password: 'password123',
      role: 'renter',
      status: 'active',
    });
    strangerToken = generateAccessToken(stranger);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('Broker Application & Fee Workflow', () => {
    it('Allows user to submit broker application and creates pending 500 ETB transaction', async () => {
      const res = await request(app)
        .post('/api/broker/apply')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          fullName: 'Certified BrokerCandidate',
          companyName: 'Bole Commercial Properties',
          officeAddress: 'Bole Medhanealem, Addis Ababa',
          yearsExperience: 4,
          description: 'Specialist in luxury residential rentals',
          paymentMethod: 'telebirr',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.brokerApplicationStatus).toBe('payment_pending');
      expect(res.body.data.transaction.amount).toBe(500);
      expect(res.body.data.transaction.type).toBe('broker_registration');
      expect(res.body.data.transaction.status).toBe('pending');
    });

    it('Confirms broker registration payment and updates user status to pending admin review', async () => {
      // 1. Submit application
      const applyRes = await request(app)
        .post('/api/broker/apply')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          fullName: 'Applicant With Payment',
          paymentMethod: 'telebirr',
        });

      const txId = applyRes.body.data.transaction._id;

      // 2. Confirm payment
      const confirmRes = await request(app)
        .post('/api/broker/confirm-payment')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ transactionId: txId });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.success).toBe(true);
      expect(confirmRes.body.data.transaction.status).toBe('success');
      expect(confirmRes.body.data.user.brokerApplicationStatus).toBe('pending');
    });

    it('Admin approves broker after payment is confirmed and grants broker role', async () => {
      // 1. Submit & confirm payment
      const applyRes = await request(app)
        .post('/api/broker/apply')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ fullName: 'Ready Broker', paymentMethod: 'telebirr' });

      const txId = applyRes.body.data.transaction._id;

      await request(app)
        .post('/api/broker/confirm-payment')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ transactionId: txId });

      // 2. Admin approves
      const approveRes = await request(app)
        .put(`/api/broker/applications/${applicant._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);
      expect(approveRes.body.data.role).toBe('broker');
      expect(approveRes.body.data.isApproved).toBe(true);
      expect(approveRes.body.data.brokerApplicationStatus).toBe('approved');
    });

    it('Admin cannot approve broker if payment was not confirmed (enforces 500 ETB fee)', async () => {
      // Apply without confirming payment
      await request(app)
        .post('/api/broker/apply')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ fullName: 'Unpaid Broker', paymentMethod: 'telebirr' });

      // Admin tries to approve
      const approveRes = await request(app)
        .put(`/api/broker/applications/${applicant._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveRes.status).toBe(400);
      expect(approveRes.body.message).toMatch(/fee has not been confirmed|No pending application/i);
    });
  });

  describe('Payments & Premium Upgrades', () => {
    it('Creates payment and upgrades user to premium for 30 days', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          amount: 299,
          paymentMethod: 'telebirr',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
      expect(res.body.data.receiptNumber).toBeDefined();

      // Verify user in DB has isPremium: true and future expiry
      const updatedUser = await User.findById(applicant._id);
      expect(updatedUser.isPremium).toBe(true);
      expect(new Date(updatedUser.premiumExpiry).getTime()).toBeGreaterThan(Date.now());
    });

    it('Gets user payment history with pagination', async () => {
      await Transaction.create({
        userId: applicant._id,
        amount: 299,
        paymentMethod: 'telebirr',
        reference: 'PAY-HIST-1',
        status: 'success',
        receiptNumber: 'RCP-001',
      });

      const res = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.total).toBe(1);
    });

    it('Prevents a stranger from viewing another user payment status (IDOR protection)', async () => {
      const tx = await Transaction.create({
        userId: applicant._id,
        amount: 299,
        paymentMethod: 'telebirr',
        reference: 'PAY-PRIVATE-1',
        status: 'success',
        receiptNumber: 'RCP-002',
      });

      const res = await request(app)
        .get(`/api/payments/status/${tx._id}`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(res.status).toBe(404);
    });
  });
});
