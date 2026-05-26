// src/screens/auth/RegistroScreen.jsx
// Pantalla de Registro — mismo lenguaje visual que LoginScreen: glassmorphism + neón
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  Animated, Dimensions, Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import api from '../../api/axios.config';
import authService from '../../api/services/auth.service';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

// Mismos client IDs que LoginScreen — el backend registra o loguea según corresponda.
const GOOGLE_MOBILE_CLIENT_ID = '728810461626-05lrpoc2qr5udfo7apoh588nrkgjvig9.apps.googleusercontent.com';
const GOOGLE_WEB_CLIENT_ID    = '728810461626-oub4t291euvfforvp72l9ajs0ebv8pq3.apps.googleusercontent.com';

const FIELDS = [
  { key: 'nombre',   label: 'Nombre completo',     icon: 'person-outline',      keyboard: 'default',       secure: false },
  { key: 'email',    label: 'Correo electrónico',  icon: 'mail-outline',        keyboard: 'email-address', secure: false },
  { key: 'telefono', label: 'Teléfono',            icon: 'call-outline',        keyboard: 'phone-pad',     secure: false },
  { key: 'password', label: 'Contraseña',          icon: 'lock-closed-outline', keyboard: 'default',       secure: true  },
  { key: 'confirm',  label: 'Confirmar contraseña', icon: 'lock-closed-outline', keyboard: 'default',       secure: true  },
];

// ── Partículas flotantes de fondo (igual que Login) ──
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
  { delay: 0,    size: 3, x: width * 0.1,  y: height * 0.8,  color: '#00F5FF', duration: 4000 },
  { delay: 400,  size: 2, x: width * 0.3,  y: height * 0.9,  color: '#00FF88', duration: 3500 },
  { delay: 800,  size: 4, x: width * 0.5,  y: height * 0.75, color: '#00F5FF', duration: 4500 },
  { delay: 1200, size: 2, x: width * 0.7,  y: height * 0.85, color: '#BF5AF2', duration: 3800 },
  { delay: 1600, size: 3, x: width * 0.9,  y: height * 0.7,  color: '#00FF88', duration: 4200 },
  { delay: 600,  size: 2, x: width * 0.2,  y: height * 0.6,  color: '#00F5FF', duration: 5000 },
  { delay: 1000, size: 3, x: width * 0.8,  y: height * 0.95, color: '#22C55E', duration: 3600 },
  { delay: 200,  size: 2, x: width * 0.45, y: height * 0.65, color: '#BF5AF2', duration: 4800 },
];

const RegistroScreen = ({ navigation }) => {
  const { login, loginWithData } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const C = colors;
  const neonCyan  = C.neonCyan  || '#00F5FF';
  const neonGreen = C.neonGreen || '#00FF88';

  const [form, setForm]             = useState({ nombre: '', email: '', telefono: '', password: '', confirm: '' });
  const [showPass, setShowPass]     = useState({ password: false, confirm: false });
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState({});
  const [focusedField, setFocused]  = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId:    GOOGLE_MOBILE_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

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
      else Alert.alert('Error', result.error || 'No se pudo registrar con Google');
    } catch {
      Alert.alert('Error', 'No se pudo registrar con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Animaciones de entrada (igual que Login)
  const logoScale  = useRef(new Animated.Value(0.3)).current;
  const logoGlow   = useRef(new Animated.Value(0.2)).current;
  const formSlide  = useRef(new Animated.Value(40)).current;
  const formFade   = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(logoScale, { toValue: 1, speed: 8, bounciness: 12, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(formFade,  { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(logoGlow, { toValue: 0.2, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();
  }, []);

  const rotate = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const validate = () => {
    const e = {};
    if (!form.nombre.trim() || form.nombre.length < 3) e.nombre = 'Mínimo 3 caracteres';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email no válido';
    if (form.telefono && !/^\+?\d{7,15}$/.test(form.telefono)) e.telefono = 'Teléfono no válido';
    if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirm) e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegistro = async () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, speed: 20, bounciness: 10, useNativeDriver: true }),
    ]).start();
    setLoading(true);
    try {
      const res = await api.post('/auth/registro', {
        nombre:   form.nombre.trim(),
        email:    form.email.trim().toLowerCase(),
        telefono: form.telefono.trim() || undefined,
        password: form.password,
        rol_id:   3, // consumidor
      });
      if (res.data?.success || res.data?.token) {
        const loginResult = await login(form.email.trim().toLowerCase(), form.password);
        if (!loginResult.success) {
          Alert.alert('Registro exitoso', 'Tu cuenta fue creada. Por favor inicia sesión.', [
            { text: 'Ir al login', onPress: () => navigation.replace('Login') }
          ]);
        }
      } else {
        Alert.alert('Error', res.data?.message || 'No se pudo crear la cuenta');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Error al crear la cuenta';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Orbs */}
      <View style={[s.orb, { backgroundColor: `${neonCyan}12`,  top: -80, right: -60, width: 280, height: 280 }]} />
      <View style={[s.orb, { backgroundColor: `${neonGreen}0A`, bottom: 60, left: -80, width: 220, height: 220 }]} />
      <View style={[s.orb, { backgroundColor: 'rgba(191,90,242,0.06)', top: '35%', left: '50%', width: 160, height: 160 }]} />

      {/* Partículas */}
      {isDarkMode && PARTICLES.map((p, i) => <FloatingParticle key={i} {...p} />)}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.keyboardView}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back button flotante (esquina superior izquierda) */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[s.backBtn, { borderColor: `${neonCyan}30`, backgroundColor: isDarkMode ? 'rgba(10,15,30,0.6)' : C.surface }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={20} color={neonCyan} />
          </TouchableOpacity>

          {/* ── Logo futurista ── */}
          <Animated.View style={[s.logoSection, { transform: [{ scale: logoScale }] }]}>
            <Animated.View style={[s.logoRing,  { transform: [{ rotate }], borderColor: `${neonCyan}30` }]} />
            <Animated.View style={[s.logoGlow,  { opacity: logoGlow, backgroundColor: `${neonCyan}15` }]} />
            <LinearGradient colors={[`${neonCyan}20`, `${neonGreen}10`, 'transparent']} style={s.logoCircle}>
              <View style={[s.logoInner, { borderColor: `${neonCyan}40` }]}>
                <Ionicons name="person-add" size={36} color={neonCyan} />
              </View>
            </LinearGradient>
            <Text style={[s.title,    { color: C.text,      fontFamily: 'SpaceGrotesk-Bold' }]}>Crear cuenta</Text>
            <Text style={[s.subtitle, { color: C.textMuted, fontFamily: 'SpaceGrotesk-Regular' }]}>Únete a NaturaPiscis</Text>
          </Animated.View>

          {/* ── Formulario ── */}
          <Animated.View style={[s.form, { transform: [{ translateY: formSlide }], opacity: formFade }]}>
            {FIELDS.map(field => {
              const isPass   = field.secure;
              const showTxt  = showPass[field.key];
              const hasError = !!errors[field.key];
              const isFocus  = focusedField === field.key;
              const borderColor = hasError
                ? C.error
                : isFocus
                  ? neonCyan
                  : (isDarkMode ? 'rgba(0,245,255,0.12)' : C.inputBorder);

              return (
                <View key={field.key} style={s.inputGroup}>
                  <Text style={[s.label, { color: C.textSecondary, fontFamily: 'SpaceGrotesk-Medium' }]}>{field.label}</Text>
                  <View style={[s.inputWrap, {
                    backgroundColor: isDarkMode ? 'rgba(10,15,30,0.75)' : C.inputBackground,
                    borderColor,
                    shadowColor: isFocus ? neonCyan : 'transparent',
                    shadowOpacity: isFocus ? 0.3 : 0,
                    shadowRadius:  isFocus ? 12  : 0,
                  }]}>
                    <Ionicons name={field.icon} size={18} color={hasError ? C.error : isFocus ? neonCyan : C.textMuted} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[s.input, { color: C.text, fontFamily: 'SpaceGrotesk-Regular' }]}
                      placeholder={field.label}
                      placeholderTextColor={C.placeholder || C.textMuted}
                      value={form[field.key]}
                      onChangeText={v => { setForm(p => ({ ...p, [field.key]: v })); setErrors(p => ({ ...p, [field.key]: '' })); }}
                      keyboardType={field.keyboard}
                      secureTextEntry={isPass && !showTxt}
                      autoCapitalize={field.key === 'nombre' ? 'words' : 'none'}
                      autoCorrect={false}
                      onFocus={() => setFocused(field.key)}
                      onBlur={() => setFocused(null)}
                    />
                    {isPass && (
                      <TouchableOpacity onPress={() => setShowPass(p => ({ ...p, [field.key]: !p[field.key] }))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name={showTxt ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {hasError && (
                    <View style={s.errorRow}>
                      <Ionicons name="alert-circle-outline" size={13} color={C.error} />
                      <Text style={[s.errorMsg, { color: C.error, fontFamily: 'SpaceGrotesk-Regular' }]}>{errors[field.key]}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Términos */}
            <Text style={[s.terms, { color: C.textMuted, fontFamily: 'SpaceGrotesk-Regular' }]}>
              Al registrarte aceptas nuestros{' '}
              <Text style={[s.termsLink, { color: neonCyan }]}>Términos de uso</Text>
              {' '}y{' '}
              <Text style={[s.termsLink, { color: neonCyan }]}>Política de privacidad</Text>
            </Text>

            {/* Botón registro */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity onPress={handleRegistro} disabled={loading} activeOpacity={0.85} style={s.registerBtnWrap}>
                <LinearGradient
                  colors={['#00FF88', '#22C55E', '#16a34a']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.registerBtn, loading && { opacity: 0.7 }]}
                >
                  {loading ? (
                    <ActivityIndicator color="#030712" size="small" />
                  ) : (
                    <>
                      <Text style={[s.registerBtnText, { fontFamily: 'SpaceGrotesk-Bold' }]}>Crear cuenta</Text>
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

          {/* ── Registro / Login con Google ── */}
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

          {/* ── Footer: ir al Login ── */}
          <View style={s.footer}>
            <Text style={[s.footerText, { color: C.textSecondary, fontFamily: 'SpaceGrotesk-Regular' }]}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[s.footerLink, { color: neonCyan, fontFamily: 'SpaceGrotesk-SemiBold' }]}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={[s.appInfo, { borderTopColor: isDarkMode ? 'rgba(0,245,255,0.08)' : C.border }]}>
            <View style={[s.infoIcon, { backgroundColor: `${neonCyan}12`, borderColor: `${neonCyan}25` }]}>
              <Ionicons name="shield-checkmark-outline" size={14} color={neonCyan} />
            </View>
            <Text style={[s.appInfoText, { color: C.textMuted, fontFamily: 'SpaceGrotesk-Regular' }]}>
              Tus datos están protegidos y nunca se comparten
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },

  // Grid de fondo
  gridOverlay: { ...StyleSheet.absoluteFillObject },
  gridLine:    { position: 'absolute', backgroundColor: 'rgba(0,245,255,0.03)' },
  gridH:       { left: 0, right: 0, height: 1 },
  gridV:       { top: 0, bottom: 0, width: 1 },

  // Orbs
  orb: { position: 'absolute', borderRadius: 200 },

  // Back button
  backBtn: {
    position: 'absolute', top: 16, left: 24, zIndex: 5,
    width: 38, height: 38, borderRadius: 19, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 28, marginTop: 20 },
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
  title:    { fontSize: 28, letterSpacing: 0.5, marginBottom: 6 },
  subtitle: { fontSize: 14 },

  // Form
  form: { gap: 10 },
  inputGroup: { marginBottom: 4 },
  label: { fontSize: 13, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14,
    elevation: 4,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },
  errorRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingLeft: 2 },
  errorMsg:  { fontSize: 12 },

  // Términos
  terms:     { fontSize: 12, textAlign: 'center', lineHeight: 18, marginVertical: 14 },
  termsLink: { fontWeight: '600' },

  // Botón registro
  registerBtnWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 4, shadowColor: '#00FF88', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12 },
  registerBtn:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 16 },
  registerBtnText: { fontSize: 16, color: '#030712', letterSpacing: 0.3 },

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
    gap: 10, marginTop: 16, paddingTop: 20, borderTopWidth: 1,
  },
  infoIcon: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  appInfoText: { fontSize: 12 },
});

export default RegistroScreen;
