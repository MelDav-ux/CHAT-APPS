import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client"; //  import correct
import "../styles/ChatRoom.css";
import { useNavigate } from "react-router-dom";

function ChatRoom() {
    const [room] = useState("general");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const navigate = useNavigate();
    const socketRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const s = io("http://localhost:5000", { auth: { token } });
        socketRef.current = s;

        s.emit("joinRoom", room);

        s.on("message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        s.on("connect_error", (err) => {
            // si authentification échoue, rediriger
            if (err && err.message === "Authentication error") {
                localStorage.removeItem("token");
                navigate("/login");
            }
        });

        return () => {
            s.off("message");
            s.disconnect();
        };
    }, [room, navigate]);

    const sendMessage = () => {
        if (message.trim() && socketRef.current) {
            socketRef.current.emit("chatMessage", { room, text: message });
            setMessage("");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        if (socketRef.current) socketRef.current.disconnect();
        navigate("/login");
    };

    return (
        <div className="chat-container">
            <div className="chat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>Salle : {room}</h2>
                    <button onClick={handleLogout} style={{ padding: "6px 10px" }}>Déconnexion</button>
                </div>
                <div className="messages">
                    {messages.map((msg, i) => (
                        <p key={i}><strong>{msg.user ? msg.user + ': ' : ''}</strong>{msg.text}</p>
                    ))}
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        placeholder="Écrire un message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button onClick={sendMessage}>Envoyer</button>
                </div>
            </div>
        </div>
    );
}

export default ChatRoom;
