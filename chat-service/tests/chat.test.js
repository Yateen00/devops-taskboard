const request = require('supertest');

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

const { app } = require('../src/index');
const mongoose = require('mongoose');

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

    test('should return empty array when no messages', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnValue([])
      };
      mockFind.mockReturnValueOnce(mockQuery);

      const res = await request(app).get('/messages/team1')
        .set('x-user-id', 'user1');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(0);
    });

    test('should return 500 on database error', async () => {
      mockFind.mockImplementationOnce(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).get('/messages/team1')
        .set('x-user-id', 'user1');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});
