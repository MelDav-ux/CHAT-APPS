/*
  src/App.js — Configuration des routes et provider globaux
  - Enveloppe l'application dans `ToastProvider`
  - Définit les routes publiques et protégées
*/
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../components/Home";
import { ToastProvider } from "../components/ToastContext";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import ChatRoom from "../components/ChatRoom";
import PrivateRoute from "../components/PrivateRoute";
import Profile from "../components/Profile";
import Terms from "../components/Terms";
import Privacy from "../components/Privacy";

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />        {/*  page d’accueil */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/chat" element={<PrivateRoute><ChatRoom /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
