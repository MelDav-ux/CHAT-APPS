import React from "react";

function RoomDetails({ room, users }) {
    if (!room) return null;

    return (
        <aside className="right-column">
            <div className="room-details-header">
                <h3>Détails du salon</h3>
            </div>

            <div className="room-info-card">
                <div className="room-avatar-large">
                    {(room.name || '#').substring(0, 2).toUpperCase()}
                </div>
                <div className="room-name-large">{room.name}</div>
                <div className="room-status-badge">
                    <span className="status-dot"></span> Ouvert
                </div>
            </div>

            <div className="participants-section">
                <h4>Participants — {users.length}</h4>
                <ul className="participants-list-scroll">
                    {users.map(u => (
                        <li key={u.id || u._id} className="participant-item">
                            <div className="avatar-wrapper">
                                <div className="avatar">{(u.username || u.email)[0]?.toUpperCase()}</div>
                                <div className={`status-badge ${u.online ? 'online' : 'offline'}`}></div>
                            </div>
                            <div className="participant-info">
                                <div className="participant-name">{u.username || u.email}</div>
                                <div className="participant-email">{u.email}</div>
                            </div>
                        </li>
                    ))}
                    {users.length === 0 && <div className="muted" style={{ padding: '0 12px' }}>Aucun participant actif</div>}
                </ul>
            </div>
        </aside>
    );
}

export default RoomDetails;
