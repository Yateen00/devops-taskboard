const request = require('supertest');

const mockSave = jest.fn();
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();

jest.mock('mongoose', () => {
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
    Schema: Object.assign(jest.fn(), { Types: { ObjectId: String } }),
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
    });

    test('should create task successfully', async () => {
      const res = await request(app).post('/tasks')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ title: 'New Task', teamId: 'team1', assignees: ['user1'] });
      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('New Task');
    });

    test('should fail if title is missing', async () => {
      const res = await request(app).post('/tasks')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ description: 'no title' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Title is required');
    });

    test('should return 500 if save throws', async () => {
      mockSave.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).post('/tasks')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ title: 'New Task' });
      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /tasks', () => {
    test('should fetch tasks for user', async () => {
      mockFind.mockResolvedValueOnce([{ _id: 't1', title: 'Task 1' }]);
      const res = await request(app).get('/tasks')
        .set('x-user-id', 'user1').set('x-username', 'testuser');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
    });

    test('should require auth', async () => {
      const res = await request(app).get('/tasks');
      expect(res.statusCode).toBe(401);
    });

    test('should return 500 on error', async () => {
      mockFind.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/tasks')
        .set('x-user-id', 'user1').set('x-username', 'testuser');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('PUT /tasks/:id', () => {
    test('should update task status', async () => {
      mockFindByIdAndUpdate.mockResolvedValueOnce({ _id: 'task1', status: 'completed' });
      mockFind.mockResolvedValueOnce([]);
      const res = await request(app).put('/tasks/task1')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ status: 'completed' });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('completed');
    });

    test('should return 404 if task not found', async () => {
      mockFindByIdAndUpdate.mockResolvedValueOnce(null);
      const res = await request(app).put('/tasks/nope')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ status: 'completed' });
      expect(res.statusCode).toBe(404);
    });

    test('should update title and deadline', async () => {
      mockFindByIdAndUpdate.mockResolvedValueOnce({ _id: 'task1', title: 'Updated', deadline: '2026-12-31' });
      const res = await request(app).put('/tasks/task1')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ title: 'Updated', deadline: '2026-12-31' });
      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Updated');
    });

    test('should return 500 on error', async () => {
      mockFindByIdAndUpdate.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).put('/tasks/task1')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ status: 'completed' });
      expect(res.statusCode).toBe(500);
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('should delete task and children', async () => {
      mockFindByIdAndDelete.mockResolvedValueOnce({ _id: 'task1', title: 'Deleted' });
      mockFind.mockResolvedValueOnce([]);
      const res = await request(app).delete('/tasks/task1')
        .set('x-user-id', 'user1').set('x-username', 'testuser');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Task and children deleted');
    });

    test('should return 404 if task not found', async () => {
      mockFindByIdAndDelete.mockResolvedValueOnce(null);
      const res = await request(app).delete('/tasks/nope')
        .set('x-user-id', 'user1').set('x-username', 'testuser');
      expect(res.statusCode).toBe(404);
    });

    test('should return 500 on error', async () => {
      mockFindByIdAndDelete.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).delete('/tasks/task1')
        .set('x-user-id', 'user1').set('x-username', 'testuser');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /tasks/:id/comments', () => {
    test('should add comment to task', async () => {
      const mockTask = { _id: 'task1', comments: [], save: jest.fn().mockResolvedValueOnce(true) };
      mockFindById.mockResolvedValueOnce(mockTask);
      const res = await request(app).post('/tasks/task1/comments')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ text: 'This is a comment' });
      expect(res.statusCode).toBe(201);
      expect(mockTask.comments.length).toBe(1);
    });

    test('should fail if text is missing', async () => {
      const res = await request(app).post('/tasks/task1/comments')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({});
      expect(res.statusCode).toBe(400);
    });

    test('should return 404 if task not found', async () => {
      mockFindById.mockResolvedValueOnce(null);
      const res = await request(app).post('/tasks/nope/comments')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ text: 'comment' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /tasks/:id/subtasks/:subtaskId', () => {
    test('should toggle subtask completion', async () => {
      const mockSubtask = { _id: 'sub1', isCompleted: false };
      const mockTask = {
        _id: 'task1',
        subtasks: { id: jest.fn().mockReturnValue(mockSubtask) },
        save: jest.fn().mockResolvedValueOnce(true)
      };
      mockFindById.mockResolvedValueOnce(mockTask);
      const res = await request(app).put('/tasks/task1/subtasks/sub1')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ isCompleted: true });
      expect(res.statusCode).toBe(200);
      expect(mockSubtask.isCompleted).toBe(true);
    });

    test('should return 404 if task not found', async () => {
      mockFindById.mockResolvedValueOnce(null);
      const res = await request(app).put('/tasks/nope/subtasks/sub1')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ isCompleted: true });
      expect(res.statusCode).toBe(404);
    });

    test('should return 404 if subtask not found', async () => {
      const mockTask = {
        _id: 'task1',
        subtasks: { id: jest.fn().mockReturnValue(null) },
        save: jest.fn()
      };
      mockFindById.mockResolvedValueOnce(mockTask);
      const res = await request(app).put('/tasks/task1/subtasks/nope')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ isCompleted: true });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Subtask not found');
    });
  });
});
