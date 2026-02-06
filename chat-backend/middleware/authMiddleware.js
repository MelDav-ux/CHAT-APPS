/*
  middleware/authMiddleware.js — protège les routes HTTP
  - Supporte Authorization: "Bearer <token>" ou un token brut
  - Si le token est OK, ajoute `req.user` et appelle next()
*/
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token;

    if (!authHeader) {
        return res.status(401).json({ message: "Pas de token, accès refusé" });
    }

    // Supporte les deux formats: "Bearer <token>" ou juste "<token>"
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else {
        token = authHeader;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // contient { id, email }
        next();
    } catch (err) {
        res.status(401).json({ message: "Token invalide ou expiré" });
    }
};

module.exports = protect;
