const mongoose = require('mongoose');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const User = require('../src/models/User');
const House = require('../src/models/House');
const Transaction = require('../src/models/Transaction');
const Favorite = require('../src/models/Favorite');
const Rent = require('../src/models/Rent');
const AuditLog = require('../src/models/AuditLog');

describe('Mongoose Models & Schema Validation', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('User Model', () => {
    it('Requires name, email, and password', async () => {
      const user = new User({});
      let err;
      try {
        await user.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.email).toBeDefined();
      expect(err.errors.password).toBeDefined();
    });

    it('Trims and lowercases email automatically', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: '  JOHN.DOE@Example.COM  ',
        password: 'password123',
      });
      expect(user.email).toBe('john.doe@example.com');
    });

    it('Hashes password upon save and validates with comparePassword', async () => {
      const user = await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'plainSecretPassword',
      });

      expect(user.password).not.toBe('plainSecretPassword');
      expect(user.password).toMatch(/^\$2[aby]\$/);

      const isMatch = await user.comparePassword('plainSecretPassword');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('wrongPassword');
      expect(isNotMatch).toBe(false);
    });

    it('Rejects invalid roles outside enum', async () => {
      const user = new User({
        name: 'Invalid Role User',
        email: 'invalid@example.com',
        password: 'password123',
        role: 'superhacker',
      });
      let err;
      try {
        await user.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.role).toBeDefined();
    });
  });

  describe('House Model', () => {
    it('Requires essential fields: title, description, price, location, bedrooms, bathrooms, propertyType', async () => {
      const house = new House({});
      let err;
      try {
        await house.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.title).toBeDefined();
      expect(err.errors.description).toBeDefined();
      expect(err.errors.price).toBeDefined();
      expect(err.errors.location).toBeDefined();
      expect(err.errors.bedrooms).toBeDefined();
      expect(err.errors.bathrooms).toBeDefined();
      expect(err.errors.propertyType).toBeDefined();
    });

    it('Saves valid GeoJSON 2dsphere coordinates', async () => {
      const user = await User.create({
        name: 'Broker Lister',
        email: 'broker.lister@example.com',
        password: 'password123',
        role: 'broker',
      });

      const house = await House.create({
        title: 'Modern Bole Apartment',
        description: 'Spacious 2 bedroom apartment in Bole',
        price: 25000,
        location: 'Bole, Addis Ababa',
        bedrooms: 2,
        bathrooms: 2,
        propertyType: 'apartment',
        listedBy: user._id,
        coordinates: {
          type: 'Point',
          coordinates: [38.7891, 8.9952],
        },
      });

      expect(house._id).toBeDefined();
      expect(house.coordinates.type).toBe('Point');
      expect(house.coordinates.coordinates).toEqual([38.7891, 8.9952]);
      expect(house.views).toBe(0);
      expect(house.status).toBe('pending');
    });
  });

  describe('Transaction Model & Sparse Receipt Index', () => {
    it('Allows multiple pending transactions without receiptNumber without E11000 duplicate error', async () => {
      const user = await User.create({
        name: 'Payer User',
        email: 'payer@example.com',
        password: 'password123',
      });

      const tx1 = await Transaction.create({
        userId: user._id,
        amount: 500,
        paymentMethod: 'telebirr',
        reference: 'REF-TX-001',
        status: 'pending',
      });

      const tx2 = await Transaction.create({
        userId: user._id,
        amount: 500,
        paymentMethod: 'telebirr',
        reference: 'REF-TX-002',
        status: 'pending',
      });

      expect(tx1._id).toBeDefined();
      expect(tx2._id).toBeDefined();
      expect(tx1.receiptNumber).toBeUndefined();
      expect(tx2.receiptNumber).toBeUndefined();
    });
  });

  describe('Favorite Model & Duplicate Protection', () => {
    it('Rejects duplicate favorite for the same user and house', async () => {
      // Ensure indexes are synced
      await Favorite.init();

      const user = await User.create({
        name: 'Fav User',
        email: 'favuser@example.com',
        password: 'password123',
      });
      const houseId = new mongoose.Types.ObjectId();

      await Favorite.create({ userId: user._id, houseId });

      let err;
      try {
        await Favorite.create({ userId: user._id, houseId });
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.code).toBe(11000);
    });
  });

  describe('Rent Model', () => {
    it('Creates valid rental agreement record with required fields', async () => {
      const landlordId = new mongoose.Types.ObjectId();
      const tenantId = new mongoose.Types.ObjectId();
      const houseId = new mongoose.Types.ObjectId();

      const rent = await Rent.create({
        houseId,
        tenantId,
        landlordId,
        leaseStartDate: new Date('2026-11-01'),
        leaseEndDate: new Date('2027-10-31'),
        monthlyRent: 30000,
        securityDeposit: 60000,
        status: 'active',
      });

      expect(rent._id).toBeDefined();
      expect(rent.monthlyRent).toBe(30000);
      expect(rent.paymentSchedule).toBe('monthly');
    });
  });

  describe('AuditLog Model Immutability', () => {
    it('Audit logs cannot be edited once saved', async () => {
      const log = await AuditLog.create({
        action: 'property_published',
        targetId: new mongoose.Types.ObjectId(),
        targetType: 'house',
        details: { initial: true },
      });

      log.action = 'delete_listing';
      let err;
      try {
        await log.save();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.message).toMatch(/Audit logs cannot be edited/);
    });
  });
});
