// src/screens/consumer/PerfilScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, Alert, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios.config';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

// ── Fila de menú ─────────────────────────────────────────────
const MenuRow = ({ icon, label, sub, color = '#3b82f6', onPress, right, last, colors }) => (
  <TouchableOpacity
    style={[styles.menuRow, { borderBottomColor: last ? 'transparent' : colors.border }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.menuIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={19} color={color} />
    </View>
    <View style={styles.menuText}>
      <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      {sub ? <Text style={[styles.menuSub, { color: colors.textSecondary }]}>{sub}</Text> : null}
    </View>
    {right || <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
  </TouchableOpacity>
);

const PerfilScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { themeMode, setTheme, isDarkMode, colors } = useTheme();

  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [seccion,      setSeccion]      = useState(null);
  const [uploadingFoto,setUploadingFoto]= useState(false);
  const [fotoPerfil,   setFotoPerfil]   = useState(null);

  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', direccion: '', fechaRegistro: '',
  });
  const [notif, setNotif] = useState({ email: true, push: true });

  useEffect(() => { fetchPerfil(); }, []);

  const fetchPerfil = async () => {
    try {
      setLoading(true);
      const res  = await api.get('/usuarios/perfil');
      const data = res.data.data || res.data;
      setForm({
        nombre:        data.nombre        || '',
        email:         data.email         || '',
        telefono:      data.telefono      || '',
        direccion:     data.direccion     || '',
        fechaRegistro: data.created_at
          ? new Date(data.created_at).toLocaleDateString('es-BO')
          : '',
      });
      if (data.foto_perfil) setFotoPerfil(data.foto_perfil);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // El backend solo permite actualizar nombre, telefono, direccion
      // El email no se puede cambiar desde el perfil
      await api.put('/usuarios/perfil', {
        nombre:    form.nombre,
        telefono:  form.telefono,
        direccion: form.direccion,
      });
      Alert.alert('✅ Guardado', 'Perfil actualizado correctamente');
      setSeccion(null);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarFoto = () => {
    Alert.alert('Foto de perfil', 'Selecciona una opción', [
      {
        text: 'Galería',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) subirFoto(result.assets[0]);
        },
      },
      {
        text: 'Cámara',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) subirFoto(result.assets[0]);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const subirFoto = async (asset) => {
    try {
      setUploadingFoto(true);
      const ext  = asset.uri.split('.').pop() || 'jpg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const fd   = new FormData();
      fd.append('foto', { uri: asset.uri, name: `foto.${ext}`, type: mime });
      const res = await api.put('/usuarios/foto-perfil', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.foto_perfil || res.data?.foto_perfil;
      if (url) setFotoPerfil(url);
      Alert.alert('✅ Listo', 'Foto de perfil actualizada');
    } catch {
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = form.nombre
    ? form.nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'U';

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  // ── Vista editar datos ────────────────────────────────────
  if (seccion === 'editar') return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setSeccion(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.subHeaderTitle, { color: colors.text }]}>Editar perfil</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>Guardar</Text>}
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, gap: 14 }}>
        {/* Email solo lectura */}
        <View>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Correo electrónico</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder, opacity: 0.6 }]}>
            <Ionicons name="mail-outline" size={17} color={colors.textSecondary} />
            <Text style={[styles.input, { color: colors.textSecondary, paddingVertical: 12 }]}>{form.email}</Text>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
          </View>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, marginLeft: 4 }}>El correo no se puede cambiar</Text>
        </View>

        {[
          { key: 'nombre',    label: 'Nombre completo', icon: 'person-outline',   keyboard: 'default'   },
          { key: 'telefono',  label: 'Teléfono',        icon: 'call-outline',     keyboard: 'phone-pad' },
          { key: 'direccion', label: 'Dirección',       icon: 'location-outline', keyboard: 'default'   },
        ].map(f => (
          <View key={f.key}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{f.label}</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Ionicons name={f.icon} size={17} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={form[f.key]}
                onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                keyboardType={f.keyboard}
                autoCapitalize={f.key === 'nombre' ? 'words' : 'none'}
                placeholder={f.label}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );

  // ── Vista notificaciones ──────────────────────────────────
  if (seccion === 'notif') return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setSeccion(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.subHeaderTitle, { color: colors.text }]}>Notificaciones</Text>
        <View style={{ width: 72 }} />
      </View>
      <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, margin: SPACING.lg }]}>
        {[
          { key: 'email', icon: 'mail-outline',          label: 'Correo electrónico', sub: 'Alertas y actualizaciones' },
          { key: 'push',  icon: 'notifications-outline', label: 'Notificaciones push', sub: 'En tu dispositivo' },
        ].map((n, i) => (
          <View key={n.key} style={[styles.menuRow, { borderBottomColor: i === 0 ? colors.border : 'transparent' }]}>
            <View style={[styles.menuIcon, { backgroundColor: '#3b82f618' }]}>
              <Ionicons name={n.icon} size={19} color="#3b82f6" />
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{n.label}</Text>
              <Text style={[styles.menuSub, { color: colors.textSecondary }]}>{n.sub}</Text>
            </View>
            <Switch
              value={notif[n.key]}
              onValueChange={v => setNotif(p => ({ ...p, [n.key]: v }))}
              trackColor={{ false: colors.border, true: '#86efac' }}
              thumbColor={notif[n.key] ? '#22c55e' : '#9ca3af'}
            />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );

  // ── Vista tema ────────────────────────────────────────────
  if (seccion === 'tema') return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setSeccion(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.subHeaderTitle, { color: colors.text }]}>Apariencia</Text>
        <View style={{ width: 72 }} />
      </View>
      <View style={{ padding: SPACING.lg, gap: 10 }}>
        {[
          { key: 'light', icon: 'sunny-outline',         label: 'Modo claro',      sub: 'Fondo blanco' },
          { key: 'dark',  icon: 'moon-outline',          label: 'Modo oscuro',     sub: 'Fondo oscuro' },
          { key: 'auto',  icon: 'phone-portrait-outline',label: 'Automático',      sub: 'Sigue al sistema' },
        ].map(t => {
          const activo = themeMode === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.temaCard, {
                backgroundColor: activo ? colors.primary + '12' : colors.surface,
                borderColor:     activo ? colors.primary        : colors.cardBorder,
              }]}
              onPress={() => setTheme(t.key)}
            >
              <View style={[styles.menuIcon, { backgroundColor: activo ? colors.primary + '20' : colors.background }]}>
                <Ionicons name={t.icon} size={20} color={activo ? colors.primary : colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: activo ? colors.primary : colors.text }]}>{t.label}</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>{t.sub}</Text>
              </View>
              {activo && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );

  // ── Vista seguridad ───────────────────────────────────────
  if (seccion === 'seguridad') return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setSeccion(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.subHeaderTitle, { color: colors.text }]}>Seguridad</Text>
        <View style={{ width: 72 }} />
      </View>
      <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, margin: SPACING.lg }]}>
        <MenuRow icon="key-outline"          label="Cambiar contraseña" sub="Actualiza tu contraseña"    color="#8b5cf6" onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')} colors={colors} />
        <MenuRow icon="finger-print-outline" label="Biometría"          sub="Huella o Face ID"           color="#3b82f6" onPress={() => Alert.alert('Próximamente', 'Activa la biometría desde el login')}    colors={colors} last />
      </View>
    </SafeAreaView>
  );

  // ── Vista principal ───────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header con gradiente ── */}
        <LinearGradient colors={['#0284c7', '#0d9488']} style={styles.headerGrad}>
          {/* Avatar con foto */}
          <TouchableOpacity style={styles.avatarWrap} onPress={handleCambiarFoto} activeOpacity={0.85}>
            <View style={styles.avatar}>
              {fotoPerfil
                ? <Image source={{ uri: fotoPerfil }} style={styles.avatarImg} />
                : <Text style={styles.avatarText}>{initials}</Text>
              }
              {uploadingFoto && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{form.nombre || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{form.email}</Text>

          {/* Stats rápidos */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>NaturaPiscis</Text>
              <Text style={styles.statLabel}>Plataforma</Text>
            </View>
            <View style={[styles.statDivider]} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{form.fechaRegistro || '—'}</Text>
              <Text style={styles.statLabel}>Miembro desde</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Info personal resumida ── */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {[
            { icon: 'call-outline',     label: 'Teléfono',  value: form.telefono  || 'No registrado' },
            { icon: 'location-outline', label: 'Dirección', value: form.direccion || 'No registrada' },
          ].map((f, i, arr) => (
            <View key={f.icon} style={[styles.infoRow, { borderBottomColor: i < arr.length - 1 ? colors.border : 'transparent' }]}>
              <Ionicons name={f.icon} size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{f.label}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{f.value}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.editProfileBtn, { backgroundColor: colors.primary }]}
            onPress={() => setSeccion('editar')}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.editProfileText}>Editar información</Text>
          </TouchableOpacity>
        </View>

        {/* ── Mis pedidos acceso rápido ── */}
        <TouchableOpacity
          style={[styles.pedidosCard, { backgroundColor: '#0d9488' }]}
          onPress={() => navigation.navigate('MisPedidos')}
          activeOpacity={0.85}
        >
          <View style={styles.pedidosLeft}>
            <View style={styles.pedidosIcon}>
              <Ionicons name="receipt-outline" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.pedidosTitle}>Mis pedidos</Text>
              <Text style={styles.pedidosSub}>Ver historial y tracking</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        {/* ── Configuración ── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CONFIGURACIÓN</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <MenuRow icon="notifications-outline" label="Notificaciones"    sub="Email y push"                    color="#3b82f6" onPress={() => setSeccion('notif')}     colors={colors} />
          <MenuRow icon="color-palette-outline" label="Apariencia"        sub={isDarkMode ? 'Modo oscuro' : 'Modo claro'}   color="#8b5cf6" onPress={() => setSeccion('tema')}      colors={colors} />
          <MenuRow icon="shield-outline"        label="Seguridad"         sub="Contraseña y biometría"          color="#22c55e" onPress={() => setSeccion('seguridad')} colors={colors} last />
        </View>

        {/* ── Soporte ── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SOPORTE</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <MenuRow icon="help-circle-outline"    label="Ayuda"           sub="Preguntas frecuentes"  color="#f59e0b" onPress={() => navigation.navigate('Ayuda')} colors={colors} />
          <MenuRow icon="information-circle-outline" label="Acerca de"   sub="NaturaPiscis v1.0.0"   color="#6b7280" onPress={() => {}} colors={colors} last
            right={<Text style={{ fontSize: 12, color: colors.textSecondary }}>v1.0.0</Text>}
          />
        </View>

        {/* ── Cerrar sesión ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1 },
  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Header gradiente
  headerGrad:      { paddingTop: 24, paddingBottom: 28, alignItems: 'center', paddingHorizontal: 20 },
  avatarWrap:      { marginBottom: 12, alignItems: 'center' },
  avatar:          { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)', overflow: 'hidden' },
  avatarImg:       { width: 84, height: 84, borderRadius: 42 },
  avatarText:      { fontSize: 28, fontWeight: '800', color: '#fff' },
  avatarOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  cameraBtn:       { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#0ea5e9', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  userName:        { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 2 },
  userEmail:       { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  statsRow:        { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, gap: 24 },
  statItem:        { alignItems: 'center', flex: 1 },
  statNum:         { fontSize: 12, fontWeight: '700', color: '#fff' },
  statLabel:       { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  statDivider:     { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  // Info card
  infoCard:        { margin: 16, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: 16 },
  infoRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
  infoLabel:       { fontSize: 12, width: 70 },
  infoValue:       { flex: 1, fontSize: 13, fontWeight: '500', textAlign: 'right' },
  editProfileBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 10, borderRadius: 10 },
  editProfileText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  // Pedidos card
  pedidosCard:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 16, borderRadius: BORDER_RADIUS.lg, padding: 14 },
  pedidosLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pedidosIcon:     { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  pedidosTitle:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  pedidosSub:      { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 1 },
  // Sección label
  sectionLabel:    { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginHorizontal: 16, marginBottom: 6 },
  // Menu card
  menuCard:        { marginHorizontal: 16, marginBottom: 16, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  menuRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1 },
  menuIcon:        { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  menuText:        { flex: 1 },
  menuLabel:       { fontSize: 14, fontWeight: '500' },
  menuSub:         { fontSize: 11, marginTop: 1 },
  // Tema card
  temaCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5 },
  // Logout
  logoutBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 4, backgroundColor: '#fef2f2', paddingVertical: 14, borderRadius: BORDER_RADIUS.lg },
  logoutText:      { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  // Sub-pantallas
  subHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:         { width: 40, height: 40, justifyContent: 'center' },
  subHeaderTitle:  { fontSize: 17, fontWeight: '700' },
  saveBtn:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveBtnText:     { color: '#fff', fontWeight: '600', fontSize: 14 },
  fieldLabel:      { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  inputRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 46 },
  input:           { flex: 1, fontSize: 14 },
});

export default PerfilScreen;