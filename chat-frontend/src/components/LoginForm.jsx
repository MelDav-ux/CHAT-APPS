import React, { useState } from "react"; 
import axios from "axios"; 
import { useNavigate, Link } from "react-router-dom"; 
import "../styles/LoginForm.css";




function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", {
                email,
                password,
            });

            localStorage.setItem("token", res.data.token);
            navigate("/chat");
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.message || err.message || "Erreur de connexion");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="brand"><div className="logo">Chat<span>App</span></div></div>
                <h2>Bienvenue</h2>
                <p className="lead">Connectez-vous pour accéder à vos conversations.</p>
                {error && <p className="error">{error}</p>}
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

                    <button type="submit" className="btn-login">Se connecter</button>
                </form>

                <p className="switch-link">Pas encore inscrit ? <Link to="/register">Créer un compte</Link></p>
            </div>
        </div>
    );
}

export default LoginForm;
