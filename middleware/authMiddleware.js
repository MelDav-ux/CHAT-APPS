const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Pas de token, accès refusé" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // contient { id, email }
        next();
    } catch (err) {
        res.status(401).json({ message: "Token invalide" });
    }
};

module.exports = protect;
