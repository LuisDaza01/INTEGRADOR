// src/constants/config.js
// Configuración general de la aplicación

export const API_BASE_URL = 'https://integrador-production-8f83.up.railway.app/api';


// Configuración de Firebase (para sensores en tiempo real)
export const FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY",
  authDomain: "naturapiscis.firebaseapp.com",
  databaseURL: "https://naturapiscis-default-rtdb.firebaseio.com",
  projectId: "naturapiscis",
  storageBucket: "naturapiscis.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};


export const USER_ROLES = {
  ADMIN:      1,
  PRODUCER:   2,
  CONSUMER:   3,
  REPARTIDOR: 4, 
};

// Estados de pedidos
export const ORDER_STATUS = {
  PENDING:    'pendiente',
  CONFIRMED:  'confirmado',
  PREPARING:  'preparando',
  READY:      'listo_para_recoger',
  DELIVERING: 'en_camino',
  DELIVERED:  'entregado',
  CANCELLED:  'cancelado',
};

// Etiquetas de estados
export const ORDER_STATUS_LABELS = {
  pendiente:          'Pendiente',
  confirmado:         'Confirmado',
  preparando:         'Preparando',
  listo_para_recoger: 'Listo para entrega',
  en_camino:          'En camino',
  entregado:          'Entregado',
  cancelado:          'Cancelado',
};

// Tipos de sensores
export const SENSOR_TYPES = {
  TEMPERATURE: 'temperatura',
  PH:          'ph',
  OXYGEN:      'oxigeno',
  TURBIDITY:   'turbidez',
};

// Rangos óptimos de sensores
export const SENSOR_RANGES = {
  temperatura: { min: 20, max: 28, unit: '°C',   icon: 'thermometer-outline', label: 'Temperatura' },
  ph:          { min: 6.5, max: 8.5, unit: '',    icon: 'flask-outline',       label: 'pH'          },
  oxigeno:     { min: 5,  max: 12,  unit: 'mg/L', icon: 'water-outline',       label: 'Oxígeno'     },
  turbidez:    { min: 0,  max: 30,  unit: 'NTU',  icon: 'eye-outline',         label: 'Turbidez'    },
};

// Tipos de dispositivos IoT
export const DEVICE_TYPES = {
  PUMP:    'bomba',
  AERATOR: 'aireador',
  FEEDER:  'alimentador',
  HEATER:  'calentador',
  LIGHT:   'iluminacion',
};

// Configuración de dispositivos
export const DEVICE_CONFIG = {
  bomba:       { label: 'Bomba de Agua', icon: 'water-outline'      },
  aireador:    { label: 'Aireador',      icon: 'cloud-outline'       },
  alimentador: { label: 'Alimentador',   icon: 'restaurant-outline'  },
  calentador:  { label: 'Calentador',    icon: 'flame-outline'       },
  iluminacion: { label: 'Iluminación',   icon: 'bulb-outline'        },
};

// Tipos de alertas
export const ALERT_TYPES = {
  CRITICAL: 'critical',
  WARNING:  'warning',
  INFO:     'info',
};

// Configuración de notificaciones
export const NOTIFICATION_CHANNELS = {
  alerts: {
    name:             'Alertas de Sensores',
    importance:       'max',
    vibrationPattern: [0, 500, 250, 500],
    sound:            'alert.wav',
  },
  orders: {
    name:             'Pedidos',
    importance:       'high',
    vibrationPattern: [0, 250, 250, 250],
    sound:            'notification.wav',
  },
  default: {
    name:       'General',
    importance: 'default',
  },
};

// Configuración de la app
export const APP_CONFIG = {
  SENSOR_UPDATE_INTERVAL:    5000,   // 5 segundos
  CACHE_DURATION:            60000,  // 1 minuto
  MAX_RECONNECT_ATTEMPTS:    5,
  RECONNECT_INTERVAL:        3000,   // 3 segundos
  BIOMETRIC_TIMEOUT:         10000,  // 10 segundos
  TOKEN_REFRESH_THRESHOLD:   300000, // 5 minutos antes de expirar
};

export default {
  API_BASE_URL,
  FIREBASE_CONFIG,
  USER_ROLES,
  ORDER_STATUS,
  SENSOR_TYPES,
  DEVICE_TYPES,
  ALERT_TYPES,
  APP_CONFIG,
};