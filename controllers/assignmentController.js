const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const UserProgress = require('../models/UserProgress');
// Créer un nouveau devoir
exports.createAssignment = async (req, res) => {
    try {
      const { title, description, courseId, dueDate, maxPoints } = req.body;
      const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype
      })) : [];
  
      const assignment = new Assignment({
        title,
        description,
        courseId,
        createdBy: req.user.id,
        dueDate,
        maxPoints: maxPoints || 100,
        attachments
      });
  
      await assignment.save();
      res.status(201).json(assignment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la création du devoir" });
    }
  };

// Récupérer tous les devoirs pour un cours
exports.getAssignmentsByCourse = async (req, res) => {
  try {
    console.log("coursid",req.params.courseId );
    const assignments = await Assignment.find({ courseId: req.params.courseId }).sort({ dueDate: 1 });
    res.status(200).json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des devoirs" });
  }
};

// Récupérer un devoir par son ID
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Devoir non trouvé" });
    }
    res.status(200).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération du devoir" });
  }
};
// Mettre à jour un devoir
exports.updateAssignment = async (req, res) => {
    console.log("fils ",req.files);
    try {
      const { title, description, dueDate, maxPoints } = req.body;
      const assignment = await Assignment.findById(req.params.id);
  
      if (!assignment) {
        return res.status(404).json({ message: "Devoir non trouvé" });
      }
  
      if (assignment.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ce devoir" });
      }
  
      let attachments = assignment.attachments || [];
      
      // Ajouter de nouvelles pièces jointes
      if (req.files && req.files.length > 0) {
        const newAttachments = req.files.map(file => ({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype
        }));
        attachments = [...attachments, ...newAttachments];
      }
  
      // Supprimer des pièces jointes si demandé
      if (req.body.removeAttachments) {
        const removeFilePaths = JSON.parse(req.body.removeAttachments);
        
        // Remove files from filesystem
        const fs = require('fs');
        removeFilePaths.forEach(filePath => {
          try {
            // Safely remove the file if it exists
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            console.error(`Error removing file ${filePath}:`, err);
          }
        });
  
        // Filter out removed attachments
        attachments = attachments.filter(
          attachment => !removeFilePaths.includes(attachment.path)
        );
      }
  
      // Update assignment fields
      assignment.title = title || assignment.title;
      assignment.description = description || assignment.description;
      assignment.dueDate = dueDate || assignment.dueDate;
      assignment.maxPoints = maxPoints || assignment.maxPoints;
      assignment.attachments = attachments;
  
      await assignment.save();
      res.status(200).json(assignment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du devoir" });
    }
  };
// Supprimer un devoir
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: "Devoir non trouvé" });
    }

    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer ce devoir" });
    }

    // Supprimer les soumissions associées
    await Submission.deleteMany({ assignmentId: req.params.id });

    // Nettoyer les UserProgress
    await UserProgress.updateMany(
      { completedAssignments: req.params.id },
      { $pull: { completedAssignments: req.params.id } }
    );

    // Supprimer le devoir
    await Assignment.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Devoir supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression du devoir" });
  }
};
