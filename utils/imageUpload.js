const cloudinary = require('../config/cloudinaryConfig');  // Assurez-vous que la config Cloudinary est correcte

// Fonction pour uploader l'image sur Cloudinary
const uploadImage = (req) => {
  return new Promise((resolve, reject) => {
    if (req.file) {
      cloudinary.uploader.upload(req.file.path, { 
        public_id: `courses/${req.file.filename}`  // ID personnalisé pour l'image
      })
      .then(uploadResult => {
        resolve(uploadResult.secure_url);  // Retourner l'URL sécurisé de l'image téléchargée
      })
      .catch(err => {
        console.error('Erreur Cloudinary:', err);
        reject({ message: 'Erreur serveur', error: err.message });
      });
    } else {
      reject({ message: 'Aucun fichier téléchargé' });
    }
  });
};


// Fonction pour uploader l'image sur Cloudinary
const uploadImageusers = (req) => {
  return new Promise((resolve, reject) => {
    if (req.file) {
      cloudinary.uploader.upload(req.file.path, { 
        public_id: `users/${req.file.filename}`  // ID personnalisé pour l'image
      })
      .then(uploadResult => {
        resolve(uploadResult.secure_url);  // Retourner l'URL sécurisé de l'image téléchargée
      })
      .catch(err => {
        console.error('Erreur Cloudinary:', err);
        reject({ message: 'Erreur serveur', error: err.message });
      });
    } else {
      reject({ message: 'Aucun fichier téléchargé' });
    }
  });
};


module.exports = { uploadImage ,uploadImageusers};  // Vérifiez que cette ligne est présente pour exporter la fonction
