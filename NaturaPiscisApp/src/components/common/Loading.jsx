// src/components/common/Loading.jsx
// Componente de carga reutilizable

import React, { useRef, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING } from '../../constants/theme';

// Loading spinner simple
export const LoadingSpinner = ({ size = 'large', color }) => {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={color || colors.primary} />;
};

// Loading con logo de la app — splash animado (pez nadando + burbujas)
export const LoadingScreen = ({ message = 'Cargando...' }) => {
  const { colors } = useTheme();
  const primary = colors.primary;

  const logoScale   = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(12)).current;
  const ring        = useRef(new Animated.Value(0)).current;
  const fishX       = useRef(new Animated.Value(0)).current;
  const fishY       = useRef(new Animated.Value(0)).current;
  const fishFlip    = useRef(new Animated.Value(1)).current;
  const bubbles     = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    let alive = true;

    // Entrada del logo
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, speed: 11, bounciness: 16, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();

    // Texto: fade + slide-up
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
      Animated.timing(textY, { toValue: 0, duration: 600, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Anillo de pulso expandiéndose
    Animated.loop(Animated.timing(ring, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true })).start();

    // Burbujas subiendo
    bubbles.forEach((b, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 550),
        Animated.timing(b, { toValue: 1, duration: 1700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(b, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])).start();
    });

    // Pez nadando izquierda ↔ derecha con cabeceo y giro
    const swim = (dir) => {
      if (!alive) return;
      Animated.parallel([
        Animated.timing(fishX, { toValue: dir * 22, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(fishY, { toValue: -6, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(fishY, { toValue: 6, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ]).start(() => {
        Animated.timing(fishFlip, { toValue: -dir, duration: 180, useNativeDriver: true }).start(() => swim(-dir));
      });
    };
    swim(1);

    return () => { alive = false; };
  }, []);

  const ringScale   = ring.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.9] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.2, 0] });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: 'center', justifyContent: 'center' }}>
        {/* Anillo de pulso */}
        <Animated.View style={{
          position: 'absolute', width: 100, height: 100, borderRadius: 50,
          borderWidth: 2, borderColor: primary,
          opacity: ringOpacity, transform: [{ scale: ringScale }],
        }} />

        {/* Tanque circular con el pez */}
        <View style={[styles.logoContainer, { backgroundColor: primary + '20', overflow: 'hidden' }]}>
          <Animated.View style={{ transform: [{ translateX: fishX }, { translateY: fishY }, { scaleX: fishFlip }] }}>
            <Ionicons name="fish" size={48} color={primary} />
          </Animated.View>

          {/* Burbujas */}
          {bubbles.map((b, i) => (
            <Animated.View key={i} style={{
              position: 'absolute', bottom: 14,
              left: 30 + i * 16,
              width: 6 + i * 2, height: 6 + i * 2, borderRadius: 6,
              borderWidth: 1.5, borderColor: primary,
              opacity: b.interpolate({ inputRange: [0, 0.2, 0.85, 1], outputRange: [0, 0.85, 0.4, 0] }),
              transform: [{ translateY: b.interpolate({ inputRange: [0, 1], outputRange: [0, -64] }) }],
            }} />
          ))}
        </View>
      </Animated.View>

      <Animated.Text style={[styles.title, { color: colors.text, opacity: textOpacity, transform: [{ translateY: textY }] }]}>
        NaturaPiscis
      </Animated.Text>
      <ActivityIndicator size="large" color={primary} style={styles.spinner} />
      <Animated.Text style={[styles.message, { color: colors.textSecondary, opacity: textOpacity }]}>{message}</Animated.Text>
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
