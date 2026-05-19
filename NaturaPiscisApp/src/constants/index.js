// src/contexts/index.js
// Exportaciones centralizadas de contextos

export { AuthProvider, useAuth } from './AuthContext';
export { NotificationProvider, useNotifications } from './NotificationContext';
// ✅ CORREGIDO: DARK_COLORS y LIGHT_COLORS no existen en ThemeContext.jsx
// Solo exportar lo que realmente existe
export { ThemeProvider, useTheme, THEME_MODES } from './ThemeContext';