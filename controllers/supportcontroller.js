const Support = require('../models/support');
const User = require('../models/user');
const sendEmail = require('./emailcontroller');

// Créer un nouveau message de support
exports.createSupportMessage = async (req, res) => {
  console.log("hello",req.body);
  try {
    const { name, email, subject, message } = req.body;
    const userId = req.user.id; // Récupéré du middleware d'authentification

    const supportMessage = new Support({
      userId,
      name,
      email,
      subject,
      message
    });

    await supportMessage.save();

    res.status(201).json({
      success: true,
      message: 'Message de support envoyé avec succès',
      data: supportMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message',
      error: error.message
    });
  }
};

// Récupérer tous les messages de support (admin)
exports.getAllSupportMessages = async (req, res) => {
  try {
    const messages = await Support.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages',
      error: error.message
    });
  }
};

// Récupérer les messages d'un utilisateur spécifique
exports.getUserSupportMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await Support.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages',
      error: error.message
    });
  }
};

// Mettre à jour le statut d'un message (admin)
exports.updateSupportMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status, adminResponse } = req.body;

    const message = await Support.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    message.status = status;
    if (adminResponse) {
      message.adminResponse = adminResponse;
    }
    message.updatedAt = Date.now();

    await message.save();

    // Envoyer l'email à l'utilisateur
    const emailSubject = `Réponse à votre message de support - ${message.subject}`;
    const emailHtml = `
      <h2>Bonjour ${message.name},</h2>
      <p>Nous avons reçu votre message concernant "${message.subject}".</p>
      <p>Voici notre réponse :</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        ${adminResponse}
      </div>
      <p>Statut de votre demande : ${status === 'resolved' ? 'Résolu' : status === 'in_progress' ? 'En cours' : 'En attente'}</p>
      <p>Si vous avez d'autres questions, n'hésitez pas à nous contacter.</p>
      <p>Cordialement,<br>L'équipe SpaceRoom</p>
    `;

    await sendEmail({
      from: "houssemnaffouti28@gmail.com",
      to: message.email,
      subject: emailSubject,
      text: adminResponse,
      html: emailHtml
    });

    res.status(200).json({
      success: true,
      message: 'Statut du message mis à jour avec succès et email envoyé',
      data: message
    });
  } catch (error) {
    console.error('Error in updateSupportMessageStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

// Supprimer un message de support (admin)
exports.deleteSupportMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Support.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    await message.remove();

    res.status(200).json({
      success: true,
      message: 'Message supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du message',
      error: error.message
    });
  }
};
