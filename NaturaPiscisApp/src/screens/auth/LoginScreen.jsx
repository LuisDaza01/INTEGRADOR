// src/screens/auth/LoginScreen.jsx
// Pantalla de Login con diseño igual a la web

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import authService from '../../api/services/auth.service';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_MOBILE_CLIENT_ID = '728810461626-05lrpoc2qr5udfo7apoh588nrkgjvig9.apps.googleusercontent.com';
const GOOGLE_WEB_CLIENT_ID    = '728810461626-oub4t291euvfforvp72l9ajs0ebv8pq3.apps.googleusercontent.com';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { login, loginWithData } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType]           = useState(null);
  const [googleLoading, setGoogleLoading]           = useState(false);

  const [, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId:    GOOGLE_MOBILE_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    checkBiometric();
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
      if (result.success) {
        loginWithData(result.token, result.user);
      } else {
        setErrorMsg(result.error || 'Error al iniciar sesión con Google');
      }
    } catch {
      setErrorMsg('Error al iniciar sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
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
      // Verificar que hay credenciales guardadas
      const savedEmail    = await SecureStore.getItemAsync('saved_email');
      const savedPassword = await SecureStore.getItemAsync('saved_password');
      if (!savedEmail || !savedPassword) {
        setErrorMsg('Primero inicia sesión manualmente para activar la biometría');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad',
        cancelLabel:   'Cancelar',
        fallbackLabel: 'Usar contraseña',
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

    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      if (rememberMe) {
        await SecureStore.setItemAsync('saved_email', email);
        await SecureStore.setItemAsync('saved_password', password);
      }
      const result = await login(email, password);
      if (!result.success) {
        setErrorMsg(result.error || 'Error de credenciales');
      }
    } catch (error) {
      setErrorMsg('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header con Logo */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="fish" size={36} color="#fff" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>NaturaPiscis</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Bienvenido de nuevo</Text>
          </View>

          {/* Mensaje de Error */}
          {errorMsg ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.errorBg }]}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Formulario */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Correo Electrónico</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={colors.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Contraseña</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={colors.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder="Tu contraseña"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Biometría */}
            {biometricAvailable && (
              <TouchableOpacity
                style={[styles.biometricBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={handleBiometricLogin}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={biometricType === 'face' ? 'scan-outline' : 'finger-print-outline'}
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.biometricText, { color: colors.text }]}>
                  {biometricType === 'face' ? 'Acceder con Face ID' : 'Acceder con huella'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.rememberContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[
                  styles.checkbox, 
                  { borderColor: colors.border },
                  rememberMe && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.rememberText, { color: colors.textSecondary }]}>Recordarme</Text>
              </TouchableOpacity>
              
              <TouchableOpacity>
                <Text style={[styles.forgotText, { color: colors.primary }]}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textHint }]}>o</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={[styles.googleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => promptGoogleAsync()}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://www.google.com/favicon.ico' }}
                  style={styles.googleIcon}
                />
                <Text style={[styles.googleBtnText, { color: colors.text }]}>
                  Continuar con Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Footer - Registro */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Regístrate</Text>
            </TouchableOpacity>
          </View>

          {/* Info de la App */}
          <View style={[styles.appInfo, { borderTopColor: colors.border }]}>
            <Ionicons name="notifications-outline" size={16} color={colors.textHint} />
            <Text style={[styles.appInfoText, { color: colors.textHint }]}>
              Recibirás alertas en tiempo real de tus sensores
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// Estilos ESTÁTICOS (sin variables de tema)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOWS.primary,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  errorContainer: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  form: {
    gap: SPACING.md,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberText: {
    fontSize: 14,
  },
  forgotText: {
    fontSize: 14,
  },
  loginButton: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    ...SHADOWS.primary,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  biometricText: {
    fontSize: 15,
    fontWeight: '500',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: SPACING.md,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
  },
  appInfoText: {
    fontSize: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default LoginScreen;