// src/screens/auth/OnboardingScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  FlatList, Animated, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'fresh',
    icon: 'fish',
    accent: '#22d3ee',
    bg: ['#04111f', '#061d36', '#08244a'],
    orb1: 'rgba(34,211,238,0.18)',
    orb2: 'rgba(14,165,233,0.1)',
    title: 'Pescado fresco\ndel Chapare',
    subtitle: 'Compra directamente a productores de la región piscícola del Chapare, Cochabamba. Sin intermediarios.',
    particles: ['#22d3ee', '#0ea5e9', '#67e8f9', '#38bdf8'],
  },
  {
    key: 'iot',
    icon: 'pulse',
    accent: '#4ade80',
    bg: ['#04120f', '#061e16', '#082b1e'],
    orb1: 'rgba(74,222,128,0.18)',
    orb2: 'rgba(5,150,105,0.1)',
    title: 'Monitoreo IoT\nen tiempo real',
    subtitle: 'Sensores ESP32 monitorizan temperatura, pH y turbidez del agua las 24 horas del día.',
    particles: ['#4ade80', '#22C55E', '#6ee7b7', '#059669'],
  },
  {
    key: 'track',
    icon: 'qr-code',
    accent: '#a78bfa',
    bg: ['#0e0420', '#180836', '#1e0d45'],
    orb1: 'rgba(167,139,250,0.18)',
    orb2: 'rgba(124,58,237,0.1)',
    title: 'Trazabilidad\ny entrega rápida',
    subtitle: 'Escanea el QR del producto y conoce toda su historia. Rastrea tu pedido en tiempo real con GPS.',
    particles: ['#a78bfa', '#8b5cf6', '#c4b5fd', '#7c3aed'],
  },
];

// Floating particle dots around the icon
const Particles = ({ colors, anim }) => {
  const count = 8;
  const dots = Array.from({ length: count }, (_, i) => {
    const angle  = (i / count) * Math.PI * 2;
    const radius = 105 + (i % 3) * 14;
    const size   = 4 + (i % 4) * 2;
    const color  = colors[i % colors.length];
    const delay  = i * 110;

    const float = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, { toValue: 1, duration: 1800 + delay, useNativeDriver: true }),
          Animated.timing(float, { toValue: 0, duration: 1800 + delay, useNativeDriver: true }),
        ])
      ).start();
    }, []);

    const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
    const opacity    = float.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 0.85, 0.35] });

    return (
      <Animated.View key={i} style={{
        position: 'absolute',
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        transform: [
          { translateX: Math.cos(angle) * radius },
          { translateY: Animated.add(
              new Animated.Value(Math.sin(angle) * radius),
              translateY
            )
          },
        ],
        opacity,
        shadowColor: color, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, shadowRadius: 4,
      }} />
    );
  });
  return <View style={{ position: 'absolute', width: 0, height: 0 }}>{dots}</View>;
};

// Animated icon ring
const IconRing = ({ accent, icon, enterAnim }) => {
  const rotAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 12 }),
      Animated.timing(opacAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(rotAnim, { toValue: 1, duration: 12000, useNativeDriver: true })
      ),
    ]).start();
  }, [accent]);

  const rotate = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacAnim, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer dashed ring (rotates) */}
      <Animated.View style={[styles.outerRing, {
        borderColor: accent + '25',
        transform: [{ rotate }],
      }]} />
      {/* Mid ring */}
      <View style={[styles.midRing, { borderColor: accent + '35' }]} />
      {/* Icon container */}
      <LinearGradient
        colors={[accent + '28', accent + '12', 'transparent']}
        style={styles.iconCircle}>
        <View style={[styles.iconInner, { backgroundColor: accent + '20', borderColor: accent + '50' }]}>
          <Ionicons name={icon} size={68} color={accent} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const SlideItem = ({ item, width }) => {
  const slideAnim = useRef(new Animated.Value(0.85)).current;
  const textAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 8 }),
      Animated.timing(textAnim,  { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      {/* Background glow orbs */}
      <View style={[styles.orb, { backgroundColor: item.orb1, top: height * 0.05, left: '5%' }]} />
      <View style={[styles.orb, { backgroundColor: item.orb2, bottom: height * 0.1, right: '5%', width: 260, height: 260, borderRadius: 130 }]} />

      {/* Animated icon + particles */}
      <Animated.View style={{ transform: [{ scale: slideAnim }], marginBottom: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Particles colors={item.particles} />
        <IconRing accent={item.accent} icon={item.icon} />
      </Animated.View>

      {/* Text */}
      <Animated.View style={{ opacity: textAnim, transform: [{ translateY: textAnim.interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }] }}>
        <Text style={[styles.slideTitle, { color: '#f1f5f9' }]}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </Animated.View>
    </View>
  );
};

const OnboardingScreen = ({ navigation }) => {
  const [current, setCurrent] = useState(0);
  const flatRef  = useRef(null);
  const dotScale = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.6))).current;

  const goTo = (idx) => {
    if (idx < 0 || idx >= SLIDES.length) return;
    flatRef.current?.scrollToIndex({ index: idx, animated: true });
    Animated.parallel([
      Animated.spring(dotScale[current], { toValue: 0.6, useNativeDriver: true, speed: 20 }),
      Animated.spring(dotScale[idx],     { toValue: 1,   useNativeDriver: true, speed: 20, bounciness: 14 }),
    ]).start();
    setCurrent(idx);
  };

  const handleNext = async () => {
    if (current < SLIDES.length - 1) {
      goTo(current + 1);
    } else {
      await finish();
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    navigation.replace('Welcome');
  };

  const slide = SLIDES[current];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {/* Full-screen background gradient per slide */}
      <LinearGradient colors={slide.bg} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe}>
        {/* Skip button */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.skipBtn} onPress={finish}>
            <Text style={styles.skipText}>Saltar</Text>
          </TouchableOpacity>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatRef}
          data={SLIDES}
          keyExtractor={s => s.key}
          horizontal
          pagingEnabled
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            if (idx !== current) goTo(idx);
          }}
          renderItem={({ item }) => <SlideItem item={item} width={width} />}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          style={{ flex: 1 }}
        />

        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => (
            <TouchableOpacity key={s.key} onPress={() => goTo(i)}>
              <Animated.View style={[
                styles.dot,
                {
                  backgroundColor: SLIDES[current].accent,
                  transform: [{ scale: dotScale[i] }],
                  width: i === current ? 28 : 8,
                  opacity: i === current ? 1 : 0.35,
                },
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Primary button */}
        <TouchableOpacity onPress={handleNext} activeOpacity={0.87} style={styles.btnWrap}>
          <LinearGradient
            colors={[slide.accent, slide.accent + 'cc']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btn}>
            <Text style={[styles.btnText, { color: slide.bg[2] }]}>
              {current === SLIDES.length - 1 ? 'Comenzar' : 'Siguiente'}
            </Text>
            <Ionicons
              name={current === SLIDES.length - 1 ? 'checkmark-circle' : 'arrow-forward-circle'}
              size={22} color={slide.bg[2]}
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Last slide: login link */}
        {current === SLIDES.length - 1 && (
          <TouchableOpacity onPress={finish} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Ya tengo una cuenta →</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 16 }} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#04111f' },
  safe:      { flex: 1 },
  topRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 4 },
  skipBtn:   { paddingVertical: 10, paddingHorizontal: 4 },
  skipText:  { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '500' },

  // Background orbs
  orb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, filter: 'blur(60px)' },

  // Icon ring
  outerRing: { position: 'absolute', width: 230, height: 230, borderRadius: 115, borderWidth: 1, borderStyle: 'dashed' },
  midRing:   { position: 'absolute', width: 185, height: 185, borderRadius: 93, borderWidth: 1 },
  iconCircle:{ width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  iconInner: { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },

  // Slide text
  slideTitle:    { fontSize: 30, fontWeight: '800', color: '#f1f5f9', textAlign: 'center', lineHeight: 38, marginBottom: 14 },
  slideSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.62)', textAlign: 'center', lineHeight: 23, paddingHorizontal: 4 },

  // Dots
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 24 },
  dot:     { height: 8, borderRadius: 4 },

  // Button
  btnWrap: { marginHorizontal: 24, borderRadius: 18, overflow: 'hidden', marginBottom: 12,
             shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12 },
  btn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  btnText: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

  // Login link
  loginLink:     { alignSelf: 'center', paddingVertical: 6 },
  loginLinkText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecorationLine: 'underline' },
});

export default OnboardingScreen;
