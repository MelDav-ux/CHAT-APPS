/*
  src/components/Header.jsx — Entête réutilisable de l'application
  - Contient logo et bouton retour
*/
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";

function Header() {
    const navigate = useNavigate();

    return (
        <header className="app-header">
            <div className="header-logo">
                <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="#4f46e5" />
                </svg>
                <span className="logo-text">Application de <span className="logo-highlight">chat</span></span>
            </div>
            <button className="btn btn-ghost" onClick={() => navigate("/")} title="Retour à l'accueil">
                ← Retour
            </button>
        </header>
    );
}

export default Header;
