// src/api/services/device.service.js
// Servicio para control de dispositivos IoT

import api from '../axios.config';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, onValue, off } from 'firebase/database';
import { FIREBASE_CONFIG, DEVICE_CONFIG } from '../../constants/config';
import * as Haptics from 'expo-haptics';

// Firebase
let database;

const initFirebase = () => {
  if (!getApps().length) {
    try {
      initializeApp(FIREBASE_CONFIG);
    } catch (error) {
      console.log('Error inicializando Firebase:', error);
    }
  }
  database = getDatabase();
};

export const deviceService = {
  // ============================================
  // OBTENER DISPOSITIVOS
  // ============================================
  getDevices: async () => {
    try {
      const response = await api.get('/devices');
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      console.log('Error obteniendo dispositivos:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // TOGGLE DISPOSITIVO (ENCENDER/APAGAR)
  // ============================================
  toggleDevice: async (deviceId, state) => {
    try {
      // Feedback háptico
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await api.post(`/devices/${deviceId}/toggle`, { state });
      
      // También actualizar en Firebase para sincronización en tiempo real
      if (database) {
        const deviceRef = ref(database, `devices/${deviceId}/state`);
        await set(deviceRef, state);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      // Feedback de error
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // PROGRAMAR DISPOSITIVO
  // ============================================
  scheduleDevice: async (deviceId, schedule) => {
    try {
      const response = await api.post(`/devices/${deviceId}/schedule`, schedule);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // OBTENER PROGRAMACIONES
  // ============================================
  getSchedules: async (deviceId) => {
    try {
      const response = await api.get(`/devices/${deviceId}/schedules`);
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // ELIMINAR PROGRAMACIÓN
  // ============================================
  deleteSchedule: async (deviceId, scheduleId) => {
    try {
      await api.delete(`/devices/${deviceId}/schedules/${scheduleId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // MODO AUTOMÁTICO
  // ============================================
  setAutoMode: async (deviceId, config) => {
    try {
      const response = await api.post(`/devices/${deviceId}/auto`, config);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // PARADA DE EMERGENCIA
  // ============================================
  emergencyStop: async () => {
    try {
      // Feedback háptico fuerte
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      const response = await api.post('/devices/emergency-stop');
      return { success: true, data: response.data };
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // SUSCRIBIRSE A ESTADO DE DISPOSITIVOS
  // ============================================
  subscribeToDevices: (producerId, callback) => {
    initFirebase();
    
    if (!database) {
      console.log('Firebase no disponible');
      return () => {};
    }

    const devicesRef = ref(database, `producers/${producerId}/devices`);
    
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const devices = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          config: DEVICE_CONFIG[data[key].type] || {},
        }));
        callback(devices);
      }
    }, (error) => {
      console.log('Error en suscripción dispositivos:', error);
    });

    return () => {
      off(devicesRef);
    };
  },

  // ============================================
  // OBTENER HISTORIAL DE ACCIONES
  // ============================================
  getDeviceHistory: async (deviceId, params = {}) => {
    try {
      const response = await api.get(`/devices/${deviceId}/history`, { params });
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default deviceService;
