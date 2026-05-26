// src/constants/colors.js
// Paleta de colores futurista — NaturaPiscis brand: verde #22C55E como primario
// Sistema de diseño con acentos neón, glassmorphism y gradientes premium

export const COLORS = {
  // Colores principales — verde marca NaturaPiscis (vibrante y futurista)
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#22C55E',  // Color principal
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Slate (fondos oscuros — profundos y premium)
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#030712',  // Fondo ultra-profundo futurista
  },

  // Estados — colores vibrantes de alto contraste
  success: {
    light: '#D1FAE5',
    main: '#22C55E',
    dark: '#15803D',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#B45309',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#B91C1C',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1D4ED8',
  },

  // Texto
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',
    disabled: '#64748B',
    hint: '#475569',
  },

  // Fondos — oscuros premium
  background: {
    default: '#030712',
    paper: '#0A0F1E',
    elevated: '#0F1629',
  },

  // Bordes
  border: {
    light: '#1E293B',
    main: '#334155',
    dark: '#475569',
  },
};

// Colores neón futuristas — acentos vibrantes para UI premium
export const NEON_COLORS = {
  cyan: '#00F5FF',
  green: '#00FF88',
  magenta: '#FF00E5',
  amber: '#FFAA00',
  purple: '#BF5AF2',
};

// Colores para glassmorphism — variantes con opacidad
export const GLASS_COLORS = {
  // Fondos de cristal oscuro
  darkLight: 'rgba(10, 15, 30, 0.45)',
  darkMedium: 'rgba(10, 15, 30, 0.65)',
  darkHeavy: 'rgba(10, 15, 30, 0.85)',

  // Fondos de cristal claro
  light: 'rgba(255, 255, 255, 0.08)',
  lightMedium: 'rgba(255, 255, 255, 0.15)',
  lightHeavy: 'rgba(255, 255, 255, 0.25)',

  // Bordes con brillo neón
  borderCyan: 'rgba(0, 245, 255, 0.15)',
  borderGreen: 'rgba(0, 255, 136, 0.15)',
  borderMagenta: 'rgba(255, 0, 229, 0.15)',
  borderAmber: 'rgba(255, 170, 0, 0.15)',
  borderPrimary: 'rgba(34, 197, 94, 0.18)',
  borderWhite: 'rgba(255, 255, 255, 0.08)',
};

// Presets de gradientes — combinaciones listas para usar
export const GRADIENT_PRESETS = {
  // Gradientes de fondo
  backgroundDark: ['#030712', '#0A0F1E'],
  backgroundDeep: ['#0A0F1E', '#030712'],
  backgroundSurface: ['#0F1629', '#0A0F1E'],

  // Gradientes de tarjetas
  cardDark: ['rgba(10, 15, 30, 0.9)', 'rgba(3, 7, 18, 0.95)'],
  cardGlow: ['rgba(0, 245, 255, 0.05)', 'rgba(0, 255, 136, 0.02)'],
  cardNeon: ['rgba(0, 245, 255, 0.08)', 'rgba(0, 255, 136, 0.04)'],

  // Gradientes de botones y acentos
  primary: ['#00FF88', '#22C55E'],
  secondary: ['#00F5FF', '#0284C7'],
  neon: ['#00F5FF', '#00FF88'],
  magenta: ['#FF00E5', '#BF5AF2'],
  amber: ['#FFAA00', '#F59E0B'],
  sunset: ['#FF00E5', '#FFAA00'],
  ocean: ['#00F5FF', '#3B82F6'],
  aurora: ['#00FF88', '#00F5FF', '#BF5AF2'],

  // Gradientes para texto (meshGradient style)
  textShimmer: ['#FFFFFF', '#94A3B8', '#FFFFFF'],
  textNeon: ['#00F5FF', '#00FF88'],
};

// Colores para sensores (neón vibrante, identidad acuícola)
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

// Colores para dispositivos (neón vibrante)
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
