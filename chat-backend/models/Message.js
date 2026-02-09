const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    room: { type: String, required: true }, // Stocker le slug du salon pour simplifier les requêtes
    user: { type: Object, required: true }, // Stocker les infos de l'utilisateur (id, username, email) au moment de l'envoi
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
