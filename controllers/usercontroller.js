const user = require("../models/user");
const User = require("../models/user");
const { uploadImageusers } = require("../utils/imageUpload");

// Récupérer un utilisateur par ID
exports.getUserById = async (req, res) => {
    try {
        console.log("user",req.user.id);
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};


// Récupérer un utilisateur par ID
exports.getUserByIdparms = async (req, res) => {
    try {
        console.log("user",req.params);
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};
// Supprimer un utilisateur par ID
exports.deleteUserById = async (req, res) => {
    console.log("del ",req.params.id);
    try {
        const user1 = await user.findByIdAndDelete(req.params.id);
        console.log("use del ",user1);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        res.status(200).json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};
// Modifier un utilisateur par ID
exports.updateUserById = async (req, res) => {

    try {
        let updateData = req.body;
                console.log("req id",req.params.id,"body",updateData);

        // Si un fichier a été uploadé, ajoutez l'URL de l'image aux données à mettre à jour
        if (req.file) {
            try {
                const imageUrl = await uploadImageusers(req);
                updateData = { ...updateData, imageurl: imageUrl };
            } catch (uploadError) {
                return res.status(400).json({ message: "Erreur lors de l'upload de l'image", error: uploadError });
            }
        }

        // Notez l'utilisation de User (majuscule) au lieu de user (minuscule)
        console.log("req id",req.params.id,"body",updateData);
        const user = await User.findByIdAndUpdate(req.params.id, updateData, { 
            new: true, 
            runValidators: true 
        });
        
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};