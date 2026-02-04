const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth"); // routes d'authentification

// Charger les variables d'environnement
dotenv.config();

// Connexion MongoDB (sans options obsolètes)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(" MongoDB connecté"))
    .catch(err => console.error("Erreur MongoDB:", err.message));

// Initialisation Express et Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // autorise toutes les origines (à sécuriser plus tard)
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes API
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("🚀 Backend du chat-app fonctionne !");
});

// Socket.IO pour la messagerie en temps réel
io.on("connection", (socket) => {
    console.log("Nouvel utilisateur connecté :", socket.id);

    socket.on("joinRoom", (room) => {
        socket.join(room);
        console.log(`Utilisateur ${socket.id} a rejoint la salle ${room}`);
    });

    socket.on("chatMessage", (msg) => {
        io.to(msg.room).emit("message", msg);
    });

    socket.on("disconnect", () => {
        console.log("Utilisateur déconnecté :", socket.id);
    });
});

// Lancer le serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));
