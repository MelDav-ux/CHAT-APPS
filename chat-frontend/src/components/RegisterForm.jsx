import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/RegisterForm.css"; // ✅ fichier CSS spécifique

function RegisterForm() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await axios.post("http://localhost:5000/api/auth/register", {
                username,
                email,
                password,
            });

            localStorage.setItem("token", res.data.token);
            navigate("/chat");
        } catch (err) {
            console.error("Register error:", err);
            setError(err.response?.data?.message || err.message || "Erreur d'inscription");
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="brand"><div className="logo">Chat<span>App</span></div></div>
                <h2>Créer votre compte</h2>
                <p className="lead">Commencez à discuter en quelques secondes — sécurisé et rapide.</p>
                {error && <p className="error">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nom d'utilisateur</label>
                        <input className="form-input" type="text" placeholder="Ex: johndoe" value={username}
                            onChange={(e) => setUsername(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label>Adresse email</label>
                        <input className="form-input" type="email" placeholder="email@exemple.com" value={email}
                            onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input className="form-input" type="password" placeholder="Votre mot de passe" value={password}
                            onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn-register">Créer un compte</button>
                </form>

                <p className="switch-link">Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
            </div>
        </div>
    );
}

export default RegisterForm;
