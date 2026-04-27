const request = require('supertest');
const app = require('../src/index');
const mongoose = require('mongoose');

jest.mock('mongoose', () => {
  const mockFind = jest.fn();
  const mockFindById = jest.fn();
  const mockFindByIdAndUpdate = jest.fn();
  const mockFindByIdAndDelete = jest.fn();
  const mockSave = jest.fn();
  
  return {
    connect: jest.fn(),
    Schema: jest.fn(),
    model: jest.fn(() => ({
      find: mockFind,
      findById: mockFindById,
      findByIdAndUpdate: mockFindByIdAndUpdate,
      findByIdAndDelete: mockFindByIdAndDelete,
      save: mockSave,
    })),
    __mockFind: mockFind,
    __mockFindById: mockFindById,
    __mockFindByIdAndUpdate: mockFindByIdAndUpdate,
    __mockSave: mockSave
  };
});

describe('Task Service API', () => {
  let mockFind, mockFindById, mockFindByIdAndUpdate, mockSave;

  beforeEach(() => {
    mockFind = mongoose.__mockFind;
    mockFindById = mongoose.__mockFindById;
    mockFindByIdAndUpdate = mongoose.__mockFindByIdAndUpdate;
    mockSave = mongoose.__mockSave;
    
    mockFind.mockClear();
    mockFindById.mockClear();
    mockFindByIdAndUpdate.mockClear();
    mockSave.mockClear();
  });

  describe('GET /health', () => {
    test('should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /tasks', () => {
    test('should require user id in header', async () => {
      const res = await request(app).post('/tasks').send({ title: 'New Task' });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    test('should create task successfully', async () => {
      mockSave.mockResolvedValueOnce({ _id: 'task1', title: 'New Task' });
      const res = await request(app).post('/tasks')
        .set('x-user-id', 'user1')
        .set('x-username', 'testuser')
        .send({ title: 'New Task', teamId: 'team1', assignees: ['user1'] });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('New Task');
    });
  });

  describe('PUT /tasks/:id', () => {
    test('should update task status', async () => {
      mockFindByIdAndUpdate.mockResolvedValueOnce({ _id: 'task1', status: 'completed' });
      
      const res = await request(app).put('/tasks/task1')
        .set('x-user-id', 'user1')
        .set('x-username', 'testuser')
        .send({ status: 'completed' });
        
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('completed');
    });
  });

  describe('POST /tasks/:id/comments', () => {
    test('should add comment to task', async () => {
      const mockTask = { _id: 'task1', comments: [], save: jest.fn().mockResolvedValueOnce(true) };
      mockFindById.mockResolvedValueOnce(mockTask);
      
      const res = await request(app).post('/tasks/task1/comments')
        .set('x-user-id', 'user1')
        .set('x-username', 'testuser')
        .send({ text: 'This is a comment' });
        
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Comment added');
      expect(mockTask.save).toHaveBeenCalled();
    });
  });
});
