import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { FavoritosProvider } from './src/contexts/FavoritosContext';
import { CarritoProvider } from './src/contexts/CarritoContext';
import AppNavigator from './src/navigation/AppNavigator';

// ── Splash futurista mientras cargan las fuentes ──
const FuturisticSplash = () => {
  const ringRotate = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(0.8)).current;
  const fadeIn     = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.loop(
        Animated.timing(ringRotate, { toValue: 1, duration: 3000, useNativeDriver: true })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.1, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
        ])
      ),
      Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowPulse, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, []);

  const rotate = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={splashStyles.container}>
      <LinearGradient colors={['#030712', '#0A0F1E', '#030712']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[splashStyles.center, { opacity: fadeIn }]}>  
        {/* Anillo exterior rotatorio */}
        <Animated.View style={[splashStyles.outerRing, { transform: [{ rotate }] }]}>
          <LinearGradient
            colors={['#00F5FF', '#00FF88', '#22C55E', '#00F5FF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={splashStyles.ringGradient}
          />
        </Animated.View>
        {/* Glow pulsante */}
        <Animated.View style={[splashStyles.glow, { transform: [{ scale: pulseScale }], opacity: glowPulse }]} />
        {/* Icono central */}
        <View style={splashStyles.iconCircle}>
          <Text style={splashStyles.iconText}>🐟</Text>
        </View>
        {/* Nombre */}
        <Text style={splashStyles.title}>NaturaPiscis</Text>
        <Text style={splashStyles.subtitle}>Cargando...</Text>
      </Animated.View>
    </View>
  );
};

const splashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  outerRing: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    borderWidth: 2, borderColor: 'transparent', overflow: 'hidden',
  },
  ringGradient: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 2, borderColor: '#00F5FF',
    backgroundColor: 'transparent',
  },
  glow: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(0,245,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(0,245,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  iconText: { fontSize: 48 },
  title:    { fontSize: 28, fontWeight: '800', color: '#F1F5F9', letterSpacing: 1, marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(0,245,255,0.6)', letterSpacing: 2, textTransform: 'uppercase' },
});

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const loadFonts = useCallback(async () => {
    try {
      await Font.loadAsync({
        'SpaceGrotesk-Regular':  require('@expo-google-fonts/space-grotesk/SpaceGrotesk_400Regular.ttf'),
        'SpaceGrotesk-Medium':   require('@expo-google-fonts/space-grotesk/SpaceGrotesk_500Medium.ttf'),
        'SpaceGrotesk-SemiBold': require('@expo-google-fonts/space-grotesk/SpaceGrotesk_600SemiBold.ttf'),
        'SpaceGrotesk-Bold':     require('@expo-google-fonts/space-grotesk/SpaceGrotesk_700Bold.ttf'),
      });
    } catch (e) {
      // Si falla la carga de fuentes, continuamos con la fuente del sistema
      if (__DEV__) console.warn('⚠️ No se pudieron cargar las fuentes Space Grotesk:', e?.message);
    } finally {
      setFontsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFonts();
  }, [loadFonts]);

  if (!fontsLoaded) {
    return <FuturisticSplash />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <FavoritosProvider>
              <CarritoProvider>
                <AppNavigator />
              </CarritoProvider>
            </FavoritosProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
