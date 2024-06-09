// models/task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  done: { type: Boolean, default: false },
  description: { type: String, required: true }
});

module.exports = mongoose.model('Task', taskSchema);
