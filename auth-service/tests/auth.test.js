const request = require('supertest');
const app = require('../src/index');
const mongoose = require('mongoose');

// Mock mongoose to avoid actual DB connections during simple tests
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  Schema: jest.fn(),
  model: jest.fn(() => ({
    findOne: jest.fn(),
    save: jest.fn(),
  })),
}));

describe('Auth Service', () => {
  test('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /signup should require username and password', async () => {
    const res = await request(app).post('/signup').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Username and password required');
  });
});
