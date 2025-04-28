const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');



// Dashboard statistics
router.get('/dashboard/stats', protect, adminController.getDashboardStats);

// Student engagement data
router.get('/dashboard/engagement', protect,adminController.getStudentEngagement);

// Grade distribution
router.get('/dashboard/grades', protect,adminController.getGradeDistribution);

// Activity heatmap
router.get('/dashboard/activity',protect, adminController.getActivityHeatmap);

// Top students
router.get('/dashboard/top-students', protect,adminController.getTopStudents);

// Popular courses
router.get('/dashboard/popular-courses',protect, adminController.getPopularCourses);

// Course Management
router.get('/courses', protect,adminController.getAllCourses);
router.get('/courses/:id',protect, adminController.getCourseById);
router.post('/courses', protect,adminController.createCourse);
router.put('/courses/:id',protect, adminController.updateCourse);
router.delete('/courses/:id',protect, adminController.deleteCourse);

// Meeting Management Routes
router.get('/meetings',protect, adminController.getAllMeetings);
router.get('/meetings/:id',protect, adminController.getMeetingById);
router.post('/meetings', protect,adminController.createMeeting);
router.put('/meetings/:id',protect, adminController.updateMeeting);
router.delete('/meetings/:id',protect, adminController.deleteMeeting);

// Resource Management Routes
router.get('/resources', protect,adminController.getAllResources);
router.get('/resources/:id', protect,adminController.getResourceById);
router.post('/resources', protect,adminController.createResource);
router.put('/resources/:id', protect,adminController.updateResource);
router.delete('/resources/:id',protect, adminController.deleteResource);

module.exports = router; 