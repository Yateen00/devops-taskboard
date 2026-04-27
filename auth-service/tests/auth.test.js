const request = require('supertest');
const bcrypt = require('bcryptjs');

// Set up mocks BEFORE requiring the app
const mockFindOne = jest.fn();
const mockSave = jest.fn();

jest.mock('mongoose', () => {
  function MockModel(data) {
    Object.assign(this, data);
    this.save = mockSave.mockImplementation(function() {
      return Promise.resolve(this);
    }.bind(this));
  }
  MockModel.findOne = mockFindOne;

  return {
    connect: jest.fn(),
    Schema: jest.fn(),
    model: jest.fn(() => MockModel),
  };
});

const app = require('../src/index');

describe('Auth Service API', () => {
  beforeEach(() => {
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

    test('should create new user and return success message', async () => {
      mockFindOne.mockResolvedValueOnce(null);

      const res = await request(app).post('/signup').send({ username: 'testuser', password: 'password123' });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('User created successfully');
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
      expect(res.body.username).toBe('testuser');
    });
  });
});
