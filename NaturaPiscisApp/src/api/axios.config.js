// src/api/axios.config.js
// Configuración de Axios con interceptores

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/config';

// Endpoints que requieren timeouts más largos (uploads, análisis IA)
const HEAVY_ENDPOINTS = ['/pescado/analizar-frescura', '/comprobante', '/asistente'];
const isHeavy = (url = '') => HEAVY_ENDPOINTS.some(e => url.includes(e));

// Crear instancia de Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitudes - agregar token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      if (__DEV__) console.log('Error obteniendo token:', error);
    }

    if (!config.timeout || config.timeout === 30000) {
      config.timeout = isHeavy(config.url) ? 60000 : 30000;
    }

    if (__DEV__) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas - manejar errores
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`📥 ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (__DEV__) {
      console.log('❌ Error API:', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
      });
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userData');
      } catch (e) {
        if (__DEV__) console.log('Error limpiando sesión:', e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
