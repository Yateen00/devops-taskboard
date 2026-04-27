const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Team = require('./models/Team');

const app = express();
app.use(express.json());
app.use(cors());

// Middleware to mock/decode JWT (In reality, verify JWT and set req.user)
// For simplicity we will assume req.headers['x-user-id'] is passed by API Gateway or frontend
const mockAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const username = req.headers['x-username'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = userId;
  req.username = username || 'Unknown';
  next();
};

app.post('/teams', mockAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Team name is required' });

    const team = new Team({
      name,
      members: [{ userId: req.userId, username: req.username, role: 'creator', jobTitle: 'Creator' }]
    });

    await team.save();
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/teams/user', mockAuth, async (req, res) => {
  try {
    const teams = await Team.find({ 'members.userId': req.userId });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/teams/join/:id', mockAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found (Invalid Join Code)' });

    const alreadyMember = team.members.some(m => m.userId === req.userId);
    if (alreadyMember) return res.status(400).json({ error: 'You are already a member of this team' });

    team.members.push({ userId: req.userId, username: req.username, role: 'member', jobTitle: 'Team Member' });
    await team.save();

    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/teams/:id', mockAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    
    // Check if user is in team
    const isMember = team.members.some(m => m.userId === req.userId);
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/teams/:id/members', mockAuth, async (req, res) => {
  try {
    const { targetUserId, targetUsername, role, jobTitle } = req.body;
    if (!targetUserId || !targetUsername) return res.status(400).json({ error: 'targetUserId and targetUsername are required' });

    const validRoles = ['admin', 'member'];
    const newRole = validRoles.includes(role) ? role : 'member';

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const currentUserRole = team.members.find(m => m.userId === req.userId)?.role;
    if (currentUserRole !== 'creator' && currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins or creators can add members' });
    }

    const alreadyMember = team.members.some(m => m.userId === targetUserId);
    if (alreadyMember) return res.status(400).json({ error: 'User is already a member' });

    team.members.push({ userId: targetUserId, username: targetUsername, role: newRole, jobTitle: jobTitle || 'Team Member' });
    await team.save();

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/teams/:id/members/:targetUserId/role', mockAuth, async (req, res) => {
  try {
    const { role, jobTitle } = req.body;
    const validRoles = ['admin', 'member'];
    if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const currentUserRole = team.members.find(m => m.userId === req.userId)?.role;
    if (currentUserRole !== 'creator' && currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins or creators can change roles' });
    }

    const targetMember = team.members.find(m => m.userId === req.params.targetUserId);
    if (!targetMember) return res.status(404).json({ error: 'Target member not found in team' });

    if (targetMember.role === 'creator' && role) {
      return res.status(403).json({ error: 'Cannot change the role of the creator' });
    }

    if (role) targetMember.role = role;
    if (jobTitle !== undefined) targetMember.jobTitle = jobTitle;
    await team.save();

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

if (process.env.NODE_ENV !== 'test') {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/taskflow';
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Team Service connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
  
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => console.log(`Team Service running on port ${PORT}`));
}

module.exports = app;
