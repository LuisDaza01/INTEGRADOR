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
  // Backgrounds
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6',
  
  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Primary (Verde NaturaPiscis)
  primary: '#22C55E',
  primaryLight: '#86EFAC',
  primaryDark: '#16A34A',
  
  // Secondary (Azul agua)
  secondary: '#3B82F6',
  secondaryLight: '#93C5FD',
  secondaryDark: '#2563EB',
  
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
  border: '#E5E7EB',
  divider: '#F3F4F6',
  
  // Cards & Containers
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  cardGlass: 'rgba(255, 255, 255, 0.85)',
  cardGlassBorder: 'rgba(34, 197, 94, 0.22)',

  // Glow
  glowColor: '#22C55E',
  glowColorPrimary: '#22C55E',

  // Tab Bar
  tabBar: 'rgba(255, 255, 255, 0.96)',
  tabBarBorder: 'rgba(34, 197, 94, 0.20)',
  tabActive: '#22C55E',
  tabInactive: '#9CA3AF',
  
  // Inputs
  inputBackground: '#F9FAFB',
  inputBorder: '#D1D5DB',
  inputBorderFocused: '#22C55E',
  placeholder: '#9CA3AF',
  
  // Buttons
  buttonPrimary: '#22C55E',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#F3F4F6',
  buttonSecondaryText: '#374151',
  buttonDisabled: '#E5E7EB',
  buttonDisabledText: '#9CA3AF',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Shadows
  shadowColor: '#000000',
  
  // Gradients
  gradientPrimary: ['#22C55E', '#16A34A'],
  gradientSecondary: ['#3B82F6', '#2563EB'],
  gradientDark: ['#1F2937', '#111827'],
};

const darkColors = {
  // Backgrounds - ultra dark blue-black
  background: '#080C14',
  surface: '#0D1525',
  surfaceVariant: '#111E33',

  // Text
  text: '#E8F0FF',
  textSecondary: '#8BA5C8',
  textMuted: '#4D6A8A',
  textInverse: '#080C14',

  // Primary (Neon Green - NaturaPiscis brand)
  primary: '#00E676',
  primaryLight: '#69F0AE',
  primaryDark: '#00C853',

  // Secondary (Cyan Neon)
  secondary: '#00D4FF',
  secondaryLight: '#67E8F9',
  secondaryDark: '#0099BB',

  // Status
  success: '#00E676',
  successBg: 'rgba(0, 230, 118, 0.08)',
  warning: '#FFB74D',
  warningBg: 'rgba(255, 183, 77, 0.08)',
  error: '#FF5370',
  errorBg: 'rgba(255, 83, 112, 0.08)',
  info: '#00D4FF',
  infoBg: 'rgba(0, 212, 255, 0.08)',

  // Borders & Dividers
  border: 'rgba(0, 212, 255, 0.12)',
  divider: 'rgba(0, 212, 255, 0.07)',

  // Cards & Containers
  card: '#0D1525',
  cardBorder: 'rgba(0, 212, 255, 0.15)',
  cardGlass: 'rgba(13, 21, 37, 0.82)',
  cardGlassBorder: 'rgba(0, 212, 255, 0.22)',

  // Glow
  glowColor: '#00D4FF',
  glowColorPrimary: '#00E676',

  // Tab Bar
  tabBar: 'rgba(8, 12, 20, 0.94)',
  tabBarBorder: 'rgba(0, 212, 255, 0.22)',
  tabActive: '#00D4FF',
  tabInactive: '#2E4A6A',

  // Inputs
  inputBackground: '#0D1525',
  inputBorder: 'rgba(0, 212, 255, 0.15)',
  inputBorderFocused: '#00D4FF',
  placeholder: '#4D6A8A',

  // Buttons
  buttonPrimary: '#00E676',
  buttonPrimaryText: '#080C14',
  buttonSecondary: '#111E33',
  buttonSecondaryText: '#E8F0FF',
  buttonDisabled: '#111E33',
  buttonDisabledText: '#4D6A8A',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.75)',

  // Shadows
  shadowColor: '#00D4FF',

  // Gradients
  gradientPrimary: ['#00E676', '#00C853'],
  gradientSecondary: ['#00D4FF', '#0088BB'],
  gradientDark: ['#0D1525', '#080C14'],
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