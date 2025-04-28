const User = require('../models/user');
const Course = require('../models/course');

const Submission = require('../models/submission');
const Quiz = require('../models/quizmodelchapitre');

const Meeting = require('../models/meeting');
const Resource = require('../models/ressource');

// Dashboard Functions
const getDashboardStats = async (req, res) => {
  try {
    const [
      activeStudents,
      activeCourses,
      totalSubmissions,
      completedQuizzes
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Course.countDocuments(),
      Submission.countDocuments(),
      Quiz.countDocuments({ status: 'completed' })
    ]);

    // Calculate success rate (example: based on quiz completion)
    const successRate = activeStudents > 0 
      ? Math.round((completedQuizzes / (activeStudents * activeCourses)) * 100) 
      : 0;

    // Calculate average time (example: 2 hours per course)
    const averageTime = '2h00';

    // Calculate global progress (example: based on submissions)
    const globalProgress = activeStudents > 0 
      ? Math.round((totalSubmissions / (activeStudents * activeCourses)) * 100) 
      : 0;

    // Calculate quiz completion rate
    const quizCompletion = activeStudents > 0 
      ? Math.round((completedQuizzes / activeStudents) * 100) 
      : 0;

    res.json({
      activeStudents,
      activeCourses,
      averageTime,
      successRate,
      globalProgress,
      quizCompletion,
      submissions: totalSubmissions
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};

const getStudentEngagement = async (req, res) => {
  try {
    // Get last 7 days of engagement data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const engagementData = await Promise.all(
      last7Days.map(async (date) => {
        const submissions = await Submission.countDocuments({
          createdAt: {
            $gte: new Date(date),
            $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
          }
        });
        return {
          _id: date,
          engagement: submissions
        };
      })
    );

    res.json(engagementData.reverse());
  } catch (error) {
    console.error('Error fetching student engagement:', error);
    res.status(500).json({ message: 'Error fetching student engagement data' });
  }
};

const getGradeDistribution = async (req, res) => {
  try {
    const gradeRanges = [
      { min: 0, max: 20, label: '0-20' },
      { min: 21, max: 40, label: '21-40' },
      { min: 41, max: 60, label: '41-60' },
      { min: 61, max: 80, label: '61-80' },
      { min: 81, max: 100, label: '81-100' }
    ];

    const distribution = await Promise.all(
      gradeRanges.map(async (range) => {
        const count = await Quiz.countDocuments({
          score: { $gte: range.min, $lte: range.max }
        });
        return {
          _id: range.label,
          count
        };
      })
    );

    res.json(distribution);
  } catch (error) {
    console.error('Error fetching grade distribution:', error);
    res.status(500).json({ message: 'Error fetching grade distribution' });
  }
};

const getActivityHeatmap = async (req, res) => {
  try {
    // Generate sample heatmap data (7 days x 12 hours)
    const heatmapData = Array.from({ length: 7 }, () =>
      Array.from({ length: 12 }, () => Math.floor(Math.random() * 10))
    );

    res.json(heatmapData);
  } catch (error) {
    console.error('Error fetching activity heatmap:', error);
    res.status(500).json({ message: 'Error fetching activity heatmap' });
  }
};
/*
const getTopStudents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const topStudents = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: 'userId',
          as: 'quizzes'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          performance: {
            $avg: '$quizzes.score'
          },
          quizzesCompleted: { $size: '$quizzes' }
        }
      },
      { $sort: { performance: -1 } },
      { $limit: limit }
    ]);

    res.json(topStudents);
  } catch (error) {
    console.error('Error fetching top students:', error);
    res.status(500).json({ message: 'Error fetching top students' });
  }
};


const getPopularCourses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    
    const popularCourses = await Course.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'enrolledCourses',
          as: 'enrolledStudents'
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          students: { $size: '$enrolledStudents' },
          createdAt: 1
        }
      },
      { $sort: { students: -1 } },
      { $limit: limit }
    ]);

    res.json(popularCourses);
  } catch (error) {
    console.error('Error fetching popular courses:', error);
    res.status(500).json({ message: 'Error fetching popular courses' });
  }
};
*/
// Course Management Functions
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des cours' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('students', 'name email');
    
    if (!course) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du cours' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description, category, level, price } = req.body;
    
    const course = new Course({
      title,
      description,
      category,
      level,
      price,
      owner: req.user._id
    });
    
    await course.save();
    
    // Add course to owner's createdCourses
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdCourses: course._id }
    });
    
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Erreur lors de la création du cours' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { title, description, category, level, price } = req.body;
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    
    // Check if user is the owner
    if (course.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé à modifier ce cours' });
    }
    
    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;
    course.level = level || course.level;
    course.price = price || course.price;
    
    await course.save();
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du cours' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    
    // Check if user is the owner
    if (course.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce cours' });
    }
    
    // Remove course from owner's createdCourses
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { createdCourses: course._id }
    });
    
    // Remove course from students' enrolledCourses
    await User.updateMany(
      { enrolledCourses: course._id },
      { $pull: { enrolledCourses: course._id } }
    );
    
    await course.remove();
    res.json({ message: 'Cours supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du cours' });
  }
};
// Meeting Management

const getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate('hostId', 'name email')
      .populate('attendees', 'name email')
      .populate('courseId', 'title')
      .sort({ startTime: -1 });

    res.status(200).json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des réunions" });
  }
};

const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('hostId', 'name email')
      .populate('attendees', 'name email')
      .populate('courseId', 'title');

    if (!meeting) {
      return res.status(404).json({ message: "Réunion non trouvée" });
    }

    res.status(200).json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ message: "Erreur lors de la récupération de la réunion" });
  }
};

const createMeeting = async (req, res) => {
  try {
    const { 
      courseId, 
      title, 
      startTime, 
      duration, 
      description, 
      location, 
      attendees 
    } = req.body;
    
    // Générer un ID de salle unique
    const roomID = `meeting-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const meeting = new Meeting({
      courseId,
      title,
      startTime,
      duration,
      description,
      hostId: req.user._id,
      hostName: req.user.name || req.user.username,
      attendees: attendees || [],
      location: location || "Salle virtuelle A",
      roomID
    });

    await meeting.save();
    res.status(201).json(meeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ message: "Erreur lors de la création de la réunion" });
  }
};

const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: "Réunion non trouvée" });
    }

    // Vérifier que l'utilisateur est l'hôte de la réunion
    if (meeting.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Non autorisé à modifier cette réunion" });
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedMeeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la réunion" });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: "Réunion non trouvée" });
    }

    // Vérifier que l'utilisateur est l'hôte de la réunion
    if (meeting.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Non autorisé à supprimer cette réunion" });
    }

    await Meeting.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Réunion supprimée avec succès" });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ message: "Erreur lors de la suppression de la réunion" });
  }
};

// Ajout d'une fonction pour mettre à jour le statut d'enregistrement
const updateRecordingStatus = async (req, res) => {
  try {
    const { recordingAvailable, recordingUrl } = req.body;
    
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: "Réunion non trouvée" });
    }

    if (meeting.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Non autorisé à modifier cette réunion" });
    }

    meeting.recordingAvailable = recordingAvailable;
    meeting.recordingUrl = recordingUrl;
    
    await meeting.save();
    
    res.status(200).json(meeting);
  } catch (error) {
    console.error('Error updating recording status:', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du statut d'enregistrement" });
  }
};

const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find()
      
      .sort({ _id: -1 });

    res.status(200).json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des ressources" });
  }
};

const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('courseId', 'title')
      .populate('chapterId', 'title');

    if (!resource) {
      return res.status(404).json({ message: "Ressource non trouvée" });
    }

    res.status(200).json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ message: "Erreur lors de la récupération de la ressource" });
  }
};

const createResource = async (req, res) => {
  try {
    const { courseId, chapterId, name, type, url } = req.body;
    
    const resource = new Resource({
      courseId,
      chapterId,
      name,
      type,
      url
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ message: "Erreur lors de la création de la ressource" });
  }
};

const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: "Ressource non trouvée" });
    }

    // Since there's no uploadedBy field, we can remove the permission check
    // or implement a different authorization strategy if needed

    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedResource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la ressource" });
  }
};

const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: "Ressource non trouvée" });
    }

    // Since there's no uploadedBy field, we can remove the permission check
    // or implement a different authorization strategy if needed

    await Resource.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Ressource supprimée avec succès" });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: "Erreur lors de la suppression de la ressource" });
  }
};

const getPopularCourses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    
    const popularCourses = await Course.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'enrolledCourses',
          as: 'enrolledStudents'
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          owner: 1,
          // Compter le nombre d'étudiants sans compter le propriétaire
          students: {
            $size: {
              $filter: {
                input: "$enrolledStudents",
                as: "student",
                cond: { $ne: ["$$student._id", "$owner"] }
              }
            }
          },
          createdAt: 1
        }
      },
      { $sort: { students: -1 } },
      { $limit: limit }
    ]);

    res.json(popularCourses);
  } catch (error) {
    console.error('Error fetching popular courses:', error);
    res.status(500).json({ message: 'Error fetching popular courses' });
  }
};

const getTopStudents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const topStudents = await User.aggregate([
      { $match: { role: 'student' } },
      // Joindre les quiz complétés
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: 'userId',
          as: 'quizzes'
        }
      },
      // Joindre les cours auxquels l'étudiant est inscrit
      {
        $lookup: {
          from: 'courses',
          localField: 'enrolledCourses',
          foreignField: '_id',
          as: 'courses'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          // Calcul de la moyenne des scores de quiz
          performance: {
            $avg: '$quizzes.score'
          },
          quizzesCompleted: { $size: '$quizzes' },
          // Nombre de cours auxquels l'étudiant est inscrit
          coursesEnrolled: { $size: '$courses' },
          // Progression = (quiz complétés / nombre total de quiz disponibles dans ses cours) * 100
          progression: {
            $multiply: [
              {
                $cond: [
                  { $eq: [{ $size: "$courses" }, 0] },
                  0,
                  {
                    $divide: [
                      { $size: "$quizzes" },
                      { $max: [1, { $size: "$courses" }] }
                    ]
                  }
                ]
              },
              100
            ]
          }
        }
      },
      // Trier par progression plutôt que par performance uniquement
      { $sort: { progression: -1, performance: -1 } },
      { $limit: limit }
    ]);

    res.json(topStudents);
  } catch (error) {
    console.error('Error fetching top students:', error);
    res.status(500).json({ message: 'Error fetching top students' });
  }
};

module.exports = {
  getDashboardStats,
  getStudentEngagement,
  getGradeDistribution,
  getActivityHeatmap,
  getTopStudents,
  getPopularCourses,
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
}; 