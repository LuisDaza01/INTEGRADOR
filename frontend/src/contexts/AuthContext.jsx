// ============================================
// Auth Context
// ============================================
// La autenticación se hace por cookie httpOnly emitida por el backend.
// JS NUNCA debe leer el token: lo hace el navegador automáticamente
// gracias a `axios.defaults.withCredentials = true`.
// El estado `user` se hidrata de localStorage para evitar flashes; el
// servidor revalida la sesión leyendo la cookie en /auth/verificar.
// ============================================

import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/config/axios';

export const AuthContext = createContext();

const API_URL = '';

// Cierre de sesión tras 2 horas de inactividad (sin interacción del usuario).
const IDLE_LIMIT_MS = 2 * 60 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('usuario');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // `sessionTick` solo dispara re-verificación tras login/logout en esta sesión.
  const [sessionTick, setSessionTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Verificar sesión contra backend (lee cookie httpOnly) ─────────
  useEffect(() => {
    const verifySession = async () => {
      try {
        setLoading(true);
        const response = await api.get('/auth/verificar');
        const userData = response.data.data?.usuario || response.data.usuario;
        if (userData) {
          setUser(userData);
          localStorage.setItem('usuario', JSON.stringify(userData));
        }
      } catch {
        setUser(null);
        localStorage.removeItem('usuario');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [sessionTick]);

  // ── LOGIN ──────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const responseData = response.data.data || response.data;
      const userData = responseData?.usuario || responseData?.user || responseData;
      const token = response.data.data?.token || response.data.token;

      if (!userData) throw new Error('No se recibieron datos del usuario');

      if (token) localStorage.setItem('auth_token', token);
      setUser(userData);
      localStorage.setItem('usuario', JSON.stringify(userData));
      setSessionTick(t => t + 1);

      return { success: true, usuario: userData };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Error al iniciar sesión. Verifica tus credenciales.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── REGISTER ───────────────────────────────────────────────────
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/auth/registro', userData);
      const newUser = response.data.data?.usuario || response.data.data?.user || response.data.usuario;
      const token = response.data.data?.token || response.data.token;

      if (newUser) {
        if (token) localStorage.setItem('auth_token', token);
        setUser(newUser);
        localStorage.setItem('usuario', JSON.stringify(newUser));
        setSessionTick(t => t + 1);
      }

      return { success: true, usuario: newUser };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al registrarse. Intenta de nuevo.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── LOGIN GOOGLE ───────────────────────────────────────────────
  const loginWithGoogle = useCallback(async (idToken) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/auth/google', { id_token: idToken });
      const dataObj = response.data.data || response.data;
      const userData = dataObj.usuario || dataObj.user;
      const token = response.data.data?.token || response.data.token;

      if (!userData) throw new Error('Respuesta inválida del servidor');

      if (token) localStorage.setItem('auth_token', token);
      setUser(userData);
      localStorage.setItem('usuario', JSON.stringify(userData));
      setSessionTick(t => t + 1);

      return { success: true, usuario: userData };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Error al iniciar sesión con Google';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── LOGOUT ─────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // El logout local sigue aunque la llamada al backend falle
    } finally {
      setUser(null);
      setError(null);
      localStorage.removeItem('usuario');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('last_activity');
      setSessionTick(t => t + 1);
    }
  }, []);

  // ── Cierre de sesión por inactividad (2 h) ─────────────────────
  // Si el usuario no interactúa durante 2 h, se cierra la sesión y debe
  // volver a iniciar. `last_activity` se guarda en localStorage para que
  // el control también aplique al recargar o al volver a la pestaña.
  useEffect(() => {
    if (!user) return;

    // Al montar con un usuario ya logueado, primero verificar si venció.
    const last = parseInt(localStorage.getItem('last_activity') || '0', 10);
    if (last && Date.now() - last > IDLE_LIMIT_MS) {
      localStorage.setItem('sesion_expirada', '1');
      logout();
      return;
    }

    const touch = () => localStorage.setItem('last_activity', String(Date.now()));
    touch();

    const eventos = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    eventos.forEach(e => window.addEventListener(e, touch, { passive: true }));

    const check = () => {
      const t = parseInt(localStorage.getItem('last_activity') || '0', 10);
      if (t && Date.now() - t > IDLE_LIMIT_MS) {
        localStorage.setItem('sesion_expirada', '1');
        logout();
      }
    };
    const intervalId = setInterval(check, 30000); // revisa cada 30 s
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      eventos.forEach(e => window.removeEventListener(e, touch));
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, logout]);

  // ── UPDATE PROFILE ─────────────────────────────────────────────
  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put('/perfil', profileData);
      const updatedData = response.data.data || response.data;
      const updatedUser = { ...user, ...updatedData };

      setUser(updatedUser);
      localStorage.setItem('usuario', JSON.stringify(updatedUser));

      return { success: true, usuario: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al actualizar el perfil. Intenta de nuevo.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── CONTEXT VALUE ──────────────────────────────────────────────
  const value = {
    user,
    loading,
    error,

    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    setError,

    isAuthenticated: !!user,
    isProducer: user?.rol_id === 2,
    isConsumer: user?.rol_id === 3,
    isAdmin:    user?.rol_id === 1,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
