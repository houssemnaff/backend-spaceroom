const ressource = require("../models/ressource");
const Chapter = require("../models/Chapter");

// Ajouter une ressource à un chapitre
exports.addResourceToChapter = async (req, res) => {
  try {
    const { chapterId, type, url, name } = req.body;

    // Trouver le chapitre
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    // Créer une nouvelle ressource
    const resource = new resource({
      type,
      url,
      name,
    });

    await ressource.save();

    // Ajouter la ressource au chapitre
    chapter.resources.push(resource._id);
    await chapter.save();

    res.status(201).json({ message: "Resource added successfully", resource });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modifier une ressource
exports.updateResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { type, url, name } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    resource.type = type || resource.type;
    resource.url = url || resource.url;
    resource.name = name || resource.name;

    await resource.save();

    res.status(200).json({ message: "Resource updated successfully", resource });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une ressource d'un chapitre
exports.deleteResource = async (req, res) => {
  try {
    const { resourceId, chapterId } = req.params;

    // Supprimer la ressource
    const resource = await Resource.findByIdAndDelete(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Retirer la ressource du chapitre
    const chapter = await Chapter.findById(chapterId);
    chapter.resources = chapter.resources.filter(id => id.toString() !== resourceId);
    await chapter.save();

    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
