const request = require('supertest');

// Set up mocks BEFORE requiring the app
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockSave = jest.fn();

jest.mock('mongoose', () => {
  function MockModel(data) {
    Object.assign(this, data);
    this.save = mockSave.mockImplementation(function() {
      return Promise.resolve(this);
    }.bind(this));
  }
  MockModel.find = mockFind;
  MockModel.findById = mockFindById;

  return {
    connect: jest.fn(),
    Schema: jest.fn(),
    model: jest.fn(() => MockModel),
  };
});

const app = require('../src/index');

describe('Team Service API', () => {
  beforeEach(() => {
    mockFind.mockClear();
    mockFindById.mockClear();
    mockSave.mockClear();
  });

  describe('GET /health', () => {
    test('should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /teams', () => {
    test('should require user id in header', async () => {
      const res = await request(app).post('/teams').send({ name: 'New Team' });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    test('should create team successfully', async () => {
      const res = await request(app).post('/teams')
        .set('x-user-id', 'user1')
        .set('x-username', 'testuser')
        .send({ name: 'New Team' });
        
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('New Team');
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /teams/user', () => {
    test('should fetch teams for user', async () => {
      mockFind.mockResolvedValueOnce([{ _id: 'team1', name: 'Team Alpha' }]);
      const res = await request(app).get('/teams/user')
        .set('x-user-id', 'user1')
        .set('x-username', 'testuser');
        
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Team Alpha');
    });
  });

  describe('POST /teams/join/:id', () => {
    test('should add user to team', async () => {
      const mockTeam = { 
        _id: 'team1', 
        members: [], 
        save: jest.fn().mockResolvedValueOnce(true) 
      };
      mockFindById.mockResolvedValueOnce(mockTeam);
      
      const res = await request(app).post('/teams/join/team1')
        .set('x-user-id', 'user2')
        .set('x-username', 'joineruser');
        
      expect(res.statusCode).toBe(200);
      expect(mockTeam.members.length).toBe(1);
      expect(mockTeam.members[0].userId).toBe('user2');
      expect(mockTeam.save).toHaveBeenCalled();
    });

    test('should fail if team not found', async () => {
      mockFindById.mockResolvedValueOnce(null);
      const res = await request(app).post('/teams/join/nonexistent')
        .set('x-user-id', 'user2')
        .set('x-username', 'joineruser');
        
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Team not found (Invalid Join Code)');
    });
  });
});
