// src/screens/auth/WelcomeScreen.jsx
// Pantalla de Bienvenida/Landing — Diseño futurista premium con glassmorphism, partículas flotantes y tipografía SpaceGrotesk

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/common/Button';

const { width, height } = Dimensions.get('window');

// ── Partículas flotantes holográficas de fondo ──
const FloatingParticle = ({ delay, size, x, y, color, duration }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(fade, { toValue: 0.65, duration: duration * 0.3, useNativeDriver: true }),
            Animated.timing(fade, { toValue: 0, duration: duration * 0.7, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: fade,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.55] }) }],
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: size,
      }}
    />
  );
};

const PARTICLES = [
  { delay: 0,    size: 4, x: width * 0.15, y: height * 0.85, color: '#4ade80', duration: 5000 },
  { delay: 500,  size: 3, x: width * 0.4,  y: height * 0.9,  color: '#22C55E', duration: 4200 },
  { delay: 1000, size: 5, x: width * 0.65, y: height * 0.8,  color: '#FF00E5', duration: 5500 },
  { delay: 1500, size: 3, x: width * 0.85, y: height * 0.75, color: '#4ade80', duration: 4800 },
  { delay: 800,  size: 4, x: width * 0.3,  y: height * 0.7,  color: '#BF5AF2', duration: 5200 },
  { delay: 2000, size: 3, x: width * 0.55, y: height * 0.88, color: '#22C55E', duration: 4000 },
];

const WelcomeScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();

  // Colores de acento neón
  const neonCyan = colors.neonCyan || '#4ade80';
  const neonGreen = colors.neonGreen || '#22C55E';
  const neonMagenta = colors.neonMagenta || '#FF00E5';

  // Animaciones para el logo
  const ringRotate1 = useRef(new Animated.Value(0)).current;
  const ringRotate2 = useRef(new Animated.Value(0)).current;
  const logoPulse   = useRef(new Animated.Value(1)).current;

  // Animaciones de entrada (fade-in escalonado)
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const fadeSubtitle = useRef(new Animated.Value(0)).current;
  const fadeButtons = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Rotación lenta de los anillos orbitales
    Animated.loop(
      Animated.timing(ringRotate1, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(ringRotate2, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 2. Pulso constante del logotipo del pez (efecto respiración holográfica)
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.06,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Entrada escalonada de textos y botones al montar la pantalla
    Animated.stagger(250, [
      Animated.timing(fadeTitle, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(fadeSubtitle, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(fadeButtons, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, []);

  const rotate1 = ringRotate1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotate2 = ringRotate2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  const handlePressAction = (screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    navigation.navigate(screen);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#030712' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Orbes de luz de fondo con difuminado para dar profundidad */}
      <View style={[styles.orb, { backgroundColor: `${neonCyan}12`, top: height * 0.12, left: -60 }]} />
      <View style={[styles.orb, { backgroundColor: `${neonMagenta}08`, bottom: height * 0.15, right: -80, width: 280, height: 280 }]} />

      {/* Partículas flotantes activadas solo en modo oscuro */}
      {isDarkMode && PARTICLES.map((p, idx) => (
        <FloatingParticle key={idx} {...p} />
      ))}

      <SafeAreaView style={styles.safe}>
        {/* LOGO SECCIÓN CENTRAL (Órbitas futuristas y Holograma del Pez) */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            {/* Anillo exterior orbitando a la derecha */}
            <Animated.View style={[styles.outerRing, { borderColor: `${neonCyan}30`, transform: [{ rotate: rotate1 }] }]} />
            
            {/* Anillo interior orbitando a la izquierda */}
            <Animated.View style={[styles.innerRing, { borderColor: `${neonGreen}25`, transform: [{ rotate: rotate2 }] }]} />

            {/* Círculo central con brillo de neón */}
            <Animated.View style={[
              styles.coreCircle,
              {
                backgroundColor: isDarkMode ? 'rgba(10, 15, 30, 0.72)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: `${neonCyan}50`,
                transform: [{ scale: logoPulse }],
                shadowColor: neonCyan,
                shadowRadius: 18,
                shadowOpacity: isDarkMode ? 0.35 : 0.18,
              }
            ]}>
              <LinearGradient
                colors={isDarkMode ? ['rgba(74,222,128, 0.12)', 'transparent'] : ['rgba(74,222,128, 0.05)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="fish" size={64} color={neonCyan} />
            </Animated.View>
          </View>
        </View>

        {/* CONTENIDO DE TEXTOS (Branding y Tipografía Space Grotesk) */}
        <View style={styles.textSection}>
          <Animated.View style={{ opacity: fadeTitle, transform: [{ translateY: fadeTitle.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            <Text style={[styles.title, { color: colors.text, fontFamily: 'SpaceGrotesk-Bold' }]}>
              NaturaPiscis
            </Text>
            {/* Pequeña línea de acento neón debajo del título */}
            <LinearGradient
              colors={[neonCyan, neonGreen, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleUnderline}
            />
          </Animated.View>

          <Animated.View style={{ opacity: fadeSubtitle, transform: [{ translateY: fadeSubtitle.interpolate({ inputRange: [0, 1], outputRange: [25, 0] }) }] }}>
            <Text style={[styles.subtitle, { color: colors.textSecondary || '#64748b', fontFamily: 'SpaceGrotesk-Regular' }]}>
              La revolución digital de la acuicultura local y sostenible en tus manos.
            </Text>
          </Animated.View>
        </View>

        {/* ACCIONES (Botones futuristas) */}
        <Animated.View
          style={[
            styles.actionSection,
            {
              opacity: fadeButtons,
              transform: [{ translateY: fadeButtons.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
            }
          ]}
        >
          {/* Botón de Iniciar Sesión (Variante Neón Gradiente) */}
          <Button
            title="Iniciar Sesión"
            variant="neon"
            neonColor={neonCyan}
            onPress={() => handlePressAction('Login')}
            style={styles.buttonSpacing}
          />

          {/* Botón de Crear Cuenta (Variante Glass Traslúcida) */}
          <Button
            title="Crear Cuenta"
            variant="glass"
            neonColor={neonGreen}
            onPress={() => handlePressAction('Registro')}
            style={styles.buttonSpacing}
          />

          {/* Enlace discreto de soporte o asistente */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color={isDarkMode ? `${colors.text}40` : '#94a3b8'} style={{ marginRight: 5 }} />
            <Text style={[styles.footerText, { color: isDarkMode ? `${colors.text}40` : '#94a3b8', fontFamily: 'SpaceGrotesk-Medium' }]}>
              Conexión Encriptada de Alta Seguridad
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  
  // Fondo orbes difusos
  orb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    ...Platform.select({
      ios: {
        filter: 'blur(55px)',
      },
      android: {
        opacity: 0.15,
      },
    }),
  },

  // Sección del Logo Héroe
  logoSection: {
    flex: 1.1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  logoContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  innerRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderStyle: 'dotted',
  },
  coreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 6,
      },
    }),
  },

  // Sección de Textos
  textSection: {
    flex: 0.6,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  titleUnderline: {
    height: 3,
    width: 90,
    borderRadius: 1.5,
    marginTop: 8,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 25,
    letterSpacing: 0.1,
  },

  // Sección de Acciones
  actionSection: {
    flex: 0.8,
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 12 : 24,
  },
  buttonSpacing: {
    marginBottom: 14,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
});

export default WelcomeScreen;
