const request = require('supertest');
const app = require('../src/app');
const { AppError } = require('../src/utils/AppError');

describe('Server & Middleware Configuration', () => {
  it('GET /health returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'OK' });
  });

  it('Unknown API route returns standard JSON 404 response', async () => {
    const res = await request(app).get('/api/unknown-endpoint-test');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Cannot find \/api\/unknown-endpoint-test/);
  });

  it('Unknown top-level route returns standard JSON 404 response', async () => {
    const res = await request(app).post('/random-unhandled-path');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('Rejects malformed JSON body with appropriate 400 error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ "invalidJson": ');

    expect(res.status).toBe(400);
  });

  it('Formats duplicate key errors cleanly without crashing', async () => {
    const { errorHandler } = require('../src/middleware/errorHandler');
    let capturedStatus = null;
    let capturedJson = null;

    const fakeRes = {
      status(code) {
        capturedStatus = code;
        return this;
      },
      json(data) {
        capturedJson = data;
        return this;
      },
    };

    const duplicateErr = {
      code: 11000,
      keyValue: { email: 'duplicate@test.com' },
      message: 'E11000 duplicate key error collection',
    };

    errorHandler(duplicateErr, {}, fakeRes, () => {});

    expect(capturedStatus).toBe(400);
    expect(capturedJson.success).toBe(false);
    expect(capturedJson.message).toContain('email: duplicate@test.com');
  });

  it('Formats CastError cleanly as 400 bad request', async () => {
    const { errorHandler } = require('../src/middleware/errorHandler');
    let capturedStatus = null;
    let capturedJson = null;

    const fakeRes = {
      status(code) {
        capturedStatus = code;
        return this;
      },
      json(data) {
        capturedJson = data;
        return this;
      },
    };

    const castErr = {
      name: 'CastError',
      path: '_id',
      value: 'invalid-id-format',
    };

    errorHandler(castErr, {}, fakeRes, () => {});

    expect(capturedStatus).toBe(400);
    expect(capturedJson.success).toBe(false);
    expect(capturedJson.message).toBe('Invalid _id: invalid-id-format');
  });
});
