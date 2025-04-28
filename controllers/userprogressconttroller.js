const Assignment = require("../models/Assignment");
const Ressource = require("../models/ressource");
const UserProgress = require("../models/UserProgress");
const Chapter = require("../models/chapter");

// Marquer une ressource comme vue
exports.markResourceViewed = async (req, res) => {
  const { userId, courseId, resourceId, chapterId } = req.body;

  try {
    // Vérifier si la ressource existe
    const resource = await Ressource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Ressource non trouvée" });
    }

    // Trouver ou créer un enregistrement de progression
    let progress = await UserProgress.findOne({ userId, courseId });
    if (!progress) {
      progress = new UserProgress({ 
        userId, 
        courseId, 
        viewedResources: [], 
        completedAssignments: [],
        viewedChapters: []
      });
    }

    // Ajouter la ressource aux ressources vues
    if (!progress.viewedResources.includes(resourceId)) {
      progress.viewedResources.push(resourceId);
    }

    // Ajouter le chapitre si nécessaire
    if (chapterId && !progress.viewedChapters.includes(chapterId)) {
      progress.viewedChapters.push(chapterId);
    }

    await progress.save();

    res.json({ 
      message: "Ressource marquée comme vue", 
      progress 
    });

  } catch (err) {
    console.error("Erreur lors du marquage de la ressource:", err);
    res.status(500).json({ error: err.message });
  }
};
exports.markAssignmentCompleted = async (userId, courseId, assignmentId) => {
  // Vérifier si le devoir existe
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new Error("Devoir non trouvé");
  }

  // Trouver ou créer un enregistrement de progression
  let progress = await UserProgress.findOne({ userId, courseId });
  
  if (!progress) {
    progress = new UserProgress({ 
      userId, 
      courseId, 
      viewedResources: [], 
      completedAssignments: [],
      viewedChapters: []
    });
  }

  // Ajouter le devoir aux devoirs complétés (sans doublon)
  if (!progress.completedAssignments.includes(assignmentId)) {
    progress.completedAssignments.push(assignmentId);
    await progress.save();
  }

  return progress;
};
// Obtenir la progression d'un utilisateur pour un cours
exports.getCourseProgress = async (req, res) => {
  const { userId, courseId } = req.params;

  try {
    // Compter les ressources totales du cours
    const totalResources = await Ressource.countDocuments({ courseId });
    
    // Compter les devoirs totaux du cours
    const totalAssignments = await Assignment.countDocuments({ courseId });
    
    // Compter les chapitres du cours
    const totalChapters = await Chapter.countDocuments({ courseId });

    // Trouver la progression de l'utilisateur
    const progress = await UserProgress.findOne({ userId, courseId }) || { 
      viewedResources: [], 
      completedAssignments: [],
      viewedChapters: []
    };

    // Calculer le nombre total d'éléments
    const totalElements = totalResources + totalAssignments + totalChapters;
    const completedElements = 
      progress.viewedResources.length + 
      progress.completedAssignments.length + 
      progress.viewedChapters.length;

    // Calculer le pourcentage de progression
    const progressPercentage = totalElements > 0 
      ? Math.min((completedElements / totalElements) * 100, 100) 
      : 0;

    res.json({ 
      progress: {
        progressPercentage,
        viewedResources: progress.viewedResources.length,
        completedAssignments: progress.completedAssignments.length,
        viewedChapters: progress.viewedChapters.length,
        totalResources,
        totalAssignments,
        totalChapters
      }
    });

  } catch (err) {
    console.error("Erreur lors de la récupération de la progression:", err);
    res.status(500).json({ error: err.message });
  }
};