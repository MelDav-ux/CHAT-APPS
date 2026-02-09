import React from "react";
import CreateChatRoomForm from './CreateChatRoomForm';
import { useNavigate } from "react-router-dom";

function RoomList({ rooms, currentRoom, currentUser, onJoin, onLogout, onRefresh }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h3>Salons</h3>
                <div>
                    <button onClick={onRefresh} className="btn" title="Rafraîchir">↻</button>
                </div>
            </div>

            <div className="sidebar-create">
                <CreateChatRoomForm onCreated={onRefresh} />
            </div>

            <ul className="rooms-list">
                {currentUser && rooms.some(r => r.members?.includes(currentUser._id)) && (
                    <>
                        <div className="rooms-section-title">Mes salons</div>
                        {rooms.filter(r => r.members?.includes(currentUser._id)).map(r => (
                            <li key={r.slug} className={`room-item ${currentRoom === r.slug ? 'active' : ''}`} onClick={() => onJoin(r.slug)}>
                                <div className="room-title">{r.name}</div>
                                <div className="room-meta">{r.membersCount} participants</div>
                            </li>
                        ))}
                    </>
                )}

                <div className="rooms-section-title">Autres salons</div>
                {rooms.filter(r => !currentUser || !r.members?.includes(currentUser._id)).length === 0 && <div className="empty" style={{ padding: '10px 0', fontSize: '0.8rem' }}>Aucun autre salon</div>}
                {rooms.filter(r => !currentUser || !r.members?.includes(currentUser._id)).map(r => (
                    <li key={r.slug} className={`room-item ${currentRoom === r.slug ? 'active' : ''}`} onClick={() => onJoin(r.slug)}>
                        <div className="room-title">{r.name}</div>
                        <div className="room-meta">{r.membersCount} participants</div>
                    </li>
                ))}
            </ul>

            <div className="sidebar-footer">
                <button onClick={onLogout} className="btn btn-ghost">Déconnexion</button>
            </div>
        </aside>
    );
}

export default RoomList;
