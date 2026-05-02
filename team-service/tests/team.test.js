const request = require('supertest');

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
    });

    test('should create team successfully', async () => {
      const res = await request(app).post('/teams')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ name: 'New Team' });
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('New Team');
    });

    test('should fail if team name is missing', async () => {
      const res = await request(app).post('/teams')
        .set('x-user-id', 'user1').set('x-username', 'testuser').send({});
      expect(res.statusCode).toBe(400);
    });

    test('should return 500 if save throws', async () => {
      mockSave.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).post('/teams')
        .set('x-user-id', 'user1').set('x-username', 'testuser')
        .send({ name: 'New Team' });
      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /teams/user', () => {
    test('should fetch teams for user', async () => {
      mockFind.mockResolvedValueOnce([{ _id: 'team1', name: 'Team Alpha' }]);
      const res = await request(app).get('/teams/user')
        .set('x-user-id', 'user1').set('x-username', 'testuser');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
    });

    test('should return 500 on error', async () => {
      mockFind.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/teams/user')
        .set('x-user-id', 'user1').set('x-username', 'testuser');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /teams/join/:id', () => {
    test('should add user to team', async () => {
      const mockTeam = { _id: 'team1', members: [], save: jest.fn().mockResolvedValueOnce(true) };
      mockFindById.mockResolvedValueOnce(mockTeam);
      const res = await request(app).post('/teams/join/team1')
        .set('x-user-id', 'user2').set('x-username', 'joiner');
      expect(res.statusCode).toBe(200);
      expect(mockTeam.members.length).toBe(1);
    });

    test('should fail if team not found', async () => {
      mockFindById.mockResolvedValueOnce(null);
      const res = await request(app).post('/teams/join/nonexistent')
        .set('x-user-id', 'user2').set('x-username', 'joiner');
      expect(res.statusCode).toBe(404);
    });

    test('should fail if already a member', async () => {
      const mockTeam = { _id: 'team1', members: [{ userId: 'user2', username: 'joiner', role: 'member' }], save: jest.fn() };
      mockFindById.mockResolvedValueOnce(mockTeam);
      const res = await request(app).post('/teams/join/team1')
        .set('x-user-id', 'user2').set('x-username', 'joiner');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /teams/:id', () => {
    test('should return team if user is member', async () => {
      const mockTeam = { _id: 'team1', name: 'Alpha', members: [{ userId: 'user1', role: 'creator' }] };
      mockFindById.mockResolvedValueOnce(mockTeam);
      const res = await request(app).get('/teams/team1')
        .set('x-user-id', 'user1').set('x-username', 'testuser');
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Alpha');
    });

    test('should return 404 if team not found', async () => {
      mockFindById.mockResolvedValueOnce(null);
      const res = await request(app).get('/teams/nope')
        .set('x-user-id', 'user1').set('x-username', 'testuser');
      expect(res.statusCode).toBe(404);
    });

    test('should return 403 if user is not member', async () => {
      const mockTeam = { _id: 'team1', name: 'Alpha', members: [{ userId: 'other', role: 'creator' }] };
      mockFindById.mockResolvedValueOnce(mockTeam);
      const res = await request(app).get('/teams/team1')
        .set('x-user-id', 'user1').set('x-username', 'testuser');
      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /teams/:id/members', () => {
    test('should add member as creator', async () => {
      const mockTeam = { _id: 'team1', members: [{ userId: 'user1', role: 'creator' }], save: jest.fn().mockResolvedValueOnce(true) };
      mockTeam.members.find = Array.prototype.find.bind(mockTeam.members);
      mockTeam.members.some = Array.prototype.some.bind(mockTeam.members);
      mockFindById.mockResolvedValueOnce(mockTeam);
      const res = await request(app).post('/teams/team1/members')
        .set('x-user-id', 'user1').set('x-username', 'creator')
        .send({ targetUserId: 'user2', targetUsername: 'newmember', role: 'member' });
      expect(res.statusCode).toBe(201);
    });

    test('should fail if missing required fields', async () => {
      const res = await request(app).post('/teams/team1/members')
        .set('x-user-id', 'user1').set('x-username', 'creator')
        .send({ targetUserId: 'user2' });
      expect(res.statusCode).toBe(400);
    });

    test('should fail if not admin/creator', async () => {
      const mockTeam = { _id: 'team1', members: [{ userId: 'user1', role: 'member' }], save: jest.fn() };
      mockTeam.members.find = Array.prototype.find.bind(mockTeam.members);
      mockTeam.members.some = Array.prototype.some.bind(mockTeam.members);
      mockFindById.mockResolvedValueOnce(mockTeam);
      const res = await request(app).post('/teams/team1/members')
        .set('x-user-id', 'user1').set('x-username', 'member')
        .send({ targetUserId: 'user2', targetUsername: 'new' });
      expect(res.statusCode).toBe(403);
    });

    test('should fail if already a member', async () => {
      const mockTeam = { _id: 'team1', members: [{ userId: 'user1', role: 'creator' }, { userId: 'user2', role: 'member' }], save: jest.fn() };
      mockTeam.members.find = Array.prototype.find.bind(mockTeam.members);
      mockTeam.members.some = Array.prototype.some.bind(mockTeam.members);
      mockFindById.mockResolvedValueOnce(mockTeam);
      const res = await request(app).post('/teams/team1/members')
        .set('x-user-id', 'user1').set('x-username', 'creator')
        .send({ targetUserId: 'user2', targetUsername: 'existing' });
      expect(res.statusCode).toBe(400);
    });

    test('should return 404 if team not found', async () => {
      mockFindById.mockResolvedValueOnce(null);
      const res = await request(app).post('/teams/nope/members')
        .set('x-user-id', 'user1').set('x-username', 'creator')
        .send({ targetUserId: 'user2', targetUsername: 'new' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /teams/:id/members/:targetUserId/role', () => {
    test('should update member role', async () => {
      const mockTeam = { _id: 'team1', members: [{ userId: 'user1', role: 'creator' }, { userId: 'user2', role: 'member' }], save: jest.fn().mockResolvedValueOnce(true) };
      mockTeam.members.find = Array.prototype.find.bind(mockTeam.members);
      mockFindById.mockResolvedValueOnce(mockTeam);
      const res = await request(app).put('/teams/team1/members/user2/role')
        .set('x-user-id', 'user1').set('x-username', 'creator')
        .send({ role: 'admin', jobTitle: 'Lead' });
      expect(res.statusCode).toBe(200);
    });

    test('should return 400 for invalid role', async () => {
      const res = await request(app).put('/teams/team1/members/user2/role')
        .set('x-user-id', 'user1').set('x-username', 'creator')
        .send({ role: 'superadmin' });
      expect(res.statusCode).toBe(400);
    });

    test('should return 404 if team not found', async () => {
      mockFindById.mockResolvedValueOnce(null);
      const res = await request(app).put('/teams/nope/members/user2/role')
        .set('x-user-id', 'user1').set('x-username', 'creator')
        .send({ role: 'admin' });
      expect(res.statusCode).toBe(404);
    });

    test('should return 403 if not admin/creator', async () => {
      const mockTeam = { _id: 'team1', members: [{ userId: 'user1', role: 'member' }, { userId: 'user2', role: 'member' }], save: jest.fn() };
      mockTeam.members.find = Array.prototype.find.bind(mockTeam.members);
      mockFindById.mockResolvedValueOnce(mockTeam);
      const res = await request(app).put('/teams/team1/members/user2/role')
        .set('x-user-id', 'user1').set('x-username', 'member')
        .send({ role: 'admin' });
      expect(res.statusCode).toBe(403);
    });

    test('should return 404 if target not in team', async () => {
      const mockTeam = { _id: 'team1', members: [{ userId: 'user1', role: 'creator' }], save: jest.fn() };
      mockTeam.members.find = Array.prototype.find.bind(mockTeam.members);
      mockFindById.mockResolvedValueOnce(mockTeam);
      const res = await request(app).put('/teams/team1/members/nope/role')
        .set('x-user-id', 'user1').set('x-username', 'creator')
        .send({ role: 'admin' });
      expect(res.statusCode).toBe(404);
    });

    test('should not allow changing creator role', async () => {
      const mockTeam = { _id: 'team1', members: [{ userId: 'user1', role: 'admin' }, { userId: 'user2', role: 'creator' }], save: jest.fn() };
      mockTeam.members.find = Array.prototype.find.bind(mockTeam.members);
      mockFindById.mockResolvedValueOnce(mockTeam);
      const res = await request(app).put('/teams/team1/members/user2/role')
        .set('x-user-id', 'user1').set('x-username', 'admin')
        .send({ role: 'member' });
      expect(res.statusCode).toBe(403);
    });
  });
});
