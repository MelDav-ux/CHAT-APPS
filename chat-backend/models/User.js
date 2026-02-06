/*
  models/User.js — Schéma utilisateur Mongoose
  - Hachage du mot de passe avant sauvegarde
  - Méthode `matchPassword` pour vérifier le mot de passe
*/
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    // stocker l'email en minuscule et sans espaces pour éviter les erreurs de lookup
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }
});

// Normaliser l'email et hacher le mot de passe avant sauvegarde
UserSchema.pre("save", async function () {
    if (this.isModified('email')) {
        this.email = this.email.trim().toLowerCase();
    }

    if (!this.isModified("password")) return; // si pas modifié, on passe
    const salt = await bcrypt.genSalt(10); // génère un "sel"
    this.password = await bcrypt.hash(this.password, salt); // hachage
    return;
});

// Méthode pour comparer le mot de passe
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
