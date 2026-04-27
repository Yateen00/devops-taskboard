const request = require('supertest');
const app = require('../src/index');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock mongoose to avoid actual DB connections during simple tests
jest.mock('mongoose', () => {
  const mockFindOne = jest.fn();
  const mockSave = jest.fn();
  return {
    connect: jest.fn(),
    Schema: jest.fn(),
    model: jest.fn(() => ({
      findOne: mockFindOne,
      save: mockSave,
    })),
    __mockFindOne: mockFindOne,
    __mockSave: mockSave
  };
});

describe('Auth Service API', () => {
  let mockFindOne, mockSave;

  beforeEach(() => {
    mockFindOne = mongoose.__mockFindOne;
    mockSave = mongoose.__mockSave;
    mockFindOne.mockClear();
    mockSave.mockClear();
  });

  describe('GET /health', () => {
    test('should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /signup', () => {
    test('should fail if missing fields', async () => {
      const res = await request(app).post('/signup').send({ username: 'test' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Username and password required');
    });

    test('should fail if username already exists', async () => {
      mockFindOne.mockResolvedValueOnce({ username: 'testuser' });
      const res = await request(app).post('/signup').send({ username: 'testuser', password: 'password123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('User already exists');
    });

    test('should create new user and return user object', async () => {
      mockFindOne.mockResolvedValueOnce(null);
      mockSave.mockResolvedValueOnce({ _id: '123', username: 'testuser' });

      const res = await request(app).post('/signup').send({ username: 'testuser', password: 'password123' });
      expect(res.statusCode).toBe(201);
      expect(res.body.username).toBe('testuser');
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /login', () => {
    test('should fail if user not found', async () => {
      mockFindOne.mockResolvedValueOnce(null);
      const res = await request(app).post('/login').send({ username: 'wronguser', password: 'password123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid credentials');
    });

    test('should login and return token', async () => {
      mockFindOne.mockResolvedValueOnce({ 
        _id: '123', 
        username: 'testuser',
        password: await bcrypt.hash('password123', 10)
      });
      
      const res = await request(app).post('/login').send({ username: 'testuser', password: 'password123' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('testuser');
    });
  });
});
