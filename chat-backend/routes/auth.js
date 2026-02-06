/*
  routes/auth.js — Routes d'authentification
  - POST /register : créer un utilisateur et renvoyer un token JWT
  - POST /login : authentifier et renvoyer un token
  - GET /me : renvoyer les infos de l'utilisateur (route protégée)
*/
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

// aide pour échapper les caractères spéciaux dans les regex
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* Route: POST /api/auth/register — crée un utilisateur et renvoie un JWT */
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    const emailLc = email && email.trim().toLowerCase();

    console.log('Register attempt for:', emailLc);

    try {
        const userExists = await User.findOne({ email: emailLc });
        if (userExists) return res.status(400).json({ message: "Utilisateur déjà existant" });

        const user = await User.create({ username, email: emailLc, password });

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: err.message || "Erreur serveur" });
    }
});

/* Route: POST /api/auth/login — vérifie identifiants et renvoie un JWT */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const emailLc = email && email.trim().toLowerCase();

    // DEBUG: log tentative de connexion (n'inclut pas le mot de passe)
    console.log('Login attempt for:', emailLc);

    try {
        // recherche normale (après normalisation)
        let user = await User.findOne({ email: emailLc });
        // fallback insensible à la casse pour les comptes existants
        if (!user) {
            const regex = new RegExp('^' + escapeRegex(emailLc) + '$', 'i');
            user = await User.findOne({ email: { $regex: regex } });
        }

        if (!user) {
            console.warn('Login failed: utilisateur introuvable pour', emailLc);
            return res.status(400).json({ message: "Utilisateur introuvable" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.warn('Login failed: mot de passe incorrect pour', user._id);
            return res.status(400).json({ message: "Mot de passe incorrect" });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // DEBUG: connexion réussie
        console.log('Login success for:', user.email);

        res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: err.message || "Erreur serveur" });
    }
});

// Route de santé simple pour diagnostic (ajoute un log pour le debug)
router.get('/health', (req, res) => {
    console.log('Health check received from', req.ip || req.connection?.remoteAddress);
    res.json({ ok: true, timestamp: Date.now() });
});

router.get("/me", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        console.error("Get /me error:", err);
        res.status(500).json({ message: err.message || "Erreur serveur" });
    }
});


// Déconnexion
router.post("/logout", (req, res) => {
    res.json({ message: "Déconnexion réussie. Supprimez le token côté client." });
});


module.exports = router;
