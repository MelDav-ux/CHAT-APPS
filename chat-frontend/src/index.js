/*
  src/index.js — point d'entrée front
  - Charge les styles globaux et lance React
*/
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/theme.css';
import App from './styles/App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
