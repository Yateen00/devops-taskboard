const request = require('supertest');
const app = require('../src/index');
const mongoose = require('mongoose');

jest.mock('mongoose', () => ({
  connect: jest.fn(),
  Schema: jest.fn(),
  model: jest.fn(() => ({
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  })),
}));

describe('Task Service', () => {
  test('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /tasks should require user id in header', async () => {
    const res = await request(app).post('/tasks').send({ title: 'New Task' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
