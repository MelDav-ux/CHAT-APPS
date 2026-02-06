/*
  src/components/ChatRoom.jsx — Salle de chat principale
  - Se connecte à Socket.IO avec le token JWT pour l'auth
  - Émet/écoute les messages en temps réel
*/
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client"; // import de Socket.IO client
import "../styles/ChatRoom.css";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import CreateChatRoomForm from './CreateChatRoomForm';
import { useToast } from './ToastContext';

function ChatRoom() {
    const [currentRoom, setCurrentRoom] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [search, setSearch] = useState('');
    const [lastMessages, setLastMessages] = useState({});    const navigate = useNavigate();
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { showToast } = useToast();

    useEffect(() => {
        // Charger la liste des salons et l'utilisateur courant
        const fetchInitial = async () => {
            try {
                const [roomsRes, meRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/rooms'),
                    axios.get('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
                ]);
                setRooms(roomsRes.data);
                setCurrentUser(meRes.data);
            } catch (err) {
                console.error('Init fetch error:', err);
            }
        };

        fetchInitial();

        const token = localStorage.getItem("token");
        const s = io("http://localhost:5000", { auth: { token } });
        socketRef.current = s;

        s.on('rooms:update', (payload) => {
            setRooms(payload);
        });

        s.on('room:users', ({ slug, users }) => {
            if (currentRoom && currentRoom === slug) setUsersInRoom(users);
        });

        s.on('room:typing', ({ slug, user, typing }) => {
            if (currentRoom && currentRoom === slug) {
                setTypingUsers(prev => {
                    const next = { ...prev };
                    if (typing) next[user.username || user.email] = true;
                    else delete next[user.username || user.email];
                    return next;
                });
            }
        });

        s.on("message", (msg) => {
            setMessages((prev) => {
                // si message echo d'un envoi local (tempId), remplacer le temporaire
                if (msg.tempId) {
                    const replaced = prev.map(m => (m.tempId === msg.tempId ? { ...msg } : m));
                    // si pas trouvé, l'ajouter
                    const found = prev.some(m => m.tempId === msg.tempId);
                    return found ? replaced : [...replaced, msg];
                }
                // sinon ajouter normalement
                return [...prev, msg];
            });

            // mettre à jour aperçu dernier message pour le salon
            setLastMessages(lm => ({ ...lm, [msg.room]: { text: msg.text, time: msg.createdAt } }));
        });

        s.on("connect_error", (err) => {
            if (err && err.message === "Authentication error") {
                localStorage.removeItem("token");
                navigate("/login");
            }
        });

        return () => {
            s.off("message");
            s.off('rooms:update');
            s.off('room:users');
            s.disconnect();
        };
    }, [navigate, currentRoom]);

    useEffect(() => {
        // faire défiler vers le bas à chaque nouveau message
        if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const joinRoom = (slug) => {
        if (!socketRef.current) return;
        socketRef.current.emit('joinRoom', slug);
        setCurrentRoom(slug);
        showToast(`Rejoint ${slug}`, { type: 'success' });
        setMessages([]);
        setTypingUsers({});
    };

    // Indique que l'utilisateur tape, envoie des events typing au serveur
    const typingTimeoutRef = useRef(null);
    const [typingUsers, setTypingUsers] = useState({});

    const handleTyping = () => {
        if (!socketRef.current || !currentRoom) return;
        socketRef.current.emit('typing', { roomSlug: currentRoom, typing: true });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current.emit('typing', { roomSlug: currentRoom, typing: false });
        }, 1200);
    };

    const leaveRoom = (slug) => {
        if (!socketRef.current) return;
        socketRef.current.emit('leaveRoom', slug);
        if (currentRoom === slug) setCurrentRoom(null);
        setUsersInRoom([]);
        showToast(`Vous avez quitté ${slug}`, { type: 'info' });
    };

    const sendMessage = () => {
        if (!currentRoom) return showToast('Rejoignez un salon pour envoyer un message', { type: 'error' });
        if (message.trim() && socketRef.current) {
            socketRef.current.emit("chatMessage", { room: currentRoom, text: message });
            setMessage("");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        if (socketRef.current) socketRef.current.disconnect();
        navigate("/login");
    };

    const refreshRooms = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/rooms');
            setRooms(res.data);
        } catch (err) {
            console.error('Fetch rooms error:', err);
        }
    };

    return (
        <div className="chat-shell">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h3>Salons</h3>
                    <div>
                        <button onClick={refreshRooms} className="btn">↻</button>
                    </div>
                </div>

                <div className="sidebar-create">
                    <CreateChatRoomForm onCreated={refreshRooms} />
                </div>

                <ul className="rooms-list">
                    {rooms.map(r => (
                        <li key={r.slug} className={`room-item ${currentRoom === r.slug ? 'active' : ''}`} onClick={() => joinRoom(r.slug)}>
                            <div className="room-title">{r.name}</div>
                            <div className="room-meta">{r.membersCount} participants</div>
                        </li>
                    ))}
                </ul>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="btn btn-ghost">Déconnexion</button>
                </div>
            </aside>

            <main className="main-column">
                <div className="chat-header">
                    <div>
                        <h2 className="chat-title">{currentRoom ? `# ${currentRoom}` : 'Sélectionnez un salon'}</h2>
                        <div className="chat-sub">{currentRoom ? `${usersInRoom.length} participants` : 'Aucun salon sélectionné'}</div>
                    </div>
                    <div className="chat-actions">
                        {currentRoom && <button className="btn btn-ghost" onClick={() => leaveRoom(currentRoom)}>Quitter</button>}
                    </div>
                </div>

                <div className="messages-panel">
                    {messages.length === 0 && <div className="empty">Aucun message — commencez la conversation</div>}

                    {messages.map((msg, i) => {
                        const prev = messages[i - 1];
                        const isFirstOfGroup = !prev || prev.user !== msg.user || (new Date(msg.createdAt) - new Date(prev.createdAt) > 1000 * 60 * 2);
                        const me = currentUser && (msg.user === (currentUser.username || currentUser.email));

                        return (
                            <div key={i} className={`message ${me ? 'mine' : ''} ${isFirstOfGroup ? 'group-first' : 'group-cont'}`}>
                                {isFirstOfGroup && (
                                    <div className="message-meta">
                                        <div className="message-author">{msg.user || 'Anonyme'}</div>
                                        <div className="message-time">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    </div>
                                )}
                                <div className="message-body">{msg.text}</div>
                            </div>
                        );
                    })}

                    {Object.keys(typingUsers).length > 0 && (
                        <div className="typing-indicator">{Object.keys(typingUsers).join(', ')} est en train d'écrire...</div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="message-composer">
                    <textarea value={message} onChange={(e) => { setMessage(e.target.value); handleTyping(); }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={currentRoom ? 'Écrire un message...' : 'Rejoignez un salon pour écrire...'} />
                    <button className="btn btn-primary" onClick={sendMessage} disabled={!currentRoom || !message.trim()}>Envoyer</button>
                </div>
            </main>

            <aside className="right-column">
                <div className="participants">
                    <h4>Participants</h4>
                    {usersInRoom.length === 0 && <div className="muted">Aucun participant</div>}
                    <ul>
                        {usersInRoom.map(u => (
                            <li key={u.id} className="participant-item">
                                <div className="avatar">{(u.username || u.email)[0]?.toUpperCase()}</div>
                                <div className="participant-info">
                                    <div className="participant-name">{u.username || u.email}</div>
                                    <div className="participant-email">{u.email}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>
        </div>
    );
}

export default ChatRoom;
