// src/components/common/Card.jsx
// Componente de tarjeta reutilizable — Diseño futurista con glassmorphism y neón

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

export const Card = ({
  children,
  variant = 'default', // default | elevated | outlined | glass | neon
  neonColor,
  onPress,
  style,
  shimmer = false,
  ...props
}) => {
  const { colors, isDarkMode } = useTheme();
  const neonCyan = colors.neonCyan || '#00F5FF';
  const Component = onPress ? TouchableOpacity : View;

  const variantStyle = (() => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: isDarkMode ? '#0A0F1E' : colors.card,
          borderWidth: 1,
          borderColor: isDarkMode ? `${neonCyan}12` : colors.cardBorder,
          shadowColor: isDarkMode ? neonCyan : '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.2 : 0.12,
          shadowRadius: 16,
          elevation: 8,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: isDarkMode ? `${neonCyan}25` : colors.cardBorder,
          borderWidth: 1.5,
        };
      case 'glass':
        return {
          backgroundColor: isDarkMode ? 'rgba(10,15,30,0.75)' : 'rgba(255,255,255,0.85)',
          borderColor: isDarkMode ? `${neonCyan}15` : colors.cardGlassBorder,
          borderWidth: 1,
          shadowColor: isDarkMode ? neonCyan : '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.15 : 0.08,
          shadowRadius: 20,
          elevation: 10,
        };
      case 'neon':
        const nc = neonColor || neonCyan;
        return {
          backgroundColor: isDarkMode ? 'rgba(10,15,30,0.8)' : colors.card,
          borderColor: `${nc}30`,
          borderWidth: 1.5,
          shadowColor: nc,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.35,
          shadowRadius: 18,
          elevation: 12,
        };
      default:
        return {
          backgroundColor: isDarkMode ? '#0A0F1E' : colors.card,
          borderColor: isDarkMode ? `${neonCyan}10` : colors.cardBorder,
          borderWidth: 1,
        };
    }
  })();

  return (
    <Component onPress={onPress} activeOpacity={0.85} style={[styles.card, variantStyle, style]} {...props}>
      {/* Shimmer line neón en la parte superior */}
      {shimmer && isDarkMode && (
        <LinearGradient
          colors={['transparent', `${neonColor || neonCyan}30`, `${colors.neonGreen || '#00FF88'}20`, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.shimmerLine}
        />
      )}
      {children}
    </Component>
  );
};

export const CardHeader = ({ children, title, subtitle, action, style }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerContent}>
        {title && <Text style={[styles.title, { color: colors.text, fontFamily: 'SpaceGrotesk-SemiBold' }]}>{title}</Text>}
        {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Regular' }]}>{subtitle}</Text>}
        {children}
      </View>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
};

export const CardBody = ({ children, style }) => (
  <View style={[styles.body, style]}>{children}</View>
);

export const CardFooter = ({ children, style }) => {
  const { colors, isDarkMode } = useTheme();
  const neonCyan = colors.neonCyan || '#00F5FF';
  return (
    <View style={[styles.footer, { borderTopColor: isDarkMode ? `${neonCyan}08` : colors.divider }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  shimmerLine: {
    position: 'absolute', top: 0, left: 16, right: 16, height: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  action: {
    marginLeft: SPACING.sm,
  },
  body: {
    marginVertical: SPACING.xs,
  },
  footer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
});

export default Card;
