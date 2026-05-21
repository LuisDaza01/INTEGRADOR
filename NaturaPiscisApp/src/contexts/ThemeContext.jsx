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
  // Backgrounds — clean white with green tint
  background: '#F0FDF4',
  surface: '#FFFFFF',
  surfaceVariant: '#F0FDF4',

  // Text — high contrast slate
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
};

const darkColors = {
  // Backgrounds — dark slate aligned with web #0a1220
  background: '#080E1A',
  surface: '#0D1929',
  surfaceVariant: '#111E33',

  // Text — high contrast #F8FAFC base
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#080E1A',

  // Primary — NaturaPiscis brand green #22C55E
  primary: '#22C55E',
  primaryLight: '#4ade80',
  primaryDark: '#16a34a',

  // Secondary — kept for IoT sensor accents
  secondary: '#38bdf8',
  secondaryLight: '#7dd3fc',
  secondaryDark: '#0284c7',

  // Status
  success: '#22C55E',
  successBg: 'rgba(34, 197, 94, 0.1)',
  warning: '#fbbf24',
  warningBg: 'rgba(251, 191, 36, 0.1)',
  error: '#f87171',
  errorBg: 'rgba(248, 113, 113, 0.1)',
  info: '#38bdf8',
  infoBg: 'rgba(56, 189, 248, 0.1)',

  // Borders & Dividers — green-tinted
  border: 'rgba(34, 197, 94, 0.14)',
  divider: 'rgba(34, 197, 94, 0.07)',

  // Cards & Containers
  card: '#0D1929',
  cardBorder: 'rgba(34, 197, 94, 0.16)',
  cardGlass: 'rgba(13, 25, 41, 0.85)',
  cardGlassBorder: 'rgba(34, 197, 94, 0.2)',

  // Glow
  glowColor: '#22C55E',
  glowColorPrimary: '#22C55E',

  // Tab Bar
  tabBar: 'rgba(8, 14, 26, 0.96)',
  tabBarBorder: 'rgba(34, 197, 94, 0.2)',
  tabActive: '#22C55E',
  tabInactive: '#334155',

  // Inputs
  inputBackground: '#0D1929',
  inputBorder: 'rgba(34, 197, 94, 0.14)',
  inputBorderFocused: '#22C55E',
  placeholder: '#64748B',

  // Buttons
  buttonPrimary: '#22C55E',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#111E33',
  buttonSecondaryText: '#F1F5F9',
  buttonDisabled: '#111E33',
  buttonDisabledText: '#64748B',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.78)',

  // Shadows
  shadowColor: '#22C55E',

  // Gradients
  gradientPrimary: ['#22C55E', '#16a34a'],
  gradientSecondary: ['#38bdf8', '#0284c7'],
  gradientDark: ['#0D1929', '#080E1A'],
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