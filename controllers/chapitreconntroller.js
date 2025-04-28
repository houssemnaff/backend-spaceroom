const Chapter = require("../models/chapter");
const Course = require("../models/course");
const cloudinary = require('../config/cloudinaryConfig');  // Assurez-vous que la config Cloudinary est correcte
const ressource = require("../models/ressource");
const sendEmail = require("./emailcontroller");
const notificationService = require("../controllers/fonctionnotification");

// Ajouter un chapitre à un cours
const addChapterToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, number } = req.body;
    console.log("title", title, description);

    // Vérifier si le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }

    // Créer un nouveau chapitre
    const newChapter = new Chapter({
      title,
      description,
      number
    });

    // Sauvegarder le chapitre dans la base de données
    const savedChapter = await newChapter.save();

    // Ajouter le chapitre au cours
    course.chapters.push(savedChapter._id);
    await course.save();

    res.status(201).json({ message: "Chapitre ajouté avec succès", chapter: savedChapter });
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Obtenir tous les chapitres d'un cours spécifique
const getAllChaptersForCourse = async (req, res) => {
  console.log("course chapters console ");

  try {
    const { courseId } = req.params;
    console.log("course chapters", courseId);

    // Vérifier si le cours existe
    const course = await Course.findById(courseId).populate("chapters");
    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }

    res.status(200).json({ chapters: course.chapters });
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const deleteChapterFromCourse = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;  // Récupérer les IDs depuis les paramètres de l'URL
    console.error("chapitre id et cour id:", courseId, chapterId);

    // Vérifier si le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }

    // Vérifier si le chapitre existe dans la liste des chapitres du cours
    const chapterExists = course.chapters.some(chapter => chapter.toString() === chapterId);
    if (!chapterExists) {
      return res.status(404).json({ message: "Chapitre non trouvé dans ce cours" });
    }

    // Supprimer le chapitre de la liste des chapitres du cours
    course.chapters = course.chapters.filter(id => id.toString() !== chapterId);
    await course.save();

    // Supprimer le chapitre de la base de données
    await Chapter.findByIdAndDelete(chapterId);

    res.status(200).json({ message: "Chapitre supprimé avec succès" });
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const updateChapter = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;  // Récupérer les IDs depuis les paramètres de l'URL
    const { title, description, number } = req.body;

    // Vérifier si le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }

    // Vérifier si le chapitre existe dans la liste des chapitres du cours
    const chapterExists = course.chapters.some(chapter => chapter.toString() === chapterId);
    if (!chapterExists) {
      return res.status(404).json({ message: "Chapitre non trouvé dans ce cours" });
    }

    // Mettre à jour le chapitre
    const updatedChapter = await Chapter.findByIdAndUpdate(
      chapterId,
      { title, description, number },
      { new: true, runValidators: true }
    );

    if (!updatedChapter) {
      return res.status(404).json({ message: "Chapitre non trouvé" });
    }

    res.status(200).json({ message: "Chapitre mis à jour avec succès", chapter: updatedChapter });
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
const Addressourcetochapitre = async (req, res) => {
  //console.log("req body", req.body);
  //console.log("req params", req.params);
  //console.log("req file", req.file);

  try {
    const { courseId, chapterId } = req.params;
    const { name, type, url: inputUrl } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Nom de la ressource requis' });
    }

    // Initialize resourceUrl
    let resourceUrl = inputUrl;

    // Upload file to Cloudinary if file exists
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path, {
          folder: `courses/${courseId}/resources`,
          public_id: `resource-${Date.now()}`,
          resource_type: 'auto', // Automatically detect resource type
          access_mode: 'public' // Ensure public accessibility
        });

        resourceUrl = cloudinaryResponse.secure_url;

        // Remove local file after upload
        // fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Erreur de téléchargement de la ressource' });
      }
    }

    // Validate URL for non-link resources
    if (!resourceUrl && (type === 'file' || type === 'video')) {
      return res.status(400).json({ message: 'Fichier requis pour ce type de ressource' });
    }

    // Verify chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapitre non trouvé' });
    }

    // Create new resource
    const newResource = new ressource({
      courseId,
      chapterId,
      name,
      type,
      url: resourceUrl
    });

    // Save resource
    await newResource.save();

    // Add resource to chapter's resources array
    chapter.resources.push(newResource._id);
    await chapter.save();
    // Create notifications for all students in the course
    

    // 🔹 Récupérer les étudiants inscrits au cours
    const course = await Course.findById(courseId).populate('students');
    const courseprof = await Course.findById(courseId).populate('students').populate('owner');

    const studentsEmails = course.students.map(student => student.email);
    console.log("email", studentsEmails)

    if (studentsEmails.length > 0) {
      // 🔹 Appel de la fonction sendEmail
      await sendEmail({
        from: "houssemnaffouti28@gmail.com",
        to: studentsEmails.join(","), // Transformer la liste en une seule chaîne
        subject: `📚 Nouvelle ressource ajoutée au cours : ${course.title}`,
        text: `Cher(e) étudiant(e), Une nouvelle ressource intitulée "${name}" a été ajoutée au cours "${course.title}" par votre enseignant "${course.owner.name}". Nous vous invitons à la consulter dès maintenant sur la plateforme.📌 Accédez à la ressource ici : ${resourceUrl}
          
          Cordialement,  
          L'équipe pédagogique
              `,
        html: `
                  <p>Bonjour,</p>
                  <p>Votre enseignant "${courseprof.owner.name}" a ajouté une nouvelle ressource au cours <strong>${course.title}</strong>.</p>
                  <p>📘 <strong>Ressource :</strong> ${name}</p>
                  <p>🔗 <a href="${resourceUrl}" style="color: #007bff; text-decoration: none;">Accéder à la ressource</a></p>
                  <br>
                  <p>Nous vous encourageons à la consulter dès maintenant.</p>
                  <p>Cordialement,</p>
                  <p><strong>L'équipe pédagogique</strong></p>
              `
      });

    }

      try {
        await notificationService.notifyCourseStudents(
          courseId,
          `Nouvelle ressource ajoutée au cours "${course.title}"`,
          `Votre professeur a ajouté une nouvelle ressource "${name}" dans le chapitre "${chapter.title}".`,
          "resource",
          newResource._id,
          courseId
        );
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Ne pas bloquer la réponse pour une erreur de notification
      }
    
    res.status(201).json({
      message: 'Ressource ajoutée avec succès',
      resource: newResource
    });
  } catch (error) {
    console.error('Erreur de création de ressource:', error);
    res.status(500).json({
      message: 'Erreur du serveur',
      error: error.message
    });
  }
};
const Getressourcechapitre = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;

    // Vérifier si le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }

    // Vérifier si le chapitre existe et récupérer ses ressources
    const chapter = await Chapter.findById(chapterId).populate("resources");

    if (!chapter) {
      return res.status(404).json({ message: "Chapitre non trouvé" });
    }

    res.status(200).json({
      message: "Ressources récupérées avec succès",
      resources: chapter.resources,
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des ressources:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des ressources",
      error: error.message,
    });
  }
};

const deleteResourceFromChapter = async (req, res) => {
  try {
    const { courseId, chapterId, resourceId } = req.params;

    // Vérifier si le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }

    // Vérifier si le chapitre existe
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Chapitre non trouvé" });
    }

    // Vérifier si la ressource existe dans le chapitre
    const resourceIndex = chapter.resources.findIndex(resource => resource.toString() === resourceId);
    if (resourceIndex === -1) {
      return res.status(404).json({ message: "Ressource non trouvée dans ce chapitre" });
    }

    // Supprimer la ressource de la liste des ressources du chapitre
    chapter.resources.splice(resourceIndex, 1);
    await chapter.save();

    // Supprimer la ressource de la base de données
    await ressource.findByIdAndDelete(resourceId);

    res.status(200).json({ message: "Ressource supprimée avec succès du chapitre" });
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


module.exports = {
  addChapterToCourse,
  getAllChaptersForCourse,
  deleteChapterFromCourse,
  updateChapter,
  Addressourcetochapitre,
  Getressourcechapitre,
  deleteResourceFromChapter
};