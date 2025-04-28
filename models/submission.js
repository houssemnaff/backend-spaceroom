
// models/Submission.js
const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String
  }],
  grade: {
    type: Number,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['submitted', 'late', 'graded'],
    default: 'submitted'
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
