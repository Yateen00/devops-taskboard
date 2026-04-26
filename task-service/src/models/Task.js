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
  subtasks: [subtaskSchema], // Legacy simple subtasks
  parentTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null }, // For recursive infinite subtasks
  comments: [{
    text: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdBy: { type: String, required: true } // User ID
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
