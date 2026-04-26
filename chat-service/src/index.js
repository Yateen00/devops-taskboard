const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const Message = require('./models/Message');

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const mockAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = userId;
  next();
};

// Fetch chat history for a team
app.get('/messages/:teamId', mockAuth, async (req, res) => {
  try {
    const messages = await Message.find({ teamId: req.params.teamId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Socket.io integration
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a specific team's chat room
  socket.on('join_team', (teamId) => {
    socket.join(teamId);
    console.log(`User with socket ID ${socket.id} joined room ${teamId}`);
  });

  // Handle incoming messages
  socket.on('send_message', async (data) => {
    try {
      const { teamId, senderId, text } = data;
      const message = new Message({ teamId, senderId, text });
      await message.save();

      // Broadcast to the room
      io.to(teamId).emit('receive_message', message);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

if (process.env.NODE_ENV !== 'test') {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/taskflow';
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Chat Service connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
  
  const PORT = process.env.PORT || 3004;
  server.listen(PORT, () => console.log(`Chat Service running on port ${PORT}`));
}

// Export the app (for tests)
module.exports = { app, server };
