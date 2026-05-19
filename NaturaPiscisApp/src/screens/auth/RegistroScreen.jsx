// src/screens/auth/RegistroScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/axios.config';
import { useAuth } from '../../contexts/AuthContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const FIELDS = [
  { key: 'nombre',    label: 'Nombre completo', icon: 'person-outline',  keyboard: 'default',         secure: false },
  { key: 'email',     label: 'Correo electrónico',icon: 'mail-outline',  keyboard: 'email-address',   secure: false },
  { key: 'telefono',  label: 'Teléfono',         icon: 'call-outline',   keyboard: 'phone-pad',       secure: false },
  { key: 'password',  label: 'Contraseña',        icon: 'lock-closed-outline', keyboard: 'default',  secure: true  },
  { key: 'confirm',   label: 'Confirmar contraseña', icon: 'lock-closed-outline', keyboard: 'default', secure: true },
];

const RegistroScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [form, setForm]             = useState({ nombre: '', email: '', telefono: '', password: '', confirm: '' });
  const [showPass, setShowPass]     = useState({ password: false, confirm: false });
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState({});
  const [focusedField, setFocused]  = useState(null);

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
        // Auto-login después del registro
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
    <View style={styles.container}>
      <LinearGradient colors={['#0c4a6e', '#0369a1']} style={styles.headerBg}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Ionicons name="fish" size={28} color="#22d3ee" />
              <Text style={styles.headerTitle}>NaturaPiscis</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          <Text style={styles.headerSub}>Crear cuenta gratuita</Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Información personal</Text>

          {FIELDS.map(field => {
            const isPass   = field.secure;
            const showTxt  = showPass[field.key];
            const hasError = !!errors[field.key];
            const isFocus  = focusedField === field.key;
            return (
              <View key={field.key} style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <View style={[styles.inputWrapper,
                  isFocus && styles.inputFocused,
                  hasError && styles.inputError,
                ]}>
                  <Ionicons name={field.icon} size={18} color={hasError ? '#ef4444' : isFocus ? '#0284c7' : '#9ca3af'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={field.label}
                    placeholderTextColor="#d1d5db"
                    value={form[field.key]}
                    onChangeText={v => { setForm(p => ({ ...p, [field.key]: v })); setErrors(p => ({ ...p, [field.key]: '' })); }}
                    keyboardType={field.keyboard}
                    secureTextEntry={isPass && !showTxt}
                    autoCapitalize={field.key === 'nombre' ? 'words' : 'none'}
                    onFocus={() => setFocused(field.key)}
                    onBlur={() => setFocused(null)}
                  />
                  {isPass && (
                    <TouchableOpacity onPress={() => setShowPass(p => ({ ...p, [field.key]: !p[field.key] }))}>
                      <Ionicons name={showTxt ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>
                {hasError && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={13} color="#ef4444" />
                    <Text style={styles.errorText}>{errors[field.key]}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Términos */}
          <Text style={styles.terms}>
            Al registrarte aceptas nuestros{' '}
            <Text style={styles.termsLink}>Términos de uso</Text>
            {' '}y{' '}
            <Text style={styles.termsLink}>Política de privacidad</Text>
          </Text>

          {/* Botón registro */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
            onPress={handleRegistro}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.registerBtnText}>Crear cuenta</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Ir al login */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}> Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f9fafb' },
  headerBg:       { paddingBottom: 20 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  backBtn:        { width: 40, height: 40, justifyContent: 'center' },
  headerCenter:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:    { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub:      { color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center', marginBottom: 4 },
  scroll:         { flex: 1 },
  scrollContent:  { padding: 24, paddingBottom: 40 },
  sectionTitle:   { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 16 },
  fieldWrapper:   { marginBottom: 14 },
  fieldLabel:     { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  inputWrapper:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, gap: 8 },
  inputFocused:   { borderColor: '#0284c7', backgroundColor: '#f0f9ff' },
  inputError:     { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  inputIcon:      { width: 20 },
  input:          { flex: 1, height: 48, fontSize: 15, color: '#111827' },
  errorRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errorText:      { fontSize: 11, color: '#ef4444' },
  terms:          { fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 18, marginVertical: 16 },
  termsLink:      { color: '#0284c7', fontWeight: '500' },
  registerBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 8, backgroundColor: '#0284c7', borderRadius: 14, paddingVertical: 15, marginBottom: 16 },
  registerBtnDisabled: { opacity: 0.6 },
  registerBtnText:{ color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow:       { flexDirection: 'row', justifyContent: 'center' },
  loginText:      { color: '#6b7280', fontSize: 14 },
  loginLink:      { color: '#0284c7', fontSize: 14, fontWeight: '600' },
});

export default RegistroScreen;