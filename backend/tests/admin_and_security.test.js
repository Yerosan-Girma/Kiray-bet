const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const User = require('../src/models/User');
const House = require('../src/models/House');
const { generateAccessToken } = require('../src/services/authService');

describe('Admin Operations, Moderation & Security Hardening', () => {
  let admin, regularUser, broker, victimUser;
  let adminToken, regularToken, brokerToken, victimToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    admin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@kiraybet.com',
      password: 'password123',
      role: 'admin',
      status: 'active',
      isApproved: true,
    });
    adminToken = generateAccessToken(admin);

    regularUser = await User.create({
      name: 'Regular Tenant',
      email: 'tenant@example.com',
      password: 'password123',
      role: 'renter',
      status: 'active',
    });
    regularToken = generateAccessToken(regularUser);

    victimUser = await User.create({
      name: 'Victim User',
      email: 'victim@example.com',
      password: 'password123',
      role: 'renter',
      status: 'active',
    });
    victimToken = generateAccessToken(victimUser);

    broker = await User.create({
      name: 'Broker Ermias',
      email: 'ermias@broker.com',
      password: 'password123',
      role: 'broker',
      status: 'active',
      isApproved: true,
      brokerApplicationStatus: 'approved',
    });
    brokerToken = generateAccessToken(broker);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('Admin Dashboard & Permissions', () => {
    it('Admin can access GET /api/admin/dashboard and get system statistics', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBeDefined();
      expect(res.body.data.totalListings).toBeDefined();
    });

    it('Non-admin user is rejected from GET /api/admin/dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not allowed/i);
    });
  });

  describe('Admin User Moderation (Suspend, Ban, Restore)', () => {
    it('Admin can suspend, ban, and restore a user', async () => {
      // 1. Suspend
      const suspendRes = await request(app)
        .put(`/api/admin/users/${regularUser._id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Policy violation' });

      expect(suspendRes.status).toBe(200);
      let updated = await User.findById(regularUser._id);
      expect(updated.status).toBe('suspended');

      // 2. Ban
      const banRes = await request(app)
        .put(`/api/admin/users/${regularUser._id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(banRes.status).toBe(200);
      updated = await User.findById(regularUser._id);
      expect(updated.status).toBe('banned');

      // 3. Restore
      const restoreRes = await request(app)
        .put(`/api/admin/users/${regularUser._id}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(restoreRes.status).toBe(200);
      updated = await User.findById(regularUser._id);
      expect(updated.status).toBe('active');
    });
  });

  describe('Admin Listing Moderation', () => {
    it('Admin can approve a pending listing', async () => {
      const pendingHouse = await House.create({
        title: 'Pending Admin Review House',
        description: 'Needs admin check',
        price: 20000,
        location: 'Gerji',
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'apartment',
        listedBy: broker._id,
        brokerId: broker._id,
        status: 'pending',
        coordinates: { type: 'Point', coordinates: [38.80, 9.00] },
      });

      const res = await request(app)
        .put(`/api/admin/listings/${pendingHouse._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const approved = await House.findById(pendingHouse._id);
      expect(approved.status).toBe('approved');
      expect(approved.isActive).toBe(true);
    });
  });

  describe('Security & Vulnerability Protections', () => {
    it('NoSQL Injection in login credentials fails securely', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $ne: null },
          password: { $ne: null },
        });

      // The express validator requires email to be a valid email string
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Protected endpoints ensure private data isolation (IDOR protection)', async () => {
      // Create favorite for victimUser
      const house = await House.create({
        title: 'Isolated House',
        description: 'Testing privacy',
        price: 15000,
        location: 'Mexico',
        bedrooms: 1,
        bathrooms: 1,
        propertyType: 'apartment',
        listedBy: broker._id,
        brokerId: broker._id,
        status: 'approved',
        coordinates: { type: 'Point', coordinates: [38.75, 9.01] },
      });

      // regularUser adds to favorites
      await request(app)
        .post(`/api/favorites/${house._id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      // victimUser fetches their own favorites -> should be empty (not contain regularUser's)
      const victimFavoritesRes = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${victimToken}`);

      expect(victimFavoritesRes.status).toBe(200);
      expect(victimFavoritesRes.body.data.length).toBe(0);
    });

    it('Sensitive credentials are never exposed in user queries or responses', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.refreshToken).toBeUndefined();
      expect(res.body.data.resetPasswordToken).toBeUndefined();
    });
  });
});
