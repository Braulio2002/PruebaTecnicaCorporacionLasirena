import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Configuración global para desarrollo
if (import.meta.env.DEV) {
  console.log('🚀 Aplicación iniciada en modo desarrollo');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
