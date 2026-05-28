// src/components/common/Button.jsx
// Componente de botón reutilizable — Diseño futurista con gradientes neón

import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  View, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, danger, success, ghost, neon, glass
  size = 'md', // sm, md, lg
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  neonColor,
  style,
  textStyle,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Micro-animación de escala
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, speed: 25, bounciness: 12, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };

  const isDisabled = disabled || loading;
  const nc = neonColor || '#4ade80';

  // Colores de icono según variante
  const iconColor = (() => {
    if (variant === 'outline' || variant === 'ghost') return COLORS.primary?.[500] || '#22C55E';
    if (variant === 'neon') return '#030712';
    if (variant === 'glass') return nc;
    return '#fff';
  })();

  // Para variantes con gradiente usamos LinearGradient interno
  const isGradient = variant === 'primary' || variant === 'neon';

  const gradientColors = (() => {
    if (variant === 'neon') return [nc, `${nc}cc`];
    if (variant === 'primary') return ['#22C55E', '#22C55E', '#16a34a'];
    return ['transparent', 'transparent'];
  })();

  const sizeStyles = (() => {
    switch (size) {
      case 'sm': return { py: 10, px: 14, fontSize: 13 };
      case 'lg': return { py: 18, px: 28, fontSize: 17 };
      default:   return { py: 15, px: 22, fontSize: 15 };
    }
  })();

  const baseStyle = (() => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: COLORS.background?.elevated || '#334155',
          borderWidth: 1, borderColor: 'rgba(74,222,128,0.1)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5, borderColor: `${COLORS.primary?.[500] || '#22C55E'}60`,
        };
      case 'danger':
        return { backgroundColor: COLORS.error?.main || '#EF4444' };
      case 'success':
        return { backgroundColor: COLORS.success?.main || '#22C55E' };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'glass':
        return {
          backgroundColor: 'rgba(10,15,30,0.72)',
          borderWidth: 1, borderColor: `${nc}20`,
          shadowColor: nc, shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
        };
      default: return {};
    }
  })();

  const textColor = (() => {
    switch (variant) {
      case 'outline': return COLORS.primary?.[500] || '#22C55E';
      case 'ghost': return COLORS.primary?.[500] || '#22C55E';
      case 'glass': return nc;
      case 'secondary': return COLORS.text?.primary || '#fff';
      case 'neon':
      case 'primary': return '#030712';
      default: return '#fff';
    }
  })();

  const content = (
    <View style={styles.content}>
      {icon && iconPosition === 'left' && (
        <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={iconColor} style={styles.iconLeft} />
      )}
      <Text style={[styles.text, { fontSize: sizeStyles.fontSize, color: textColor, fontFamily: 'SpaceGrotesk-SemiBold' }, textStyle]}>
        {title}
      </Text>
      {icon && iconPosition === 'right' && (
        <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={iconColor} style={styles.iconRight} />
      )}
    </View>
  );

  if (isGradient) {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && styles.fullWidth]}>
        <TouchableOpacity
          onPress={handlePress} disabled={isDisabled} activeOpacity={0.85}
          style={[styles.gradientWrap, isDisabled && styles.disabled,
            { shadowColor: variant === 'neon' ? nc : '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 10 },
            style,
          ]}
          {...props}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.gradient, { paddingVertical: sizeStyles.py, paddingHorizontal: sizeStyles.px }]}
          >
            {loading ? <ActivityIndicator color="#030712" size="small" /> : content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && styles.fullWidth]}>
      <TouchableOpacity
        onPress={handlePress} disabled={isDisabled} activeOpacity={0.85}
        style={[
          styles.base, baseStyle,
          { paddingVertical: sizeStyles.py, paddingHorizontal: sizeStyles.px },
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
        {...props}
      >
        {loading ? <ActivityIndicator color={textColor} size="small" /> : content}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});

export default Button;
