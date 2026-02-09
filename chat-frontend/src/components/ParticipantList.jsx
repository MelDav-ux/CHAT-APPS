import React from "react";

function ParticipantList({ users }) {
    return (
        <aside className="right-column">
            <div className="participants">
                <h4>Participants</h4>
                {users.length === 0 && <div className="muted">Aucun participant</div>}
                <ul>
                    {users.map(u => (
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
    );
}

export default ParticipantList;
