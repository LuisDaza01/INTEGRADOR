// src/components/common/Loading.jsx
// Componente de carga reutilizable

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING } from '../../constants/theme';

// Loading spinner simple
export const LoadingSpinner = ({ size = 'large', color }) => {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={color || colors.primary} />;
};

// Loading con logo de la app
export const LoadingScreen = ({ message = 'Cargando...' }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name="fish" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>NaturaPiscis</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
};

// Loading overlay (para poner sobre contenido)
export const LoadingOverlay = ({ visible, message }) => {
  const { colors } = useTheme();
  
  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
      <View style={[styles.overlayContent, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        {message && <Text style={[styles.overlayMessage, { color: colors.text }]}>{message}</Text>}
      </View>
    </View>
  );
};

// Loading inline (para dentro de cards o secciones)
export const LoadingInline = ({ message }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={colors.primary} />
      {message && <Text style={[styles.inlineMessage, { color: colors.textSecondary }]}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  spinner: {
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayContent: {
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  overlayMessage: {
    marginTop: SPACING.md,
    fontSize: 14,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  inlineMessage: {
    marginLeft: SPACING.sm,
    fontSize: 14,
  },
});

export default LoadingScreen;
