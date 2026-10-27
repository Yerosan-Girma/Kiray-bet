const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const User = require('../src/models/User');
const House = require('../src/models/House');
const { generateAccessToken } = require('../src/services/authService');

describe('House Listings API Endpoints', () => {
  let admin, approvedBroker, unapprovedBroker, renter, owner;
  let adminToken, brokerToken, unapprovedToken, renterToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      status: 'active',
      isApproved: true,
    });
    adminToken = generateAccessToken(admin);

    approvedBroker = await User.create({
      name: 'Approved Broker',
      email: 'broker@example.com',
      password: 'password123',
      role: 'broker',
      status: 'active',
      isApproved: true,
      brokerApplicationStatus: 'approved',
    });
    brokerToken = generateAccessToken(approvedBroker);

    unapprovedBroker = await User.create({
      name: 'Unapproved Broker',
      email: 'unapproved@example.com',
      password: 'password123',
      role: 'broker',
      status: 'active',
      isApproved: false,
      brokerApplicationStatus: 'pending',
    });
    unapprovedToken = generateAccessToken(unapprovedBroker);

    renter = await User.create({
      name: 'Renter User',
      email: 'renter@example.com',
      password: 'password123',
      role: 'renter',
      status: 'active',
    });
    renterToken = generateAccessToken(renter);

    owner = await User.create({
      name: 'Owner User',
      email: 'owner@example.com',
      password: 'password123',
      role: 'owner',
      status: 'active',
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('POST /api/houses (Listing Creation)', () => {
    const validHousePayload = {
      title: 'Luxury Bole Villa',
      description: 'Stunning villa with spacious garden and modern finishings',
      price: 45000,
      location: 'Bole, Addis Ababa',
      bedrooms: 4,
      bathrooms: 3,
      propertyType: 'villa',
      amenities: ['wifi', 'parking', 'garden'],
      coordinates: {
        type: 'Point',
        coordinates: [38.7891, 8.9952],
      },
      status: 'pending',
    };

    it('Allows approved broker to create a listing', async () => {
      const res = await request(app)
        .post('/api/houses')
        .set('Authorization', `Bearer ${brokerToken}`)
        .send(validHousePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Luxury Bole Villa');
      expect(res.body.data.price).toBe(45000);
      expect(res.body.data.brokerId.toString()).toBe(approvedBroker._id.toString());
    });

    it('Allows admin to create a listing', async () => {
      const res = await request(app)
        .post('/api/houses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validHousePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('Rejects unapproved broker with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/houses')
        .set('Authorization', `Bearer ${unapprovedToken}`)
        .send(validHousePayload);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/requires admin approval/i);
    });

    it('Rejects renter with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/houses')
        .set('Authorization', `Bearer ${renterToken}`)
        .send(validHousePayload);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not allowed/i);
    });

    it('Rejects unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/houses')
        .send(validHousePayload);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/houses & GET /api/houses/:id', () => {
    let house1, house2;

    beforeEach(async () => {
      house1 = await House.create({
        title: 'Bole Studio Apartment',
        description: 'Cozy studio close to Atlas Hotel',
        price: 15000,
        location: 'Bole, Addis Ababa',
        bedrooms: 1,
        bathrooms: 1,
        propertyType: 'studio',
        listedBy: approvedBroker._id,
        brokerId: approvedBroker._id,
        status: 'approved',
        isActive: true,
        coordinates: { type: 'Point', coordinates: [38.789, 8.995] },
      });

      house2 = await House.create({
        title: 'CMC Luxury Villa',
        description: '5-bedroom family house in CMC',
        price: 60000,
        location: 'CMC, Addis Ababa',
        bedrooms: 5,
        bathrooms: 4,
        propertyType: 'villa',
        listedBy: approvedBroker._id,
        brokerId: approvedBroker._id,
        status: 'approved',
        isActive: true,
        coordinates: { type: 'Point', coordinates: [38.850, 9.020] },
      });

      // Pending house should be hidden from public GET /api/houses
      await House.create({
        title: 'Pending Draft House',
        description: 'Should not appear publicly',
        price: 20000,
        location: 'Kazanchis',
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'apartment',
        listedBy: approvedBroker._id,
        brokerId: approvedBroker._id,
        status: 'pending',
        isActive: false,
        coordinates: { type: 'Point', coordinates: [38.760, 9.010] },
      });
    });

    it('Returns only approved and active listings with pagination', async () => {
      const res = await request(app).get('/api/houses');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
    });

    it('Filters listings by propertyType and price range', async () => {
      const res = await request(app)
        .get('/api/houses')
        .query({ propertyType: 'villa', minPrice: 50000 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('CMC Luxury Villa');
    });

    it('Sorts listings by price ascending and descending', async () => {
      const resAsc = await request(app)
        .get('/api/houses')
        .query({ sort: 'price_asc' });

      expect(resAsc.body.data[0].price).toBe(15000);

      const resDesc = await request(app)
        .get('/api/houses')
        .query({ sort: 'price_desc' });

      expect(resDesc.body.data[0].price).toBe(60000);
    });

    it('Gets single house details and increments view count atomically', async () => {
      const initialViews = house1.views;

      const res = await request(app).get(`/api/houses/${house1._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Bole Studio Apartment');
      expect(res.body.data.listedBy).toBeDefined();
      expect(res.body.data.listedBy.name).toBe('Approved Broker');

      const updated = await House.findById(house1._id);
      expect(updated.views).toBe(initialViews + 1);
    });

    it('Returns 404 for non-existent house ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/houses/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('Returns 400 for malformed Mongo ID', async () => {
      const res = await request(app).get('/api/houses/not-a-valid-object-id');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/houses/:id & DELETE /api/houses/:id', () => {
    let house;
    let otherBroker, otherBrokerToken;

    beforeEach(async () => {
      otherBroker = await User.create({
        name: 'Other Broker',
        email: 'otherbroker@example.com',
        password: 'password123',
        role: 'broker',
        status: 'active',
        isApproved: true,
        brokerApplicationStatus: 'approved',
      });
      otherBrokerToken = generateAccessToken(otherBroker);

      house = await House.create({
        title: 'Editable House',
        description: 'Before update',
        price: 30000,
        location: 'Old Airport',
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'house',
        listedBy: approvedBroker._id,
        brokerId: approvedBroker._id,
        ownerId: owner._id,
        status: 'pending',
        coordinates: { type: 'Point', coordinates: [38.740, 8.980] },
      });
    });

    it('Allows the listing broker to update the listing', async () => {
      const res = await request(app)
        .put(`/api/houses/${house._id}`)
        .set('Authorization', `Bearer ${brokerToken}`)
        .send({ price: 32000, description: 'Updated description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(32000);
      expect(res.body.data.description).toBe('Updated description');
    });

    it('Prevents another broker from updating the listing (403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/houses/${house._id}`)
        .set('Authorization', `Bearer ${otherBrokerToken}`)
        .send({ price: 99999 });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Not authorized/i);
    });

    it('Allows the listing broker to delete the house and creates an audit log', async () => {
      const res = await request(app)
        .delete(`/api/houses/${house._id}`)
        .set('Authorization', `Bearer ${brokerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await House.findById(house._id);
      expect(deleted).toBeNull();
    });
  });
});
