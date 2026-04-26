const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false }
}, { _id: true });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  teamId: { type: String }, // Optional, can belong to a team
  assignees: [{ type: String }], // Array of user IDs
  deadline: { type: Date },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  subtasks: [subtaskSchema],
  createdBy: { type: String, required: true } // User ID
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
