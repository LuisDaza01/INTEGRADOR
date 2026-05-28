// src/components/common/Loading.jsx
// Componentes de carga reutilizables — Diseño futurista con neón

import React, { useRef, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING } from '../../constants/theme';

// Loading spinner simple
export const LoadingSpinner = ({ size = 'large', color }) => {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={color || colors.neonCyan || colors.primary} />;
};

// Loading con logo — splash futurista con anillos neón y partículas
export const LoadingScreen = ({ message = 'Cargando...' }) => {
  const { colors, isDarkMode } = useTheme();
  const neonCyan  = colors.neonCyan  || '#4ade80';
  const neonGreen = colors.neonGreen || '#22C55E';

  const logoScale   = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(12)).current;
  const ring1       = useRef(new Animated.Value(0)).current;
  const ring2       = useRef(new Animated.Value(0)).current;
  const outerRotate = useRef(new Animated.Value(0)).current;
  const innerRotate = useRef(new Animated.Value(0)).current;
  const fishX       = useRef(new Animated.Value(0)).current;
  const fishY       = useRef(new Animated.Value(0)).current;
  const fishFlip    = useRef(new Animated.Value(1)).current;
  const glowPulse   = useRef(new Animated.Value(0.3)).current;
  const dots        = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const bubbles     = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    let alive = true;

    // Entrada del logo con spring
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, speed: 8, bounciness: 14, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Texto: fade + slide-up
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 600, delay: 350, useNativeDriver: true }),
      Animated.timing(textY, { toValue: 0, duration: 600, delay: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Anillos de pulso neón
    Animated.loop(Animated.timing(ring1, { toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.delay(800),
      Animated.timing(ring2, { toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(ring2, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start();

    // Rotaciones de anillos decorativos
    Animated.loop(Animated.timing(outerRotate, { toValue: 1, duration: 10000, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(innerRotate, { toValue: 1, duration: 6000, useNativeDriver: true })).start();

    // Glow pulsante
    Animated.loop(Animated.sequence([
      Animated.timing(glowPulse, { toValue: 0.7, duration: 1500, useNativeDriver: true }),
      Animated.timing(glowPulse, { toValue: 0.2, duration: 1500, useNativeDriver: true }),
    ])).start();

    // Burbujas neón subiendo
    bubbles.forEach((b, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 600),
        Animated.timing(b, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(b, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])).start();
    });

    // Dots de "cargando" secuenciales
    dots.forEach((d, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 300),
        Animated.timing(d, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])).start();
    });

    // Pez nadando con cabeceo
    const swim = (dir) => {
      if (!alive) return;
      Animated.parallel([
        Animated.timing(fishX, { toValue: dir * 18, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(fishY, { toValue: -5, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(fishY, { toValue: 5, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ]).start(() => {
        Animated.timing(fishFlip, { toValue: -dir, duration: 180, useNativeDriver: true }).start(() => swim(-dir));
      });
    };
    swim(1);

    return () => { alive = false; };
  }, []);

  const ring1Scale   = ring1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.0] });
  const ring1Opacity = ring1.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.5, 0.15, 0] });
  const ring2Scale   = ring2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.8] });
  const ring2Opacity = ring2.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.4, 0.1, 0] });
  const outerRot     = outerRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const innerRot     = innerRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDarkMode ? ['#030712', '#0A0F1E', '#030712'] : [colors.background, colors.surfaceVariant, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: 'center', justifyContent: 'center' }}>
        {/* Anillos de pulso neón */}
        <Animated.View style={{
          position: 'absolute', width: 110, height: 110, borderRadius: 55,
          borderWidth: 1.5, borderColor: neonCyan,
          opacity: ring1Opacity, transform: [{ scale: ring1Scale }],
        }} />
        <Animated.View style={{
          position: 'absolute', width: 110, height: 110, borderRadius: 55,
          borderWidth: 1, borderColor: neonGreen,
          opacity: ring2Opacity, transform: [{ scale: ring2Scale }],
        }} />

        {/* Anillo decorativo exterior (rota) */}
        <Animated.View style={{
          position: 'absolute', width: 140, height: 140, borderRadius: 70,
          borderWidth: 1, borderStyle: 'dashed', borderColor: `${neonCyan}25`,
          transform: [{ rotate: outerRot }],
        }} />

        {/* Anillo decorativo interior (rota inverso) */}
        <Animated.View style={{
          position: 'absolute', width: 120, height: 120, borderRadius: 60,
          borderWidth: 0.5, borderColor: `${neonGreen}20`,
          transform: [{ rotate: innerRot }],
        }} />

        {/* Glow pulsante */}
        <Animated.View style={{
          position: 'absolute', width: 130, height: 130, borderRadius: 65,
          backgroundColor: `${neonCyan}10`, opacity: glowPulse,
        }} />

        {/* Círculo central con el pez */}
        <View style={[styles.logoContainer, { backgroundColor: `${neonCyan}10`, borderColor: `${neonCyan}30`, borderWidth: 1.5 }]}>
          <Animated.View style={{ transform: [{ translateX: fishX }, { translateY: fishY }, { scaleX: fishFlip }] }}>
            <Ionicons name="fish" size={44} color={neonCyan} />
          </Animated.View>
          {/* Burbujas neón */}
          {bubbles.map((b, i) => (
            <Animated.View key={i} style={{
              position: 'absolute', bottom: 14,
              left: 28 + i * 16,
              width: 5 + i * 2, height: 5 + i * 2, borderRadius: 6,
              borderWidth: 1.5, borderColor: neonCyan,
              backgroundColor: `${neonCyan}20`,
              opacity: b.interpolate({ inputRange: [0, 0.2, 0.85, 1], outputRange: [0, 0.85, 0.4, 0] }),
              transform: [{ translateY: b.interpolate({ inputRange: [0, 1], outputRange: [0, -58] }) }],
            }} />
          ))}
        </View>
      </Animated.View>

      <Animated.Text style={[styles.title, { color: colors.text, fontFamily: 'SpaceGrotesk-Bold', opacity: textOpacity, transform: [{ translateY: textY }],
        textShadowColor: `${neonCyan}40`, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
      }]}>
        NaturaPiscis
      </Animated.Text>

      {/* Dots de carga animados */}
      <View style={styles.dotsRow}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: neonCyan, marginHorizontal: 4,
            opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
            transform: [{ scale: d.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] }) }],
            shadowColor: neonCyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6,
          }} />
        ))}
      </View>

      <Animated.Text style={[styles.message, { color: colors.textMuted, fontFamily: 'SpaceGrotesk-Regular', opacity: textOpacity,
        letterSpacing: 2, textTransform: 'uppercase',
      }]}>{message}</Animated.Text>
    </View>
  );
};

// Loading overlay (para poner sobre contenido)
export const LoadingOverlay = ({ visible, message }) => {
  const { colors, isDarkMode } = useTheme();
  const neonCyan = colors.neonCyan || '#4ade80';

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: isDarkMode ? 'rgba(3,7,18,0.85)' : colors.overlay }]}>
      <View style={[styles.overlayContent, {
        backgroundColor: isDarkMode ? 'rgba(10,15,30,0.9)' : colors.surface,
        borderWidth: 1, borderColor: `${neonCyan}20`, borderRadius: 20,
      }]}>
        <ActivityIndicator size="large" color={neonCyan} />
        {message && <Text style={[styles.overlayMessage, { color: colors.text, fontFamily: 'SpaceGrotesk-Medium' }]}>{message}</Text>}
      </View>
    </View>
  );
};

// Loading inline (para dentro de cards o secciones)
export const LoadingInline = ({ message }) => {
  const { colors } = useTheme();
  const neonCyan = colors.neonCyan || '#4ade80';

  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={neonCyan} />
      {message && <Text style={[styles.inlineMessage, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Regular' }]}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg,
  },
  logoContainer: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  title: {
    fontSize: 28, letterSpacing: 1, marginBottom: SPACING.lg,
  },
  dotsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  message: {
    fontSize: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', zIndex: 999,
  },
  overlayContent: {
    padding: SPACING.xl, alignItems: 'center',
  },
  overlayMessage: {
    marginTop: SPACING.md, fontSize: 14,
  },
  inline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.lg,
  },
  inlineMessage: {
    marginLeft: SPACING.sm, fontSize: 14,
  },
});

export default LoadingScreen;
