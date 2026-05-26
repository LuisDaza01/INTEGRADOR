// src/constants/theme.js
// Estilos globales y tema futurista de la aplicación
// Sistema de diseño con tipografía Space Grotesk, glassmorphism y animaciones premium

import { Platform } from 'react-native';

// Re-exportar COLORS para acceso directo
export { COLORS, SENSOR_COLORS, DEVICE_COLORS, ORDER_STATUS_COLORS, NEON_COLORS, GLASS_COLORS, GRADIENT_PRESETS } from './colors';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 36,
};

// Tipografía futurista — Space Grotesk con fallback a System
export const FONT_FAMILY = {
  heading: 'SpaceGrotesk-Bold',
  body: 'SpaceGrotesk-Regular',
  medium: 'SpaceGrotesk-Medium',
  semibold: 'SpaceGrotesk-SemiBold',
  mono: Platform?.OS === 'ios' ? 'Courier New' : 'monospace',
};

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Sombras con variantes futuristas de resplandor neón
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  primary: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  neonCyan: {
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  neonGreen: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  neonMagenta: {
    shadowColor: '#FF00E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  neonAmber: {
    shadowColor: '#FFAA00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  // Sombra de elevación para tarjetas flotantes
  float: {
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
};

// Resplandor neón — presets de sombra para elementos brillantes
export const GLOW = {
  cyan: {
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 14,
  },
  green: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  magenta: {
    shadowColor: '#FF00E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  amber: {
    shadowColor: '#FFAA00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  primary: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
};

// Glassmorphism — estilos de cristal listos para usar
export const GLASS = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  medium: {
    backgroundColor: 'rgba(10, 15, 30, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.12)',
  },
  heavy: {
    backgroundColor: 'rgba(10, 15, 30, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.18)',
  },
};

// Configuraciones de animación — springs y timings optimizados
export const ANIMATION_CONFIG = {
  // Configuraciones de spring para react-native-reanimated / Animated
  spring: {
    snappy: {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
      overshootClamping: false,
    },
    bouncy: {
      damping: 12,
      stiffness: 200,
      mass: 1,
      overshootClamping: false,
    },
    smooth: {
      damping: 28,
      stiffness: 150,
      mass: 1,
      overshootClamping: true,
    },
  },
  // Duraciones de timing en milisegundos
  timing: {
    instant: 100,
    fast: 200,
    normal: 350,
    slow: 500,
    entrance: 600,
    exit: 300,
  },
};
