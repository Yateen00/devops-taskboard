const request = require('supertest');

// Set up mocks BEFORE requiring the app
const mockSave = jest.fn();
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();

jest.mock('mongoose', () => {
  // Create a constructor function for the model
  function MockModel(data) {
    Object.assign(this, data);
    this.save = mockSave.mockImplementation(function() {
      return Promise.resolve(this);
    }.bind(this));
  }
  MockModel.find = mockFind;
  MockModel.findById = mockFindById;
  MockModel.findByIdAndUpdate = mockFindByIdAndUpdate;
  MockModel.findByIdAndDelete = mockFindByIdAndDelete;

  return {
    connect: jest.fn(),
    Schema: Object.assign(jest.fn(), {
      Types: {
        ObjectId: String
      }
    }),
    model: jest.fn(() => MockModel),
  };
});

const app = require('../src/index');

describe('Task Service API', () => {
  beforeEach(() => {
    mockSave.mockClear();
    mockFind.mockClear();
    mockFindById.mockClear();
    mockFindByIdAndUpdate.mockClear();
    mockFindByIdAndDelete.mockClear();
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
      mockFind.mockResolvedValueOnce([]); // completeChildren finds no children
      
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
      const mockTask = {
        _id: 'task1',
        comments: [],
        save: jest.fn().mockResolvedValueOnce(true)
      };
      // Push should work on the array
      mockFindById.mockResolvedValueOnce(mockTask);
      
      const res = await request(app).post('/tasks/task1/comments')
        .set('x-user-id', 'user1')
        .set('x-username', 'testuser')
        .send({ text: 'This is a comment' });
        
      expect(res.statusCode).toBe(201);
      expect(mockTask.comments.length).toBe(1);
      expect(mockTask.comments[0].text).toBe('This is a comment');
      expect(mockTask.save).toHaveBeenCalled();
    });
  });
});
