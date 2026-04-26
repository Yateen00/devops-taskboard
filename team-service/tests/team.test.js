const request = require('supertest');
const app = require('../src/index');
const mongoose = require('mongoose');

jest.mock('mongoose', () => ({
  connect: jest.fn(),
  Schema: jest.fn(),
  model: jest.fn(() => ({
    findById: jest.fn(),
    save: jest.fn(),
  })),
}));

describe('Team Service', () => {
  test('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /teams should require user id in header', async () => {
    const res = await request(app).post('/teams').send({ name: 'DevOps Team' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
