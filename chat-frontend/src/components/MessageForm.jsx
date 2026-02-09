import React, { useState } from 'react';
import '../styles/ChatRoom.css'; // On réutilise les styles existants pour l'instant

function MessageForm({ onSendMessage, onTyping, disabled, placeholder }) {
    const [text, setText] = useState("");

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (text.trim() && !disabled) {
            onSendMessage(text);
            setText("");
            // Stop typing immediately on send
            onTyping(false);
        }
    };

    const handleChange = (e) => {
        setText(e.target.value);
        if (onTyping) onTyping(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="message-composer">
            <textarea
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || "Écrire un message..."}
                disabled={disabled}
            />
            <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={disabled || !text.trim()}
            >
                Envoyer
            </button>
        </div>
    );
}

export default MessageForm;
