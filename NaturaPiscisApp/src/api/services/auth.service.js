// src/api/services/auth.service.js
// Servicio de autenticación

import api from '../axios.config';
import * as SecureStore from 'expo-secure-store';

export const authService = {
  // ============================================
  // LOGIN
  // ============================================
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (__DEV__) {
        console.log('📦 Respuesta login:', JSON.stringify(response.data));
      }
      
      // Extraer datos (compatible con tu backend)
      // Tu backend: { success, data: { token, usuario } }
      const responseData = response.data.data || response.data;
      const token = responseData.token;
      const user = responseData.usuario || responseData.user;
      
      if (!token || !user) {
        return { success: false, error: 'Respuesta inválida del servidor' };
      }
      
      // Guardar datos de forma segura
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(user));
      
      if (__DEV__) {
        console.log('✅ Login exitoso:', user.nombre);
      }
      
      return { success: true, user, token };
    } catch (error) {
      if (__DEV__) {
        console.log('❌ Error login:', error.response?.data || error.message);
      }
      const message = error.response?.data?.message || 
                      error.response?.data?.error || 
                      'Error al iniciar sesión';
      return { success: false, error: message };
    }
  },

  // ============================================
  // REGISTRO
  // ============================================
  register: async (userData) => {
    try {
      const response = await api.post('/auth/registro', userData);
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrarse';
      return { success: false, error: message };
    }
  },

  // ============================================
  // LOGIN CON GOOGLE
  // ============================================
  loginGoogle: async (idToken) => {
    try {
      const response = await api.post('/auth/google', { id_token: idToken });
      const responseData = response.data.data || response.data;
      const token = responseData.token;
      const user = responseData.usuario || responseData.user;
      if (!token || !user) return { success: false, error: 'Respuesta inválida del servidor' };
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(user));
      return { success: true, user, token };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al iniciar sesión con Google';
      return { success: false, error: message };
    }
  },

  // ============================================
  // LOGOUT
  // ============================================
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userData');
      return { success: true };
    } catch (error) {
      // Limpiar de todas formas
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
      return { success: true };
    }
  },

  // ============================================
  // VERIFICAR SESIÓN
  // ============================================
  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (!token || !userData) {
        return { isAuthenticated: false, user: null };
      }
      
      return {
        isAuthenticated: true,
        user: JSON.parse(userData),
      };
    } catch (error) {
      return { isAuthenticated: false, user: null };
    }
  },

  // ============================================
  // OBTENER TOKEN
  // ============================================
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch {
      return null;
    }
  },

  // ============================================
  // OBTENER USUARIO ACTUAL
  // ============================================
  getCurrentUser: async () => {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  // ============================================
  // ACTUALIZAR PERFIL
  // ============================================
  updateProfile: async (data) => {
    try {
      const response = await api.put('/usuarios/perfil', data);
      const updatedUser = response.data.data || response.data;

      const currentUser = await SecureStore.getItemAsync('userData');
      if (currentUser) {
        const merged = { ...JSON.parse(currentUser), ...updatedUser };
        await SecureStore.setItemAsync('userData', JSON.stringify(merged));
      }

      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar perfil';
      return { success: false, error: message };
    }
  },

  // ============================================
  // CAMBIAR CONTRASEÑA
  // ============================================
  changePassword: async (currentPassword, newPassword) => {
    try {
      await api.put('/usuarios/cambiar-password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Error al cambiar contraseña';
      return { success: false, error: message };
    }
  },

  // ============================================
  // REGISTRAR TOKEN DE PUSH
  // ============================================
  registerPushToken: async (pushToken) => {
    try {
      await api.post('/usuarios/push-token', { pushToken });
      return { success: true };
    } catch (error) {
      console.log('Error registrando push token:', error);
      return { success: false };
    }
  },
};

export default authService;
