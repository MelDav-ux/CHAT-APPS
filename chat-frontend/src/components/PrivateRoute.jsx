import React, { useState, useEffect } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
    const [checking, setChecking] = useState(true);
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        const check = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setChecking(false);
                setAuthed(false);
                return;
            }

            try {
                await axios.get("http://localhost:5000/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAuthed(true);
            } catch (err) {
                setAuthed(false);
            } finally {
                setChecking(false);
            }
        };

        check();
    }, []);

    if (checking) return null;
    return authed ? children : <Navigate to="/login" replace />;
}

export default PrivateRoute;
