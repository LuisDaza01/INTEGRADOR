// src/contexts/AuthContext.jsx
// Contexto de autenticación

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/services/auth.service';
import { purgeCache } from '../hooks/useOfflineCache';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesión al iniciar la app
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // ============================================
  // VERIFICAR ESTADO DE AUTENTICACIÓN
  // ============================================
  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Verificando sesión...');
      const result = await authService.checkAuth();

      if (result.isAuthenticated && result.user) {
        console.log('✅ Sesión activa:', result.user.nombre);
        setUser(result.user);
        setIsAuthenticated(true);
        // Recuperar token guardado en SecureStore
        const savedToken = await authService.getToken();
        setToken(savedToken);
      } else {
        console.log('❌ No hay sesión activa');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('❌ Error verificando sesión:', error);
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // INICIAR SESIÓN
  // ============================================
  const login = async (email, password) => {
    try {
      console.log('🔐 Intentando login...');
      const result = await authService.login(email, password);

      if (result.success) {
        console.log('✅ Login exitoso');
        setUser(result.user);
        setToken(result.token);
        setIsAuthenticated(true);
        return { success: true, user: result.user };
      } else {
        console.log('❌ Login fallido:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.log('❌ Error en login:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  // ============================================
  // CERRAR SESIÓN
  // ============================================
  const logout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      await Promise.all([authService.logout(), purgeCache()]);
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      console.log('✅ Sesión cerrada');
    } catch (error) {
      console.log('❌ Error al cerrar sesión:', error);
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  // ============================================
  // LOGIN DIRECTO CON TOKEN (usado por Google)
  // ============================================
  const loginWithData = (token, user) => {
    setUser(user);
    setToken(token);
    setIsAuthenticated(true);
    return { success: true, user };
  };

  // ============================================
  // ACTUALIZAR DATOS DE USUARIO
  // ============================================
  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  // ============================================
  // VALORES DEL CONTEXTO
  // ============================================
  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    loginWithData,
    logout,
    checkAuthStatus,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;