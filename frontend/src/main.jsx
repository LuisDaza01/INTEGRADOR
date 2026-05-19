// ============================================
// Main Entry Point
// Punto de entrada de la aplicación
// ============================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './App';
import './index.css';

const GOOGLE_WEB_CLIENT_ID = '728810461626-oub4t291euvfforvp72l9ajs0ebv8pq3.apps.googleusercontent.com';

// ============================================
// RENDER APP
// ============================================

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_WEB_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
