/*
  src/components/ToastContext.jsx — Fournit `showToast(message, options)`
  - Permet d'afficher des notifications globales (succès/erreur/info)
*/
import React, { createContext, useState, useContext, useCallback } from 'react';
import './Toast.css';

const ToastContext = createContext();

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, { type='info', duration=3500 }={}) => {
    const id = Date.now().toString();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-root" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`} onClick={() => remove(t.id)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(){
  return useContext(ToastContext);
}
