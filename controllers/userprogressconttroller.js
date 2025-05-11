const Assignment = require("../models/Assignment");
const Ressource = require("../models/ressource");
const UserProgress = require("../models/UserProgress");
const Chapter = require("../models/chapter");
const Quiz = require("../models/quizmodelchapitre");
const QuizAttempt = require("../models/quizattmetpchapitre");

// ✅ Fonction utilitaire pour mettre à jour la progression
exports.updateProgressPercentage = async function (userId, courseId) {
  const totalResources = await Ressource.countDocuments({ courseId });
  const totalAssignments = await Assignment.countDocuments({ courseId });
  const totalQuizzes = await Quiz.countDocuments({ courseId });

  const progress = await UserProgress.findOne({ userId, courseId });

  const completedQuizzes = await QuizAttempt.countDocuments({
    userId,
    courseId,
    completed: true
  });

  const totalElements = totalResources + totalAssignments + totalQuizzes;
  const completedElements = 
    (progress?.viewedResources?.length || 0) + 
    (progress?.completedAssignments?.length || 0) + 
    completedQuizzes;

  const percentage = totalElements > 0 
    ? Math.min((completedElements / totalElements) * 100, 100) 
    : 0;

  progress.progressPercentage = percentage;
  await progress.save();

  return percentage;
}

// ✅ Marquer une ressource comme vue
exports.markResourceViewed = async (req, res) => {
  const { userId, courseId, resourceId, chapterId } = req.body;

  try {
    const resource = await Ressource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Ressource non trouvée" });
    }

    let progress = await UserProgress.findOne({ userId, courseId });
    if (!progress) {
      progress = new UserProgress({ userId, courseId });
    }
    
    // ✅ Initialiser les tableaux s’ils sont undefined
    progress.viewedResources = progress.viewedResources || [];
    progress.completedAssignments = progress.completedAssignments || [];
    progress.completedQuizzes = progress.completedQuizzes || [];
    progress.viewedChapters = progress.viewedChapters || [];
    

    if (!progress.viewedResources.includes(resourceId)) {
      progress.viewedResources.push(resourceId);
    }

    if (chapterId && !progress.viewedChapters.includes(chapterId)) {
      progress.viewedChapters.push(chapterId);
    }

    await progress.save();

    const progressPercentage = await this.updateProgressPercentage(userId, courseId);

    res.json({ 
      message: "Ressource marquée comme vue", 
      progress,
      progressPercentage
    });

  } catch (err) {
    console.error("Erreur lors du marquage de la ressource:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Marquer un devoir comme complété
exports.markAssignmentCompleted = async (userId, courseId, assignmentId) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new Error("Devoir non trouvé");
  }

  let progress = await UserProgress.findOne({ userId, courseId });
  if (!progress) {
    progress = new UserProgress({ 
      userId, 
      courseId, 
      viewedResources: [], 
      completedAssignments: [],
      completedQuizzes: [],
      viewedChapters: [],
      progressPercentage: 0
    });
  }

  if (!progress.completedAssignments.includes(assignmentId)) {
    progress.completedAssignments.push(assignmentId);
    await progress.save();
  }

  await updateProgressPercentage(userId, courseId);

  return progress;
};

// ✅ Obtenir la progression complète
exports.getCourseProgress = async (req, res) => {
  const { userId, courseId } = req.params;

  try {
    const totalResources = await Ressource.countDocuments({ courseId });
    const totalAssignments = await Assignment.countDocuments({ courseId });
    const totalQuizzes = await Quiz.countDocuments({ courseId });

    const progress = await UserProgress.findOne({ userId, courseId }) || { 
      viewedResources: [], 
      completedAssignments: [],
      completedQuizzes: [],
      progressPercentage: 0
    };

    const completedQuizzes = await QuizAttempt.countDocuments({
      userId,
      courseId,
      completed: true
    });

    const totalElements = totalResources + totalAssignments + totalQuizzes;
    const completedElements = 
      progress.viewedResources.length + 
      progress.completedAssignments.length + 
      completedQuizzes;

    const progressPercentage = totalElements > 0 
      ? Math.min((completedElements / totalElements) * 100, 100) 
      : 0;

    res.json({ 
      progress: {
        progressPercentage: progress.progressPercentage || progressPercentage,
        viewedResources: progress.viewedResources.length,
        completedAssignments: progress.completedAssignments.length,
        completedQuizzes,
        totalResources,
        totalAssignments,
        totalQuizzes
      }
    });

  } catch (err) {
    console.error("Erreur lors de la récupération de la progression:", err);
    res.status(500).json({ error: err.message });
  }
};
