const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const User = require('../src/models/User');
const House = require('../src/models/House');
const Inquiry = require('../src/models/Inquiry');
const Rent = require('../src/models/Rent');
const { generateAccessToken } = require('../src/services/authService');

describe('Rentals, Inquiries & Owner Submissions Workflow', () => {
  let broker, ownerUser, renterUser, otherUser;
  let brokerToken, ownerToken, renterToken, otherToken;
  let publishedHouse;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    broker = await User.create({
      name: 'Broker Dawit',
      email: 'dawit@broker.com',
      password: 'password123',
      role: 'broker',
      status: 'active',
      isApproved: true,
      brokerApplicationStatus: 'approved',
    });
    brokerToken = generateAccessToken(broker);

    ownerUser = await User.create({
      name: 'Owner Almaz',
      email: 'almaz@owner.com',
      password: 'password123',
      role: 'owner',
      status: 'active',
    });
    ownerToken = generateAccessToken(ownerUser);

    renterUser = await User.create({
      name: 'Renter Yohannes',
      email: 'yohannes@renter.com',
      password: 'password123',
      role: 'renter',
      status: 'active',
    });
    renterToken = generateAccessToken(renterUser);

    otherUser = await User.create({
      name: 'Stranger User',
      email: 'stranger@test.com',
      password: 'password123',
      role: 'renter',
      status: 'active',
    });
    otherToken = generateAccessToken(otherUser);

    publishedHouse = await House.create({
      title: 'Published Townhouse in Sarbet',
      description: 'Charming townhouse ready for lease',
      price: 35000,
      location: 'Sarbet, Addis Ababa',
      bedrooms: 3,
      bathrooms: 2,
      propertyType: 'townhouse',
      listedBy: broker._id,
      brokerId: broker._id,
      ownerId: ownerUser._id,
      status: 'approved',
      isActive: true,
      coordinates: { type: 'Point', coordinates: [38.740, 8.990] },
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('Owner Property Submission to Broker', () => {
    it('Allows an owner to submit a property to an approved broker', async () => {
      const res = await request(app)
        .post('/api/broker/submit-property')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          brokerId: broker._id,
          title: 'Kazanchis Luxury Condo',
          description: 'High rise condo with city view',
          price: 28000,
          location: 'Kazanchis, Addis Ababa',
          bedrooms: 2,
          bathrooms: 2,
          propertyType: 'condo',
          contactPhone: '+251911009988',
          coordinates: { type: 'Point', coordinates: [38.765, 9.015] },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.brokerSubmissionStatus).toBe('pending_broker');
      expect(res.body.data.assignedBroker.toString()).toBe(broker._id.toString());
      expect(res.body.data.ownerId.toString()).toBe(ownerUser._id.toString());
    });

    it('Broker can accept an owner submission', async () => {
      const submission = await House.create({
        title: 'Pending Review House',
        description: 'Under review by broker',
        price: 22000,
        location: 'Gotera',
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'apartment',
        listedBy: broker._id,
        assignedBroker: broker._id,
        ownerId: ownerUser._id,
        status: 'pending',
        brokerSubmissionStatus: 'pending_broker',
        coordinates: { type: 'Point', coordinates: [38.750, 8.980] },
      });

      const res = await request(app)
        .put(`/api/broker/submissions/${submission._id}/respond`)
        .set('Authorization', `Bearer ${brokerToken}`)
        .send({ action: 'accept' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await House.findById(submission._id);
      expect(updated.brokerSubmissionStatus).toBe('accepted');
    });
  });

  describe('Renter Inquiries Workflow', () => {
    it('Allows authenticated renter to submit an inquiry on a published house', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          houseId: publishedHouse._id,
          contactPhone: '+251922334455',
          message: 'Hello, I would like to schedule a viewing this Saturday.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId.toString()).toBe(renterUser._id.toString());
      expect(res.body.data.brokerId.toString()).toBe(broker._id.toString());
      expect(res.body.data.replies.length).toBe(1);

      // Verify house inquiryCount incremented
      const updatedHouse = await House.findById(publishedHouse._id);
      expect(updatedHouse.inquiryCount).toBe(1);
    });

    it('Rejects inquiry on unpublished house (400 Bad Request)', async () => {
      const unpublishedHouse = await House.create({
        title: 'Draft House',
        description: 'Not yet approved',
        price: 18000,
        location: 'Bole',
        bedrooms: 1,
        bathrooms: 1,
        propertyType: 'apartment',
        listedBy: broker._id,
        status: 'pending',
        isActive: false,
        coordinates: { type: 'Point', coordinates: [38.78, 8.99] },
      });

      const res = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          houseId: unpublishedHouse._id,
          contactPhone: '+251922334455',
          message: 'Can I view this?',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Only published properties/i);
    });

    it('Allows inquiry participant to reply, while blocking third party', async () => {
      const inquiry = await Inquiry.create({
        houseId: publishedHouse._id,
        userId: renterUser._id,
        brokerId: broker._id,
        conversationId: 'renter_test_conv_key',
        contactPhone: '+251922334455',
        replies: [{ userId: renterUser._id, message: 'Initial inquiry' }],
      });

      // Broker replies
      const brokerReplyRes = await request(app)
        .post(`/api/inquiries/${inquiry._id}/reply`)
        .set('Authorization', `Bearer ${brokerToken}`)
        .send({ message: 'Yes, Saturday 10am works perfectly.' });

      expect(brokerReplyRes.status).toBe(201);

      // Third party attempt
      const intruderRes = await request(app)
        .post(`/api/inquiries/${inquiry._id}/reply`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ message: 'I want this house instead!' });

      expect(intruderRes.status).toBe(403);
    });
  });

  describe('Rental Agreement Creation & House Status Transition', () => {
    it('Creates rental agreement and automatically changes house status to "rented"', async () => {
      const res = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${brokerToken}`)
        .send({
          houseId: publishedHouse._id,
          tenantId: renterUser._id,
          monthlyRent: 35000,
          securityDeposit: 70000,
          leaseStartDate: '2026-11-01',
          leaseEndDate: '2027-10-31',
          paymentMethod: 'bank_transfer',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.monthlyRent).toBe(35000);
      expect(res.body.data.status).toBe('active');

      // Verify the house status was transitioned to rented and is no longer active
      const updatedHouse = await House.findById(publishedHouse._id);
      expect(updatedHouse.status).toBe('rented');
      expect(updatedHouse.isActive).toBe(false);

      // Verify house no longer appears in public GET /api/houses
      const publicSearchRes = await request(app).get('/api/houses');
      const found = publicSearchRes.body.data.find(h => h._id.toString() === publishedHouse._id.toString());
      expect(found).toBeUndefined();
    });

    it('Rejects rental agreement if leaseEndDate is before leaseStartDate', async () => {
      const res = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${brokerToken}`)
        .send({
          houseId: publishedHouse._id,
          tenantId: renterUser._id,
          monthlyRent: 35000,
          leaseStartDate: '2027-01-01',
          leaseEndDate: '2026-01-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Lease end date must be after start date/i);
    });

    it('Prevents non-brokers from creating rental agreements (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          houseId: publishedHouse._id,
          tenantId: renterUser._id,
          monthlyRent: 35000,
          leaseStartDate: '2026-11-01',
          leaseEndDate: '2027-10-31',
        });

      expect(res.status).toBe(403);
    });
  });
});
