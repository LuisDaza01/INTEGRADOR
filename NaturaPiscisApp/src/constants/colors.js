// src/constants/colors.js
// Paleta de colores de la aplicación (igual que la web)

export const COLORS = {
  // Colores principales
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Color principal
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Slate (fondos oscuros)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',  // Fondo principal
    950: '#020617',
  },

  // Estados
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1d4ed8',
  },

  // Texto
  text: {
    primary: '#ffffff',
    secondary: '#94a3b8',
    disabled: '#64748b',
    hint: '#475569',
  },

  // Fondos
  background: {
    default: '#0f172a',
    paper: '#1e293b',
    elevated: '#334155',
  },

  // Bordes
  border: {
    light: '#334155',
    main: '#475569',
    dark: '#64748b',
  },
};

// Colores para sensores (neon vibrante)
export const SENSOR_COLORS = {
  temperatura: {
    primary: '#FF4D6D',
    background: 'rgba(255, 77, 109, 0.12)',
    border: 'rgba(255, 77, 109, 0.35)',
  },
  ph: {
    primary: '#A78BFA',
    background: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.35)',
  },
  oxigeno: {
    primary: '#00D4FF',
    background: 'rgba(0, 212, 255, 0.12)',
    border: 'rgba(0, 212, 255, 0.35)',
  },
  turbidez: {
    primary: '#2AFBCE',
    background: 'rgba(42, 251, 206, 0.12)',
    border: 'rgba(42, 251, 206, 0.35)',
  },
};

// Colores para dispositivos (neon vibrante)
export const DEVICE_COLORS = {
  bomba: '#00D4FF',
  aireador: '#2AFBCE',
  alimentador: '#FFB74D',
  calentador: '#FF4D6D',
  iluminacion: '#FFD700',
};

// Colores para estados de pedidos
export const ORDER_STATUS_COLORS = {
  pendiente: '#FFB74D',
  confirmado: '#00D4FF',
  preparando: '#A78BFA',
  listo: '#2AFBCE',
  en_camino: '#00E676',
  entregado: '#00E676',
  cancelado: '#FF5370',
};

export default COLORS;
