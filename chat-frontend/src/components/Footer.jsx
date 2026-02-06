/*
  src/components/Footer.jsx — Pied de page global
  - Contient liens vers Conditions / Confidentialité
*/
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-left">© {new Date().getFullYear()} Chat-App</div>
            <div className="footer-right">
                <Link to="/terms">Conditions</Link>
                <Link to="/privacy">Confidentialité</Link>
            </div>
        </footer>
    );
}

export default Footer;
