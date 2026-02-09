/*
  src/components/RegisterForm.jsx — Formulaire d'inscription
  - Crée un nouvel utilisateur et stocke le token reçu
  - Affiche des toasts pour succès/erreur
*/
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../styles/RegisterForm.css";
import { useToast } from "./ToastContext";

function RegisterForm() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Envoie du formulaire d'inscription et gestion du token
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const usernameTrim = username.trim();
        const emailTrim = email.trim().toLowerCase();
        if (!usernameTrim) return setError('Nom d\'utilisateur requis');
        if (!emailTrim) return setError('Adresse email requise');
        if (!password || password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères');

        setLoading(true);

        try {
            const res = await axios.post("http://localhost:5000/api/auth/register", {
                username: usernameTrim,
                email: emailTrim,
                password,
            });

            if (!res?.data?.token) throw new Error('Aucun token renvoyé par le serveur');

            localStorage.setItem("token", res.data.token);
            showToast('Inscription réussie', { type: 'success' });
            navigate("/chat");
        } catch (err) {
            console.error("Register error:", err);
            let message;
            if (!err.response) {
                message = 'Serveur injoignable — erreur réseau. Vérifiez que le backend (http://localhost:5000) est démarré.';
            } else {
                message = err.response?.data?.message || err.message || "Erreur d'inscription";
            }
            setError(message);
            showToast(message, { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-layout">
            <Header />

            <main className="register-container">
                <div className="register-wrapper">
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

                            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Création...' : 'Créer un compte'}</button>
                        </form>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                            <p className="switch-link" style={{ margin: 0 }}>Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
                            <button type="button" className="btn btn-ghost" onClick={async () => {
                                try {
                                    await axios.get('http://localhost:4000/api/auth/health');
                                    showToast('Backend joignable — OK', { type: 'success' });
                                } catch (err) {
                                    console.error('Health check failed:', err);
                                    showToast('Serveur injoignable — erreur réseau', { type: 'error' });
                                }
                            }}>Tester la connexion</button>
                        </div>
                    </div>

                    <aside className="register-visual" aria-hidden="true">
                        <svg width="340" height="380" viewBox="0 0 340 380" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="340" height="380" rx="18" fill="url(#gregister)" />
                            <circle cx="170" cy="70" r="32" fill="#fff" opacity="0.9" />
                            <rect x="110" y="130" width="120" height="14" rx="7" fill="#fff" opacity="0.8" />
                            <rect x="100" y="160" width="140" height="12" rx="6" fill="#fff" opacity="0.7" />
                            <rect x="80" y="190" width="180" height="10" rx="5" fill="#fff" opacity="0.6" />
                            <rect x="50" y="240" width="240" height="110" rx="12" fill="#fff" opacity="0.85" />
                            <defs>
                                <linearGradient id="gregister" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0" stopColor="#f093fb" />
                                    <stop offset="1" stopColor="#f5576c" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default RegisterForm;
