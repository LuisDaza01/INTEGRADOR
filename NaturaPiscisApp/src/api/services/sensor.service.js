// src/api/services/sensor.service.js
// Servicio para gestión de sensores IoT

import api from '../axios.config';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { FIREBASE_CONFIG, SENSOR_RANGES } from '../../constants/config';

// Inicializar Firebase si no está inicializado
let firebaseApp;
let database;

const initFirebase = () => {
  if (!getApps().length) {
    try {
      firebaseApp = initializeApp(FIREBASE_CONFIG);
      database = getDatabase(firebaseApp);
    } catch (error) {
      console.log('Error inicializando Firebase:', error);
    }
  } else {
    firebaseApp = getApps()[0];
    database = getDatabase(firebaseApp);
  }
};

export const sensorService = {
  // ============================================
  // OBTENER SENSORES DEL PRODUCTOR
  // ============================================
  getSensors: async () => {
    try {
      const response = await api.get('/sensors');
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      console.log('Error obteniendo sensores:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // OBTENER LECTURAS DE UN SENSOR
  // ============================================
  getSensorReadings: async (sensorId, params = {}) => {
    try {
      const response = await api.get(`/sensors/${sensorId}/readings`, { params });
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // SUSCRIBIRSE A SENSORES EN TIEMPO REAL
  // ============================================
  subscribeToSensors: (producerId, callback) => {
    initFirebase();
    
    if (!database) {
      console.log('Firebase no disponible');
      return () => {};
    }

    const sensorsRef = ref(database, `producers/${producerId}/sensors`);
    
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const sensors = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          status: getSensorStatus(data[key].type, data[key].value),
        }));
        callback(sensors);
      }
    }, (error) => {
      console.log('Error en suscripción Firebase:', error);
    });

    // Retornar función para cancelar suscripción
    return () => {
      off(sensorsRef);
    };
  },

  // ============================================
  // OBTENER ALERTAS DE SENSORES
  // ============================================
  getSensorAlerts: async () => {
    try {
      const response = await api.get('/sensors/alerts');
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // CONFIGURAR UMBRALES DE ALERTA
  // ============================================
  setAlertThresholds: async (sensorId, thresholds) => {
    try {
      const response = await api.put(`/sensors/${sensorId}/thresholds`, thresholds);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // OBTENER ESTADÍSTICAS DE SENSORES
  // ============================================
  getSensorStats: async (sensorId, period = '24h') => {
    try {
      const response = await api.get(`/sensors/${sensorId}/stats`, { 
        params: { period } 
      });
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// ============================================
// HELPERS
// ============================================

// Determinar estado del sensor según su valor
const getSensorStatus = (type, value) => {
  const range = SENSOR_RANGES[type];
  if (!range) return 'unknown';

  if (value < range.min * 0.8 || value > range.max * 1.2) {
    return 'critical';
  } else if (value < range.min || value > range.max) {
    return 'warning';
  }
  return 'normal';
};

// Obtener color según estado
export const getSensorStatusColor = (status) => {
  switch (status) {
    case 'critical': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'normal': return '#22c55e';
    default: return '#64748b';
  }
};

// Formatear valor del sensor
export const formatSensorValue = (type, value) => {
  const range = SENSOR_RANGES[type];
  if (!range) return value?.toString() || '--';
  
  return `${value?.toFixed(1) || '--'} ${range.unit}`;
};

export default sensorService;
