const request = require('supertest');
const { app } = require('../src/index');
const mongoose = require('mongoose');

jest.mock('mongoose', () => {
  const mockFind = jest.fn();
  return {
    connect: jest.fn(),
    Schema: jest.fn(),
    model: jest.fn(() => ({
      find: mockFind,
    })),
    __mockFind: mockFind
  };
});

describe('Chat Service API', () => {
  let mockFind;

  beforeEach(() => {
    mockFind = mongoose.__mockFind;
    mockFind.mockClear();
  });

  describe('GET /health', () => {
    test('should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /messages/:teamId', () => {
    test('should require user id in header', async () => {
      const res = await request(app).get('/messages/team1');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    test('should return list of messages', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnValue([{ _id: 'msg1', text: 'Hello' }])
      };
      mockFind.mockReturnValueOnce(mockQuery);

      const res = await request(app).get('/messages/team1')
        .set('x-user-id', 'user1');
        
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].text).toBe('Hello');
    });
  });
});
