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
import MessageForm from './MessageForm';
import RoomList from './RoomList';
import RoomDetails from './RoomDetails';
import { useToast } from './ToastContext';

function ChatRoom() {
    const [currentRoom, setCurrentRoom] = useState(null);
    // const [message, setMessage] = useState(""); // géré dans MessageForm désormais
    const [messages, setMessages] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { showToast } = useToast();

    // Use ref to access current state inside socket listeners without re-running effect
    const currentRoomRef = useRef(currentRoom);
    useEffect(() => {
        currentRoomRef.current = currentRoom;
    }, [currentRoom]);

    useEffect(() => {
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
        if (!token) {
            navigate("/login");
            return;
        }

        const s = io("http://localhost:5000", { auth: { token } });
        socketRef.current = s;

        s.on('rooms:update', (payload) => {
            setRooms(payload);
        });

        s.on('room:history', (history) => {
            setMessages(history);
        });

        s.on('room:users', ({ slug, users }) => {
            if (currentRoomRef.current && currentRoomRef.current === slug) {
                setUsersInRoom(users);
            }
        });

        s.on('room:typing', ({ slug, user, typing }) => {
            if (currentRoomRef.current && currentRoomRef.current === slug) {
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
                if (msg.tempId) {
                    const replaced = prev.map(m => (m.tempId === msg.tempId ? { ...msg } : m));
                    const found = prev.some(m => m.tempId === msg.tempId);
                    return found ? replaced : [...replaced, msg];
                }
                return [...prev, msg];
            });
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
            s.off('room:typing');
            s.off('room:history');
            s.disconnect();
        };
    }, [navigate]); // Removed currentRoom dependency to prevent reconnection loops

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

    const handleTyping = (isTyping) => {
        if (!socketRef.current || !currentRoom) return;
        // Si isTyping est explicitement false (envoi de message), on envoie false direct
        if (isTyping === false) {
            socketRef.current.emit('typing', { roomSlug: currentRoom, typing: false });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            return;
        }

        // Sinon, c'est que ça tape
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

    const sendMessage = (text) => {
        if (!currentRoom) return showToast('Rejoignez un salon pour envoyer un message', { type: 'error' });
        if (socketRef.current) {
            socketRef.current.emit("chatMessage", { room: currentRoom, text: text });
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


    const [showSidebar, setShowSidebar] = useState(false); // Mobile sidebar toggle

    // Find full room object for details
    const currentRoomData = rooms.find(r => r.slug === currentRoom) || { name: currentRoom || '...', slug: currentRoom };

    return (
        <div className="chat-shell">
            {/* Mobile Menu Button - visible only on small screens via CSS */}
            <div className="mobile-header-bar">
                <button className="btn btn-ghost btn-menu" onClick={() => setShowSidebar(!showSidebar)}>
                    {showSidebar ? '✕' : '☰'} Salons
                </button>
                <div className="mobile-title">{currentRoom ? currentRoom : 'Chat'}</div>
            </div>

            <div className={`sidebar-wrapper ${showSidebar ? 'mobile-visible' : ''}`}>
                <RoomList
                    rooms={rooms}
                    currentRoom={currentRoom}
                    currentUser={currentUser}
                    onJoin={(slug) => {
                        joinRoom(slug);
                        setShowSidebar(false); // Close sidebar on selection/mobile
                    }}
                    onLogout={handleLogout}
                    onRefresh={refreshRooms}
                />
                {/* Overlay for mobile to close sidebar when clicking outside */}
                {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}></div>}
            </div>

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
                        // user peut être un objet (backend nouveau) ou string (ancien/compatibilité)
                        // On normalise le nom à afficher :
                        const msgUser = typeof msg.user === 'object' ? (msg.user.username || msg.user.email) : msg.user;
                        const prevUser = prev ? (typeof prev.user === 'object' ? (prev.user.username || prev.user.email) : prev.user) : null;

                        // Vérification robuste pour savoir si c'est moi (comparaison ID prioritaire)
                        const msgUserId = typeof msg.user === 'object' ? (msg.user.id || msg.user._id) : null;
                        const currentUserId = currentUser ? currentUser._id : null;

                        // Si on a les IDs, on compare les IDs. Sinon fallback sur le nom/email (compatibilité vieux messages)
                        const me = (msgUserId && currentUserId)
                            ? (msgUserId === currentUserId)
                            : (currentUser && msgUser === (currentUser.username || currentUser.email));

                        const isFirstOfGroup = !prev || prevUser !== msgUser || (new Date(msg.createdAt) - new Date(prev.createdAt) > 1000 * 60 * 2);

                        return (
                            <div key={i} className={`message-row ${me ? 'me' : 'other'} ${isFirstOfGroup ? 'first' : ''}`}>
                                {!me && (
                                    <div className="message-avatar-placeholder">
                                        {isFirstOfGroup ? (
                                            <div className="avatar-small">{(msgUser || '?')[0].toUpperCase()}</div>
                                        ) : <div className="avatar-spacer" />}
                                    </div>
                                )}

                                <div className="message-content">
                                    {isFirstOfGroup && !me && <div className="message-sender">{msgUser}</div>}

                                    <div className={`message-bubble ${me ? 'mine' : 'theirs'} ${isFirstOfGroup ? 'bubble-first' : ''}`}>
                                        <div className="message-text">{msg.text}</div>
                                        <div className="message-timestamp">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {Object.keys(typingUsers).length > 0 && (
                        <div className="typing-indicator">{Object.keys(typingUsers).join(', ')} est en train d'écrire...</div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <MessageForm
                    onSendMessage={sendMessage}
                    onTyping={(isTyping) => handleTyping(isTyping)}
                    disabled={!currentRoom}
                    placeholder={currentRoom ? 'Écrire un message...' : 'Rejoignez un salon pour écrire...'}
                />
            </main>


            {currentRoom && <RoomDetails room={currentRoomData} users={usersInRoom} />}
        </div>
    );
}

export default ChatRoom;
