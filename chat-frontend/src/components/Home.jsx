/*
  src/components/Home.jsx — Page d'accueil (hero)
  - Présente l'application et propose les actions Connexion / Inscription
*/
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="header-logo">
                    <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="#4f46e5" />
                    </svg>
                    <span className="logo-text">Application de <span className="logo-highlight">chat</span></span>
                </div>
                <nav className="header-buttons">
                    <button className="btn-ghost" onClick={() => navigate("/login")}>Connexion</button>
                    <button className="btn-primary" onClick={() => navigate("/register")}>Inscription</button>
                </nav>
            </header>

            <main className="home-hero">
                <section className="hero-text">
                    <h1>Messagerie rapide. Simple. Sécurisée.</h1>
                    <p className="lead">Rejoignez des conversations instantanées, partagez des idées et collaborez en temps réel — en toute sécurité.</p>
                    <div className="hero-ctas">
                        <button className="btn-primary" onClick={() => navigate("/register")}>Créer un compte</button>
                        <button className="btn-ghost" onClick={() => navigate("/login")}>Se connecter</button>
                    </div>
                </section>

                <aside className="hero-visual" aria-hidden="true">
                    <svg width="380" height="300" viewBox="0 0 380 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="380" height="300" rx="18" fill="url(#g)" />
                        <g fill="#fff" opacity="0.95">
                            <circle cx="80" cy="90" r="28" />
                            <rect x="130" y="70" width="200" height="36" rx="8" />
                            <rect x="130" y="120" width="160" height="28" rx="6" />
                            <rect x="40" y="170" width="300" height="90" rx="10" />
                        </g>
                        <defs>
                            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0" stopColor="#4f46e5" />
                                <stop offset="1" stopColor="#06b6d4" />
                            </linearGradient>
                        </defs>
                    </svg>
                </aside>
            </main>

            <section className="home-features">
                <div className="feature">
                    <h3>Sécurité</h3>
                    <p>Chiffrement des messages et contrôle d'accès via token JWT.</p>
                </div>
                <div className="feature">
                    <h3>Temps réel</h3>
                    <p>Messages instantanés grâce à Socket.IO et une architecture légère.</p>
                </div>
                <div className="feature">
                    <h3>Interface simple</h3>
                    <p>Design épuré pour concentrer vos conversations.</p>
                </div>
            </section>

            <footer className="home-footer">
                <div className="footer-left">© {new Date().getFullYear()} Chat-App</div>
                <div className="footer-right">
                    <Link to="/terms">Conditions</Link>
                    <Link to="/privacy">Confidentialité</Link>
                    <Link to="/profile">Mon profil</Link>
                </div>
            </footer>
        </div>
    );
}

export default Home;
