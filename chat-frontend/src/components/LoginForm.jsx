/*
  src/components/LoginForm.jsx — Formulaire de connexion
  - Gère l'envoi des identifiants et stocke le token en localStorage
  - Utilise `showToast` pour notifier l'utilisateur
*/
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../styles/LoginForm.css";
import { useToast } from "./ToastContext";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Envoie des données de connexion et gère le token / messages
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const emailTrim = email.trim().toLowerCase();
        if (!emailTrim) return setError('Veuillez saisir une adresse email');
        if (!password || password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères');

        setLoading(true);

        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", {
                email: emailTrim,
                password,
            });

            if (!res?.data?.token) throw new Error('Aucun token renvoyé par le serveur');

            localStorage.setItem("token", res.data.token);
            showToast('Connecté avec succès', { type: 'success' });
            navigate("/chat");
        } catch (err) {
            // Affiche un message spécifique si aucun `response` (erreur réseau / serveur inaccessible)
            console.error("Login error:", err);
            let message;
            if (!err.response) {
                message = 'Serveur injoignable — erreur réseau. Vérifiez que le backend (http://localhost:5000) est démarré.';
            } else {
                message = err.response?.data?.message || err.message || "Erreur de connexion";
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

            <main className="auth-container">
                <div className="auth-wrapper">
                    <div className="auth-card">
                        <div className="brand"><div className="logo">Chat<span>App</span></div></div>
                        <h2>Bienvenue</h2>
                        <p className="lead">Connectez-vous pour accéder à vos conversations.</p>
                        {error && <p className="error" role="alert">{error}</p>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Email</label>
                                <input className="form-input" type="email" placeholder="email@exemple.com" value={email}
                                    onChange={(e) => setEmail(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input className="form-input" type="password" placeholder="Votre mot de passe" value={password}
                                    onChange={(e) => setPassword(e.target.value)} required />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
                        </form>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                            <p className="switch-link" style={{ margin: 0 }}>Pas encore inscrit ? <Link to="/register">Créer un compte</Link></p>
                            <button type="button" className="btn btn-ghost" onClick={async () => {
                                try {
                                    await axios.get('http://localhost:5000/api/auth/health');
                                    showToast('Backend joignable — OK', { type: 'success' });
                                } catch (err) {
                                    console.error('Health check failed:', err);
                                    showToast('Serveur injoignable — erreur réseau', { type: 'error' });
                                }
                            }}>Tester la connexion</button>
                        </div>
                    </div>

                    <aside className="auth-visual" aria-hidden="true">
                        <svg width="340" height="380" viewBox="0 0 340 380" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="340" height="380" rx="18" fill="url(#glogin)" />
                            <circle cx="170" cy="80" r="35" fill="#fff" opacity="0.9" />
                            <rect x="100" y="140" width="140" height="12" rx="6" fill="#fff" opacity="0.8" />
                            <rect x="90" y="170" width="160" height="10" rx="5" fill="#fff" opacity="0.7" />
                            <rect x="60" y="220" width="220" height="120" rx="12" fill="#fff" opacity="0.85" />
                            <defs>
                                <linearGradient id="glogin" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0" stopColor="#667eea" />
                                    <stop offset="1" stopColor="#764ba2" />
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

export default LoginForm;
