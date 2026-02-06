/*
  src/components/Profile.jsx — Page profil utilisateur
  - Récupère les infos via /api/auth/me et affiche le profil
*/
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const res = await axios.get("http://localhost:5000/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(res.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Erreur lors de la récupération du profil");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    if (loading) return <p>Chargement...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: 20 }}>
            <h2>Mon profil</h2>
            <p><strong>Nom :</strong> {user.username}</p>
            <p><strong>Email :</strong> {user.email}</p>
            <button onClick={handleLogout}>Déconnexion</button>
        </div>
    );
}

export default Profile;
