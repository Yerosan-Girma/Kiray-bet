const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const User = require('../src/models/User');

describe('Authentication & Authorization Endpoints', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('POST /api/auth/register', () => {
    it('Registers a new renter user and sets refreshToken cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Abebe Kebede',
          email: 'abebe@example.com',
          password: 'password123',
          phone: '+251911223344',
          role: 'renter',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('abebe@example.com');
      expect(res.body.data.user.role).toBe('renter');
      expect(res.body.data.accessToken).toBeDefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=/);
    });

    it('Rejects duplicate email registration', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('Prevents direct registration as admin (rejected by validator) and broker (assigns renter)', async () => {
      // Sending admin is rejected by validator
      const adminRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Fake Admin',
          email: 'fakeadmin@example.com',
          password: 'password123',
          role: 'admin',
        });
      expect(adminRes.status).toBe(400);

      // Sending broker is demoted to renter
      const brokerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Broker Applicant',
          email: 'brokerdirect@example.com',
          password: 'password123',
          role: 'broker',
        });
      expect(brokerRes.status).toBe(201);
      expect(brokerRes.body.data.user.role).toBe('renter');
    });

    it('Rejects registration with invalid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'not-an-email',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login User',
        email: 'login@example.com',
        password: 'correctPassword123',
        role: 'renter',
        status: 'active',
      });
    });

    it('Logs in successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'correctPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('login@example.com');
    });

    it('Rejects invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it('Locks account after 5 consecutive failed login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'login@example.com', password: 'wrongPassword' });
      }

      // 6th attempt
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'correctPassword123' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Account locked/i);
    });
  });

  describe('POST /api/auth/refresh & /logout', () => {
    it('Refreshes access token with valid refreshToken cookie', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Refresh Tester',
          email: 'refresh@example.com',
          password: 'password123',
        });

      const cookie = reg.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('Rejects refresh request without cookie', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('Logs out and clears refreshToken', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Logout Tester',
          email: 'logout@example.com',
          password: 'password123',
        });

      const token = reg.body.data.accessToken;

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('Returns user profile when authenticated with valid Bearer token', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Profile Tester',
          email: 'profile@example.com',
          password: 'password123',
        });

      const token = reg.body.data.accessToken;

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('profile@example.com');
      // Passwords and refresh tokens must not be exposed
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.refreshToken).toBeUndefined();
    });

    it('Rejects profile request without token with 401', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Not authorized/i);
    });

    it('Rejects profile request with invalid token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(res.status).toBe(401);
    });
  });

  describe('Password Reset & Email Verification Flow', () => {
    it('Executes forgot-password and reset-password flow successfully', async () => {
      await User.create({
        name: 'Reset User',
        email: 'resetme@example.com',
        password: 'oldPassword123',
        status: 'active',
      });

      // 1. Request reset
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'resetme@example.com' });

      expect(forgotRes.status).toBe(200);

      // Check user has reset token hash
      const userWithToken = await User.findOne({ email: 'resetme@example.com' }).select('+resetPasswordToken +resetPasswordExpire');
      expect(userWithToken.resetPasswordToken).toBeDefined();
      expect(userWithToken.resetPasswordExpire).toBeDefined();

      // In real life, the user gets raw token in email. Let's create a known raw token & hash
      const crypto = require('crypto');
      const rawToken = 'test-token-1234567890abcdef1234567890abcdef';
      const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
      userWithToken.resetPasswordToken = hash;
      userWithToken.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
      await userWithToken.save();

      // 2. Perform reset
      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: rawToken,
          newPassword: 'brandNewPassword456',
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 3. Login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'resetme@example.com',
          password: 'brandNewPassword456',
        });

      expect(loginRes.status).toBe(200);
    });

    it('Verifies email successfully via /api/auth/verify-email', async () => {
      const user = await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'password123',
        emailVerified: false,
      });

      const verificationToken = jwt.sign(
        { id: user._id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '1d' }
      );

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await User.findById(user._id);
      expect(updated.emailVerified).toBe(true);
    });
  });

  describe('Google Authentication (POST /api/auth/google)', () => {
    it('Rejects request without credential/idToken with 400', async () => {
      const res = await request(app).post('/api/auth/google').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Rejects invalid Google ID token with 401', async () => {
      const res = await request(app).post('/api/auth/google').send({ idToken: 'fake-invalid-token' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
