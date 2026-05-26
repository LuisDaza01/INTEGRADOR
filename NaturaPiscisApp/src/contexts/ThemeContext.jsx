// src/contexts/ThemeContext.jsx
// Contexto de tema con soporte para modo claro, oscuro y automático

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext(null);

// ============================================
// ✅ CONSTANTES DE TEMA (exportadas para usar en otros archivos)
// ============================================
export const THEME_MODES = {
  AUTO: 'auto',
  LIGHT: 'light',
  DARK: 'dark',
};

// ============================================
// PALETAS DE COLORES
// ============================================
const lightColors = {
  // Backgrounds — limpio y premium con tinte verde
  background: '#F0FDF4',
  surface: '#FFFFFF',
  surfaceVariant: '#F0FDF4',

  // Text — alto contraste slate
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  // Primary — brand green
  primary: '#16A34A',
  primaryLight: '#4ade80',
  primaryDark: '#15803d',

  // Secondary — blue-water
  secondary: '#0284c7',
  secondaryLight: '#38bdf8',
  secondaryDark: '#0369a1',

  // Acentos neón — tonos suaves para modo claro
  neonCyan: '#06B6D4',
  neonGreen: '#10B981',
  neonMagenta: '#D946EF',
  neonAmber: '#F59E0B',

  // Glassmorphism — cristal claro
  glass: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(22, 163, 74, 0.15)',
  glassLight: 'rgba(255, 255, 255, 0.5)',

  // Status
  success: '#22C55E',
  successBg: '#F0FDF4',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  info: '#3B82F6',
  infoBg: '#EFF6FF',

  // Borders & Dividers
  border: 'rgba(22, 163, 74, 0.2)',
  divider: 'rgba(22, 163, 74, 0.1)',

  // Cards & Containers
  card: '#FFFFFF',
  cardBorder: 'rgba(22, 163, 74, 0.15)',
  cardGlass: 'rgba(255, 255, 255, 0.88)',
  cardGlassBorder: 'rgba(22, 163, 74, 0.2)',

  // Glow
  glowColor: '#16A34A',
  glowColorPrimary: '#16A34A',

  // Tab Bar
  tabBar: 'rgba(255, 255, 255, 0.97)',
  tabBarBorder: 'rgba(22, 163, 74, 0.18)',
  tabActive: '#16A34A',
  tabInactive: '#94A3B8',

  // Inputs
  inputBackground: '#F0FDF4',
  inputBorder: 'rgba(22, 163, 74, 0.2)',
  inputBorderFocused: '#16A34A',
  placeholder: '#94A3B8',

  // Buttons
  buttonPrimary: '#16A34A',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#F0FDF4',
  buttonSecondaryText: '#0F172A',
  buttonDisabled: '#E2E8F0',
  buttonDisabledText: '#94A3B8',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Shadows
  shadowColor: '#16A34A',

  // Gradients
  gradientPrimary: ['#16A34A', '#22C55E'],
  gradientSecondary: ['#0284c7', '#38bdf8'],
  gradientDark: ['#0F172A', '#1E293B'],
  gradientNeon: ['#10B981', '#22C55E'],
  gradientMagenta: ['#D946EF', '#A855F7'],
};

const darkColors = {
  // Backgrounds — ultra-profundo premium futurista
  background: '#030712',
  surface: '#0A0F1E',
  surfaceVariant: '#0F1629',

  // Text — alto contraste #F8FAFC base
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#030712',

  // Primary — NaturaPiscis brand green #22C55E
  primary: '#22C55E',
  primaryLight: '#4ade80',
  primaryDark: '#16a34a',

  // Secondary — IoT sensor accents
  secondary: '#38bdf8',
  secondaryLight: '#7dd3fc',
  secondaryDark: '#0284c7',

  // Acentos neón futuristas
  neonCyan: '#00F5FF',
  neonGreen: '#00FF88',
  neonMagenta: '#FF00E5',
  neonAmber: '#FFAA00',

  // Glassmorphism — superficies de cristal oscuro
  glass: 'rgba(10, 15, 30, 0.72)',
  glassBorder: 'rgba(0, 245, 255, 0.12)',
  glassLight: 'rgba(255, 255, 255, 0.04)',

  // Status
  success: '#22C55E',
  successBg: 'rgba(34, 197, 94, 0.1)',
  warning: '#fbbf24',
  warningBg: 'rgba(251, 191, 36, 0.1)',
  error: '#f87171',
  errorBg: 'rgba(248, 113, 113, 0.1)',
  info: '#38bdf8',
  infoBg: 'rgba(56, 189, 248, 0.1)',

  // Borders & Dividers — cyan-tinted futurista
  border: 'rgba(0, 245, 255, 0.10)',
  divider: 'rgba(0, 245, 255, 0.06)',

  // Cards & Containers
  card: '#0A0F1E',
  cardBorder: 'rgba(0, 245, 255, 0.12)',
  cardGlass: 'rgba(10, 15, 30, 0.75)',
  cardGlassBorder: 'rgba(0, 245, 255, 0.15)',

  // Glow
  glowColor: '#22C55E',
  glowColorPrimary: '#22C55E',

  // Tab Bar
  tabBar: 'rgba(3, 7, 18, 0.92)',
  tabBarBorder: 'rgba(0, 245, 255, 0.15)',
  tabActive: '#22C55E',
  tabInactive: '#334155',

  // Inputs
  inputBackground: '#0A0F1E',
  inputBorder: 'rgba(0, 245, 255, 0.10)',
  inputBorderFocused: '#00F5FF',
  placeholder: '#64748B',

  // Buttons
  buttonPrimary: '#22C55E',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#0F1629',
  buttonSecondaryText: '#F1F5F9',
  buttonDisabled: '#0F1629',
  buttonDisabledText: '#64748B',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.78)',

  // Shadows
  shadowColor: '#00F5FF',

  // Gradientes futuristas
  gradientPrimary: ['#00FF88', '#22C55E'],
  gradientSecondary: ['#00F5FF', '#0284c7'],
  gradientDark: ['#0A0F1E', '#030712'],
  gradientNeon: ['#00F5FF', '#00FF88'],
  gradientMagenta: ['#FF00E5', '#BF5AF2'],
};

// ============================================
// STORAGE KEY
// ============================================
const THEME_STORAGE_KEY = '@naturapiscis_theme_mode';

// ============================================
// THEME PROVIDER
// ============================================
export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  
  const [themeMode, setThemeMode] = useState(THEME_MODES.AUTO);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && Object.values(THEME_MODES).includes(savedTheme)) {
        setThemeMode(savedTheme);
        if (__DEV__) console.log('🎨 Tema cargado:', savedTheme);
      }
    } catch (error) {
      if (__DEV__) console.warn('Error cargando tema:', error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (mode) => {
    if (!Object.values(THEME_MODES).includes(mode)) {
      if (__DEV__) console.warn('Modo de tema inválido:', mode);
      return;
    }
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      if (__DEV__) console.log('🎨 Tema guardado:', mode);
    } catch (error) {
      if (__DEV__) console.warn('Error guardando tema:', error?.message);
    }
  };

  const toggleTheme = () => {
    const newMode = isDarkMode ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    setTheme(newMode);
  };

  // ✅ isAuto: true cuando el tema sigue al sistema
  const isAuto = themeMode === THEME_MODES.AUTO;

  const isDarkMode = isAuto
    ? systemColorScheme === 'dark'
    : themeMode === THEME_MODES.DARK;

  const colors = isDarkMode ? darkColors : lightColors;

  const value = {
    // Estado
    themeMode,
    isDarkMode,
    isLoading,
    isAuto,           // ✅ AGREGADO

    // Colores
    colors,

    // Constantes
    THEME_MODES,      // ✅ AGREGADO

    // Acciones
    setTheme,
    toggleTheme,

    // Info del sistema
    systemColorScheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================
// HOOK PERSONALIZADO
// ============================================
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

export default ThemeContext;