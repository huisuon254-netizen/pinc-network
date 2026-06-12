import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
} catch (err) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="color:#ff4444;font-family:monospace;padding:2rem;background:#0a0a0f;height:100vh">
      <h2>PINC — Render Error</h2><pre>${String(err)}</pre>
    </div>`;
  }
}
