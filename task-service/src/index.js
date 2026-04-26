const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Task = require('./models/Task');

const app = express();
app.use(express.json());
app.use(cors());

const mockAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = userId;
  next();
};

app.post('/tasks', mockAuth, async (req, res) => {
  try {
    const { title, description, teamId, assignees, deadline, subtasks, parentTaskId } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const task = new Task({
      title,
      description,
      teamId,
      assignees: assignees || [],
      deadline,
      subtasks: subtasks || [],
      parentTaskId: parentTaskId || null,
      createdBy: req.userId
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/tasks', mockAuth, async (req, res) => {
  try {
    // Fetch all tasks where user is assignee or creator (frontend will assemble the tree using parentTaskId)
    const tasks = await Task.find({
      $or: [
        { assignees: req.userId },
        { createdBy: req.userId }
      ]
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/tasks/:id', mockAuth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/tasks/:id', mockAuth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    // Note: should also delete children subtasks ideally, but keeping simple for now
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/tasks/:id/comments', mockAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.comments.push({ text, createdBy: req.userId });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/tasks/:id/subtasks/:subtaskId', mockAuth, async (req, res) => {
  try {
    const { isCompleted } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    subtask.isCompleted = isCompleted;
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

if (process.env.NODE_ENV !== 'test') {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/taskflow';
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Task Service connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
  
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => console.log(`Task Service running on port ${PORT}`));
}

module.exports = app;
