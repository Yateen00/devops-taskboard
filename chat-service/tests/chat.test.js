const request = require('supertest');
const { app } = require('../src/index');
const mongoose = require('mongoose');

jest.mock('mongoose', () => ({
  connect: jest.fn(),
  Schema: jest.fn(),
  model: jest.fn(() => ({
    find: jest.fn(() => ({
      sort: jest.fn().mockResolvedValue([{ text: 'Hello' }])
    })),
    save: jest.fn(),
  })),
}));

describe('Chat Service', () => {
  test('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /messages/:teamId should return unauthorized without header', async () => {
    const res = await request(app).get('/messages/team1');
    expect(res.statusCode).toBe(401);
  });
});
