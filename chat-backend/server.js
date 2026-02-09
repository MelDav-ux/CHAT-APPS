/*
  server.js — Entrée du backend
  - Démarre Express et Socket.IO
  - Gère la connexion à MongoDB
  - Authentifie les sockets via JWT
*/
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth"); // Vérifie que ce fichier existe bien
const roomsRoutes = require("./routes/rooms");
const ChatRoom = require("./models/ChatRoom");
const Message = require("./models/Message");

// Charger les variables d'environnement
dotenv.config();

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(" MongoDB connecté"))
    .catch(err => console.error(" Erreur MongoDB:", err.message));

// Initialisation Express et Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // autorise toutes les origines (à sécuriser plus tard)
        methods: ["GET", "POST"]
    }
});

// Middleware Socket.IO — vérifie le JWT fourni lors du handshake et attache `socket.user`
io.use((socket, next) => {
    const auth = socket.handshake.auth || {};
    let token = auth.token || socket.handshake.headers?.authorization;

    if (!token) return next(new Error("Authentication error"));

    if (typeof token === "string" && token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // expose user info sur le socket
        next();
    } catch (err) {
        next(new Error("Authentication error"));
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// rendre l'instance io accessible depuis les routes (pour notifier les clients)
app.set('io', io);

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);

app.get("/", (req, res) => {
    res.send(" Backend du chat-app fonctionne !");
});

// Middleware global de gestion des erreurs (log + réponse JSON claire)
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: err?.message || 'Erreur serveur' });
});

// Socket.IO pour la messagerie en temps réel
io.on("connection", (socket) => {
    console.log("🔌 Nouvel utilisateur connecté :", socket.id);

    // Helper: broadcast la liste de salons et comptes
    const broadcastRoomsUpdate = async () => {
        try {
            const rooms = await ChatRoom.find().select('name slug members');
            // Important : on renvoie aussi la liste des membres (IDs) pour que le frontend puisse filtrer "Mes salons"
            const payload = rooms.map(r => ({
                id: r._id,
                name: r.name,
                slug: r.slug,
                membersCount: r.members.length,
                members: r.members // Array d'ObjectIds
            }));
            io.emit('rooms:update', payload);
        } catch (err) {
            console.error('Broadcast rooms update error:', err);
        }
    };

    // Helper: envoie la liste des utilisateurs présents dans une salle
    const emitRoomUsers = async (roomSlug) => {
        try {
            const room = await ChatRoom.findOne({ slug: roomSlug }).populate('members', 'username email');
            if (!room) return;
            const users = room.members.map(u => ({ id: u._id, username: u.username, email: u.email }));
            io.to(roomSlug).emit('room:users', { slug: roomSlug, users });
        } catch (err) {
            console.error('Emit room users error:', err);
        }
    };

    // Rejoindre une salle: met à jour la DB, join le socket, notifie et envoie l'historique
    socket.on('joinRoom', async (roomSlug) => {
        try {
            const room = await ChatRoom.findOne({ slug: roomSlug });
            if (!room) {
                socket.emit('error', { message: 'Salon introuvable' });
                return;
            }

            // ajouter le membre si pas présent
            if (!room.members.map(m => m.toString()).includes(socket.user.id)) {
                room.members.push(socket.user.id);
                await room.save();
            }

            socket.join(roomSlug);
            console.log(`Utilisateur ${socket.user.email || socket.user.id} (${socket.id}) a rejoint ${roomSlug}`);

            // Envoyer l'historique des messages (les 50 derniers)
            const history = await Message.find({ room: roomSlug })
                .sort({ createdAt: -1 })
                .limit(50);
            // On renvoie dans l'ordre chronologique
            socket.emit('room:history', history.reverse());

            await emitRoomUsers(roomSlug);
            await broadcastRoomsUpdate();
        } catch (err) {
            console.error('joinRoom handler error:', err);
            socket.emit('error', { message: 'Erreur lors du join du salon' });
        }
    });

    // Quitter une salle
    socket.on('leaveRoom', async (roomSlug) => {
        try {
            const room = await ChatRoom.findOne({ slug: roomSlug });
            if (!room) return;

            room.members = room.members.filter(m => m.toString() !== socket.user.id);
            await room.save();

            socket.leave(roomSlug);
            console.log(`Utilisateur ${socket.user.email || socket.user.id} (${socket.id}) a quitté ${roomSlug}`);

            await emitRoomUsers(roomSlug);
            await broadcastRoomsUpdate();
        } catch (err) {
            console.error('leaveRoom handler error:', err);
            socket.emit('error', { message: 'Erreur lors du leave du salon' });
        }
    });

    // Indiquer que l'utilisateur est en train de saisir dans un salon
    socket.on('typing', ({ roomSlug, typing }) => {
        try {
            io.to(roomSlug).emit('room:typing', { slug: roomSlug, user: socket.user ? { id: socket.user.id, email: socket.user.email, username: socket.user.username } : null, typing });
        } catch (err) {
            console.error('typing handler error:', err);
        }
    });

    socket.on("chatMessage", async (msg) => {
        try {
            const user = {
                id: socket.user.id,
                email: socket.user.email,
                username: socket.user.username
            };

            const newMessage = new Message({
                room: msg.room,
                text: msg.text,
                user: user,
                createdAt: new Date()
            });

            const savedMessage = await newMessage.save();

            // Attacher le tempId pour le client qui l'a envoyé (confirmation)
            const messageToSend = savedMessage.toObject();
            if (msg.tempId) messageToSend.tempId = msg.tempId;

            io.to(msg.room).emit("message", messageToSend);
        } catch (err) {
            console.error("Erreur lors de l'envoi du message:", err);
        }
    });

    socket.on("disconnect", async () => {
        console.log(" Utilisateur déconnecté :", socket.id);
        try {
            // Retirer l'utilisateur de toutes les salles où il figurait
            await ChatRoom.updateMany({ members: socket.user.id }, { $pull: { members: socket.user.id } });
            // Pour chaque salle, notifier la liste d'utilisateurs mise à jour
            const rooms = await ChatRoom.find({}).select('slug members');
            for (const r of rooms) {
                await emitRoomUsers(r.slug);
            }
            await broadcastRoomsUpdate();
        } catch (err) {
            console.error('Disconnect cleanup error:', err);
        }
    });
});

// Lancer le serveur — écoute sur 0.0.0.0 pour accepter les connexions locales et réseau
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    const addr = server.address();
    // addr.address peut être '0.0.0.0' ou une IP spécifique
    console.log(` Serveur lancé sur http://${addr.address === '0.0.0.0' ? 'localhost' : addr.address}:${addr.port}`);
    console.log(' Détails listen:', addr);
});
