// src/screens/auth/LoginScreen.jsx
// Pantalla de Login — Diseño futurista con glassmorphism y neón

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Image, Animated, Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import authService from '../../api/services/auth.service';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');
const GOOGLE_MOBILE_CLIENT_ID = '728810461626-05lrpoc2qr5udfo7apoh588nrkgjvig9.apps.googleusercontent.com';
const GOOGLE_WEB_CLIENT_ID    = '728810461626-oub4t291euvfforvp72l9ajs0ebv8pq3.apps.googleusercontent.com';

// ── Partículas flotantes de fondo ──
const FloatingParticle = ({ delay, size, x, y, color, duration }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(fade, { toValue: 0.7, duration: duration * 0.3, useNativeDriver: true }),
            Animated.timing(fade, { toValue: 0.15, duration: duration * 0.7, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: fade,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.4] }) }],
      shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: size,
    }} />
  );
};

const PARTICLES = [
  { delay: 0,    size: 3, x: width * 0.1,  y: height * 0.8, color: '#00F5FF', duration: 4000 },
  { delay: 400,  size: 2, x: width * 0.3,  y: height * 0.9, color: '#00FF88', duration: 3500 },
  { delay: 800,  size: 4, x: width * 0.5,  y: height * 0.75, color: '#00F5FF', duration: 4500 },
  { delay: 1200, size: 2, x: width * 0.7,  y: height * 0.85, color: '#BF5AF2', duration: 3800 },
  { delay: 1600, size: 3, x: width * 0.9,  y: height * 0.7, color: '#00FF88', duration: 4200 },
  { delay: 600,  size: 2, x: width * 0.2,  y: height * 0.6, color: '#00F5FF', duration: 5000 },
  { delay: 1000, size: 3, x: width * 0.8,  y: height * 0.95, color: '#22C55E', duration: 3600 },
  { delay: 200,  size: 2, x: width * 0.45, y: height * 0.65, color: '#BF5AF2', duration: 4800 },
];

const LoginScreen = ({ navigation }) => {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [rememberMe, setRememberMe]   = useState(false);
  const [emailFocused, setEmailFocused]   = useState(false);
  const [passFocused, setPassFocused]     = useState(false);

  const { login, loginWithData } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType]           = useState(null);
  const [googleLoading, setGoogleLoading]           = useState(false);

  // Animaciones
  const logoScale  = useRef(new Animated.Value(0.3)).current;
  const logoGlow   = useRef(new Animated.Value(0.2)).current;
  const formSlide  = useRef(new Animated.Value(40)).current;
  const formFade   = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;

  const [, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId:    GOOGLE_MOBILE_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    checkBiometric();
    // Animación de entrada
    Animated.stagger(150, [
      Animated.spring(logoScale, { toValue: 1, speed: 8, bounciness: 12, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(formFade,  { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
    // Logo glow pulsante
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(logoGlow, { toValue: 0.2, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    // Anillo rotatorio
    Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params?.id_token;
      if (idToken) handleGoogleToken(idToken);
    }
  }, [googleResponse]);

  const handleGoogleToken = async (idToken) => {
    setGoogleLoading(true);
    try {
      const result = await authService.loginGoogle(idToken);
      if (result.success) loginWithData(result.token, result.user);
      else setErrorMsg(result.error || 'Error al iniciar sesión con Google');
    } catch { setErrorMsg('Error al iniciar sesión con Google'); }
    finally { setGoogleLoading(false); }
  };

  const checkBiometric = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled   = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const isFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
        setBiometricType(isFace ? 'face' : 'fingerprint');
        setBiometricAvailable(true);
      }
    } catch {}
  };

  const handleBiometricLogin = async () => {
    try {
      const savedEmail    = await SecureStore.getItemAsync('saved_email');
      const savedPassword = await SecureStore.getItemAsync('saved_password');
      if (!savedEmail || !savedPassword) {
        setErrorMsg('Primero inicia sesión manualmente para activar la biometría');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad', cancelLabel: 'Cancelar', fallbackLabel: 'Usar contraseña',
      });
      if (result.success) {
        setIsLoading(true);
        const loginResult = await login(savedEmail, savedPassword);
        if (!loginResult.success) setErrorMsg('Error de autenticación');
        setIsLoading(false);
      }
    } catch { setErrorMsg('Error con biometría'); }
  };

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) { setErrorMsg('Por favor completa todos los campos'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // Micro-animación del botón
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, speed: 20, bounciness: 10, useNativeDriver: true }),
    ]).start();
    setIsLoading(true);
    try {
      if (rememberMe) {
        await SecureStore.setItemAsync('saved_email', email);
        await SecureStore.setItemAsync('saved_password', password);
      }
      const result = await login(email, password);
      if (!result.success) setErrorMsg(result.error || 'Error de credenciales');
    } catch { setErrorMsg('Error al iniciar sesión'); }
    finally { setIsLoading(false); }
  };

  const C = colors;
  const rotate = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const neonCyan = C.neonCyan || '#00F5FF';
  const neonGreen = C.neonGreen || '#00FF88';

  return (
    <View style={[s.container, { backgroundColor: C.background }]}>
      <StatusBar style="light" />
      {/* Fondo con gradiente profundo */}
      <LinearGradient
        colors={isDarkMode ? ['#030712', '#0A0F1E', '#071228', '#030712'] : [C.background, C.surfaceVariant, C.background]}
        style={StyleSheet.absoluteFill}
      />
      {/* Grid de fondo futurista */}
      {isDarkMode && (
        <View style={s.gridOverlay}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={`h${i}`} style={[s.gridLine, s.gridH, { top: (i + 1) * (height / 9) }]} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`v${i}`} style={[s.gridLine, s.gridV, { left: (i + 1) * (width / 7) }]} />
          ))}
        </View>
      )}
      {/* Orbs de luz difusa */}
      <View style={[s.orb, { backgroundColor: `${neonCyan}12`, top: -80, right: -60, width: 280, height: 280 }]} />
      <View style={[s.orb, { backgroundColor: `${neonGreen}0A`, bottom: 60, left: -80, width: 220, height: 220 }]} />
      <View style={[s.orb, { backgroundColor: 'rgba(191,90,242,0.06)', top: '35%', left: '50%', width: 160, height: 160 }]} />
      {/* Partículas flotantes */}
      {isDarkMode && PARTICLES.map((p, i) => <FloatingParticle key={i} {...p} />)}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.keyboardView}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Logo futurista ── */}
          <Animated.View style={[s.logoSection, { transform: [{ scale: logoScale }] }]}>
            {/* Anillo rotatorio */}
            <Animated.View style={[s.logoRing, { transform: [{ rotate }], borderColor: `${neonCyan}30` }]} />
            {/* Glow pulsante */}
            <Animated.View style={[s.logoGlow, { opacity: logoGlow, backgroundColor: `${neonCyan}15` }]} />
            {/* Círculo central */}
            <LinearGradient
              colors={[`${neonCyan}20`, `${neonGreen}10`, 'transparent']}
              style={s.logoCircle}
            >
              <View style={[s.logoInner, { borderColor: `${neonCyan}40` }]}>
                <Ionicons name="fish" size={40} color={neonCyan} />
              </View>
            </LinearGradient>
            <Text style={[s.title, { color: C.text, fontFamily: 'SpaceGrotesk-Bold' }]}>NaturaPiscis</Text>
            <Text style={[s.subtitle, { color: C.textMuted, fontFamily: 'SpaceGrotesk-Regular' }]}>Bienvenido de nuevo</Text>
          </Animated.View>

          {/* ── Error ── */}
          {errorMsg ? (
            <View style={[s.errorBox, { backgroundColor: `${C.error}15`, borderColor: `${C.error}40` }]}>
              <Ionicons name="alert-circle" size={18} color={C.error} />
              <Text style={[s.errorText, { color: C.error }]}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* ── Formulario ── */}
          <Animated.View style={[s.form, { transform: [{ translateY: formSlide }], opacity: formFade }]}>
            {/* Email */}
            <View style={s.inputGroup}>
              <Text style={[s.label, { color: C.textSecondary, fontFamily: 'SpaceGrotesk-Medium' }]}>Correo Electrónico</Text>
              <View style={[s.inputWrap, {
                backgroundColor: isDarkMode ? 'rgba(10,15,30,0.75)' : C.inputBackground,
                borderColor: emailFocused ? neonCyan : (isDarkMode ? 'rgba(0,245,255,0.12)' : C.inputBorder),
                shadowColor: emailFocused ? neonCyan : 'transparent',
                shadowOpacity: emailFocused ? 0.3 : 0,
                shadowRadius: emailFocused ? 12 : 0,
              }]}>
                <Ionicons name="mail-outline" size={18} color={emailFocused ? neonCyan : C.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[s.input, { color: C.text, fontFamily: 'SpaceGrotesk-Regular' }]}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={C.placeholder || C.textMuted}
                  value={email} onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.inputGroup}>
              <Text style={[s.label, { color: C.textSecondary, fontFamily: 'SpaceGrotesk-Medium' }]}>Contraseña</Text>
              <View style={[s.inputWrap, {
                backgroundColor: isDarkMode ? 'rgba(10,15,30,0.75)' : C.inputBackground,
                borderColor: passFocused ? neonCyan : (isDarkMode ? 'rgba(0,245,255,0.12)' : C.inputBorder),
                shadowColor: passFocused ? neonCyan : 'transparent',
                shadowOpacity: passFocused ? 0.3 : 0,
                shadowRadius: passFocused ? 12 : 0,
              }]}>
                <Ionicons name="lock-closed-outline" size={18} color={passFocused ? neonCyan : C.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[s.input, { color: C.text, fontFamily: 'SpaceGrotesk-Regular' }]}
                  placeholder="Tu contraseña"
                  placeholderTextColor={C.placeholder || C.textMuted}
                  value={password} onChangeText={setPassword}
                  onFocus={() => setPassFocused(true)} onBlur={() => setPassFocused(false)}
                  secureTextEntry={!showPassword} autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Biometría */}
            {biometricAvailable && (
              <TouchableOpacity style={[s.biometricBtn, { borderColor: `${neonCyan}25`, backgroundColor: isDarkMode ? 'rgba(0,245,255,0.05)' : C.surface }]} onPress={handleBiometricLogin} activeOpacity={0.8}>
                <View style={[s.bioRing, { borderColor: `${neonCyan}50` }]}>
                  <Ionicons name={biometricType === 'face' ? 'scan-outline' : 'finger-print-outline'} size={22} color={neonCyan} />
                </View>
                <Text style={[s.biometricText, { color: C.text, fontFamily: 'SpaceGrotesk-Medium' }]}>
                  {biometricType === 'face' ? 'Acceder con Face ID' : 'Acceder con huella'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Remember / Forgot */}
            <View style={s.optionsRow}>
              <TouchableOpacity style={s.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
                <View style={[s.checkbox, { borderColor: rememberMe ? neonCyan : `${C.textMuted}50` }, rememberMe && { backgroundColor: neonCyan, borderColor: neonCyan }]}>
                  {rememberMe && <Ionicons name="checkmark" size={13} color="#030712" />}
                </View>
                <Text style={[s.rememberText, { color: C.textSecondary, fontFamily: 'SpaceGrotesk-Regular' }]}>Recordarme</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={[s.forgotText, { color: neonCyan, fontFamily: 'SpaceGrotesk-Regular' }]}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Botón Login */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.85} style={s.loginBtnWrap}>
                <LinearGradient
                  colors={['#00FF88', '#22C55E', '#16a34a']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.loginBtn, isLoading && { opacity: 0.7 }]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#030712" size="small" />
                  ) : (
                    <>
                      <Text style={[s.loginBtnText, { fontFamily: 'SpaceGrotesk-Bold' }]}>Iniciar Sesión</Text>
                      <Ionicons name="arrow-forward-circle" size={20} color="#030712" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ── Divider ── */}
          <View style={s.divider}>
            <LinearGradient colors={['transparent', `${neonCyan}30`, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.dividerLine} />
            <Text style={[s.dividerText, { color: C.textMuted, fontFamily: 'SpaceGrotesk-Regular' }]}>o</Text>
            <LinearGradient colors={['transparent', `${neonCyan}30`, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.dividerLine} />
          </View>

          {/* ── Google ── */}
          <TouchableOpacity
            style={[s.googleBtn, { backgroundColor: isDarkMode ? 'rgba(10,15,30,0.75)' : C.surface, borderColor: isDarkMode ? 'rgba(0,245,255,0.12)' : C.border }]}
            onPress={() => promptGoogleAsync()} disabled={googleLoading} activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <Image source={{ uri: 'https://www.google.com/favicon.ico' }} style={s.googleIcon} />
                <Text style={[s.googleBtnText, { color: C.text, fontFamily: 'SpaceGrotesk-Medium' }]}>Continuar con Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── Footer ── */}
          <View style={s.footer}>
            <Text style={[s.footerText, { color: C.textSecondary, fontFamily: 'SpaceGrotesk-Regular' }]}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
              <Text style={[s.footerLink, { color: neonCyan, fontFamily: 'SpaceGrotesk-SemiBold' }]}>Regístrate</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={[s.appInfo, { borderTopColor: isDarkMode ? 'rgba(0,245,255,0.08)' : C.border }]}>
            <View style={[s.infoIcon, { backgroundColor: `${neonCyan}12`, borderColor: `${neonCyan}25` }]}>
              <Ionicons name="notifications-outline" size={14} color={neonCyan} />
            </View>
            <Text style={[s.appInfoText, { color: C.textMuted, fontFamily: 'SpaceGrotesk-Regular' }]}>
              Recibirás alertas en tiempo real de tus sensores
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  container:     { flex: 1 },
  keyboardView:  { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, justifyContent: 'center' },

  // Grid de fondo
  gridOverlay: { ...StyleSheet.absoluteFillObject },
  gridLine:    { position: 'absolute', backgroundColor: 'rgba(0,245,255,0.03)' },
  gridH:       { left: 0, right: 0, height: 1 },
  gridV:       { top: 0, bottom: 0, width: 1 },

  // Orbs
  orb: { position: 'absolute', borderRadius: 200 },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoRing: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    borderWidth: 1.5, borderStyle: 'dashed',
  },
  logoGlow: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
  },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  logoInner: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: 'rgba(0,245,255,0.06)', borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  title:    { fontSize: 32, letterSpacing: 0.5, marginBottom: 6 },
  subtitle: { fontSize: 15 },

  // Error
  errorBox: {
    borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  errorText: { fontSize: 13, flex: 1, fontFamily: 'SpaceGrotesk-Regular' },

  // Form
  form: { gap: 14 },
  inputGroup: { marginBottom: 2 },
  label: { fontSize: 13, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14,
    elevation: 4,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },

  // Biometric
  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5,
  },
  bioRing: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,245,255,0.06)',
  },
  biometricText: { fontSize: 15 },

  // Options
  optionsRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  rememberRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox:     { width: 20, height: 20, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  rememberText: { fontSize: 13 },
  forgotText:   { fontSize: 13 },

  // Login button
  loginBtnWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 6, shadowColor: '#00FF88', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12 },
  loginBtn:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 16 },
  loginBtnText: { fontSize: 16, color: '#030712', letterSpacing: 0.3 },

  // Divider
  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 16, fontSize: 13 },

  // Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, marginBottom: 16,
  },
  googleIcon:    { width: 20, height: 20 },
  googleBtnText: { fontSize: 15 },

  // Footer
  footer:     { flexDirection: 'row', justifyContent: 'center', marginBottom: 4 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },

  // App info
  appInfo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 24, paddingTop: 20, borderTopWidth: 1,
  },
  infoIcon: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  appInfoText: { fontSize: 12 },
});

export default LoginScreen;