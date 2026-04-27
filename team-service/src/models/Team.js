const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId: {
    type: String, // Storing user ID from auth service
    required: true
  },
  username: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['creator', 'admin', 'member'],
    default: 'member',
    required: true
  },
  jobTitle: {
    type: String,
    default: 'Team Member'
  }
}, { _id: false });

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: [memberSchema]
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
