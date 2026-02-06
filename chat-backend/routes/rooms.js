const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');

// GET /api/rooms - liste des salons
router.get('/', async (req, res) => {
    try {
        const rooms = await ChatRoom.find().select('name slug createdBy members createdAt').populate('createdBy', 'username');
        // envoyer aussi le nombre de membres
        const payload = rooms.map(r => ({ id: r._id, name: r.name, slug: r.slug, createdBy: r.createdBy, membersCount: r.members.length, createdAt: r.createdAt }));
        res.json(payload);
    } catch (err) {
        console.error('Get rooms error:', err);
        res.status(500).json({ message: err.message || 'Erreur serveur' });
    }
});

// POST /api/rooms - créer un salon (protégé)
router.post('/', protect, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Le nom du salon est requis' });

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
        let exists = await ChatRoom.findOne({ slug });
        if (exists) return res.status(400).json({ message: 'Un salon avec ce nom existe déjà' });

        const room = await ChatRoom.create({ name, slug, createdBy: req.user.id, members: [req.user.id] });
        // notifier tous les clients via Socket.IO
        const io = req.app.get('io');
        try {
            const rooms = await ChatRoom.find().select('name slug members');
            const payload = rooms.map(r => ({ id: r._id, name: r.name, slug: r.slug, membersCount: r.members.length }));
            io && io.emit('rooms:update', payload);
        } catch (e) {
            console.error('rooms update after create error:', e);
        }

        res.status(201).json({ id: room._id, name: room.name, slug: room.slug, membersCount: room.members.length });
    } catch (err) {
        console.error('Create room error:', err);
        res.status(500).json({ message: err.message || 'Erreur serveur' });
    }
});

// POST /api/rooms/:id/join - rejoindre un salon (protégé)
router.post('/:id/join', protect, async (req, res) => {
    try {
        const room = await ChatRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Salon non trouvé' });

        if (!room.members.includes(req.user.id)) {
            room.members.push(req.user.id);
            await room.save();
        }

        // notifier via Socket.IO
        try {
            const io = req.app.get('io');
            const populated = await ChatRoom.findById(room._id).populate('members', 'username email');
            const users = populated.members.map(u => ({ id: u._id, username: u.username, email: u.email }));
            io && io.to(room.slug).emit('room:users', { slug: room.slug, users });

            const rooms = await ChatRoom.find().select('name slug members');
            const payload = rooms.map(r => ({ id: r._id, name: r.name, slug: r.slug, membersCount: r.members.length }));
            io && io.emit('rooms:update', payload);
        } catch (e) {
            console.error('rooms update after join error:', e);
        }

        res.json({ message: 'Rejoint', id: room._id, membersCount: room.members.length });
    } catch (err) {
        console.error('Join room error:', err);
        res.status(500).json({ message: err.message || 'Erreur serveur' });
    }
});

// POST /api/rooms/:id/leave - quitter un salon (protégé)
router.post('/:id/leave', protect, async (req, res) => {
    try {
        const room = await ChatRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Salon non trouvé' });

        room.members = room.members.filter(m => m.toString() !== req.user.id);
        await room.save();

        // notifier via Socket.IO
        try {
            const io = req.app.get('io');
            const populated = await ChatRoom.findById(room._id).populate('members', 'username email');
            const users = populated.members.map(u => ({ id: u._id, username: u.username, email: u.email }));
            io && io.to(room.slug).emit('room:users', { slug: room.slug, users });

            const rooms = await ChatRoom.find().select('name slug members');
            const payload = rooms.map(r => ({ id: r._id, name: r.name, slug: r.slug, membersCount: r.members.length }));
            io && io.emit('rooms:update', payload);
        } catch (e) {
            console.error('rooms update after leave error:', e);
        }

        res.json({ message: 'Quitte', id: room._id, membersCount: room.members.length });
    } catch (err) {
        console.error('Leave room error:', err);
        res.status(500).json({ message: err.message || 'Erreur serveur' });
    }
});

module.exports = router;
