// src/constants/colors.js
// Paleta de colores — NaturaPiscis brand: verde #22C55E como primario

export const COLORS = {
  // Colores principales — verde marca NaturaPiscis
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22C55E',  // Color principal
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
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

// Colores para sensores (neon vibrante, identidad acuícola)
export const SENSOR_COLORS = {
  temperatura: {
    primary: '#f87171',
    background: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(248, 113, 113, 0.35)',
    glow: 'rgba(248, 113, 113, 0.25)',
  },
  ph: {
    primary: '#a78bfa',
    background: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.35)',
    glow: 'rgba(167, 139, 250, 0.25)',
  },
  oxigeno: {
    primary: '#22C55E',
    background: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.35)',
    glow: 'rgba(34, 197, 94, 0.25)',
  },
  turbidez: {
    primary: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)',
    glow: 'rgba(56, 189, 248, 0.25)',
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
