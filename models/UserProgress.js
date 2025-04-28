const mongoose = require("mongoose");
const UserProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    viewedResources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ressource' }],
    completedAssignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
    viewedChapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }]
  });

module.exports = mongoose.model("UserProgress", UserProgressSchema);
