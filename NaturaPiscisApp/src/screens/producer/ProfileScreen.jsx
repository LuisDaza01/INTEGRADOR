// src/screens/producer/ProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert, Image, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios.config';
import * as SecureStore from 'expo-secure-store';

const ProfileScreen = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const C = {
    bg:      colors.background,
    surface: colors.surface,
    card:    colors.card,
    border:  colors.border,
    text:    colors.text,
    sub:     colors.textSecondary,
    hint:    colors.textMuted,
    primary: colors.secondary,
    teal:    '#22C55E',
    green:   '#4ade80',
    orange:  '#fb923c',
    purple:  '#c084fc',
    muted:   colors.textMuted,
    dim:     colors.border,
    red:     '#f87171',
    yellow:  '#fbbf24',
  };
  const styles = makeStyles(C);

  const { user, logout, setUser } = useAuth();

  // ── State ─────────────────────────────────────────────────────────────────
  const [guardandoUbicacion, setGuardandoUbicacion] = useState(false);
  const [ubicacionGuardada, setUbicacionGuardada]   = useState(false);
  const [minutosConf,   setMinutosConf]   = useState(20);
  const [editandoMin,   setEditandoMin]   = useState(false);
  const [minTemp,       setMinTemp]       = useState('20');
  const [savingMin,     setSavingMin]     = useState(false);
  const [uploadingPerfil, setUploadingPerfil]       = useState(false);
  const [uploadingPortada, setUploadingPortada]     = useState(false);
  const [uploadingQR, setUploadingQR]               = useState(false);
  const [perfilData, setPerfilData]                 = useState(null);
  const [stats, setStats]                           = useState(null);
  const [productos, setProductos]                   = useState([]);
  const [loadingData, setLoadingData]               = useState(true);

  // Modales
  const [editVisible, setEditVisible]   = useState(false);
  const [passVisible, setPassVisible]   = useState(false);
  const [saving, setSaving]             = useState(false);
  const [editForm, setEditForm]         = useState({
    nombre: '', telefono: '', nombre_empresa: '',
    descripcion: '', ubicacion: '', years_experience: '',
  });
  const [passForm, setPassForm] = useState({
    actual: '', nueva: '', confirmar: '',
  });
  const [showPass, setShowPass] = useState({ actual: false, nueva: false, confirmar: false });

  // ── Cargar datos ──────────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [pRes, sRes, prRes] = await Promise.all([
        api.get('/productor/perfil'),
        api.get('/estadisticas/productor'),
        api.get('/productos/productor/mis-productos'),
      ]);
      const perfil = pRes.data?.data || pRes.data;
      setPerfilData(perfil);
      const minConf = perfil?.minutos_confirmacion ?? 20;
      setMinutosConf(minConf);
      setMinTemp(String(minConf));
      setEditForm({
        nombre:           perfil?.nombre           || '',
        telefono:         perfil?.telefono          || '',
        nombre_empresa:   perfil?.nombre_empresa    || '',
        descripcion:      perfil?.descripcion       || '',
        ubicacion:        perfil?.ubicacion         || '',
        years_experience: String(perfil?.years_experience || ''),
      });
      setStats(sRes.data?.data || sRes.data);
      const prods = prRes.data?.data || prRes.data || [];
      setProductos(Array.isArray(prods) ? prods.slice(0, 3) : []);
    } catch (e) {
      console.log('Error cargando perfil:', e?.message);
    } finally {
      setLoadingData(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const Stars = ({ rating = 0 }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Ionicons key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={13} color={C.yellow} />
      ))}
    </View>
  );

  // ── Guardar perfil ────────────────────────────────────────────────────────
  const handleGuardarPerfil = async () => {
    if (!editForm.nombre.trim()) { Alert.alert('Error', 'El nombre es requerido'); return; }
    setSaving(true);
    try {
      await api.put('/productor/perfil', {
        ...editForm,
        years_experience: parseInt(editForm.years_experience) || 0,
      });
      setPerfilData(prev => ({ ...prev, ...editForm }));
      if (setUser) setUser(prev => ({ ...prev, nombre: editForm.nombre }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Perfil actualizado');
      setEditVisible(false);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  // ── Cambiar contraseña ────────────────────────────────────────────────────
  const handleCambiarPassword = async () => {
    if (!passForm.actual || !passForm.nueva || !passForm.confirmar) {
      Alert.alert('Error', 'Completa todos los campos'); return;
    }
    if (passForm.nueva !== passForm.confirmar) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden'); return;
    }
    if (passForm.nueva.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres'); return;
    }
    setSaving(true);
    try {
      await api.put('/auth/cambiar-password', {
        password_actual: passForm.actual,
        nueva_password:  passForm.nueva,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Contraseña actualizada');
      setPassVisible(false);
      setPassForm({ actual: '', nueva: '', confirmar: '' });
    } catch (e) {
      const msg = e?.response?.data?.error || 'No se pudo cambiar la contraseña';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Cerrar sesión ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        logout();
      }},
    ]);
  };

  // ── Guardar ubicación ─────────────────────────────────────────────────────
  const handleGuardarUbicacion = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGuardandoUbicacion(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación.'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await api.post('/repartidor/ubicacion-productor', { lat: loc.coords.latitude, lng: loc.coords.longitude });
      setUbicacionGuardada(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Ubicación guardada', `Lat: ${loc.coords.latitude.toFixed(6)}\nLng: ${loc.coords.longitude.toFixed(6)}`);
      setTimeout(() => setUbicacionGuardada(false), 3000);
    } catch { Alert.alert('Error', 'No se pudo guardar la ubicación.'); }
    finally { setGuardandoUbicacion(false); }
  };

  // ── Upload foto perfil ────────────────────────────────────────────────────
  const handleSubirFotoPerfil = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
    if (result.canceled) return;
    try {
      setUploadingPerfil(true);
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('foto', { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: 'foto_perfil.jpg' });
      const token = await SecureStore.getItemAsync('authToken');
      const res = await api.post('/productor/foto-perfil', formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
      const url = res.data?.data?.foto_perfil || res.data?.foto_perfil;
      if (url && setUser) setUser(prev => ({ ...prev, foto_perfil: url }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Foto actualizada');
    } catch { Alert.alert('Error', 'No se pudo actualizar la foto.'); }
    finally { setUploadingPerfil(false); }
  };

  // ── Upload QR de pago ────────────────────────────────────────────────────
  const handleSubirQRPago = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.9 });
    if (result.canceled) return;
    try {
      setUploadingQR(true);
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('qr', { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: 'qr_pago.jpg' });
      const token = await SecureStore.getItemAsync('authToken');
      const res = await api.post('/productor/perfil/qr', formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
      const url = res.data?.data?.qr_pago_url || res.data?.qr_pago_url;
      if (url) setPerfilData(prev => ({ ...prev, qr_pago_url: url }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ QR de pago actualizado', 'Los consumidores verán tu nuevo QR al pagar.');
    } catch { Alert.alert('Error', 'No se pudo actualizar el QR.'); }
    finally { setUploadingQR(false); }
  };

  // ── Upload foto portada ───────────────────────────────────────────────────
  const handleSubirFotoPortada = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16,9], quality: 0.85 });
    if (result.canceled) return;
    try {
      setUploadingPortada(true);
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('foto', { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: 'foto_portada.jpg' });
      const token = await SecureStore.getItemAsync('authToken');
      const res = await api.post('/productor/foto-portada', formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
      const url = res.data?.data?.foto_portada || res.data?.foto_portada;
      if (url && setUser) setUser(prev => ({ ...prev, foto_portada: url }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Portada actualizada');
    } catch { Alert.alert('Error', 'No se pudo actualizar la portada.'); }
    finally { setUploadingPortada(false); }
  };

  // ── UI helpers ────────────────────────────────────────────────────────────
  const MenuItem = ({ icon, label, sublabel, onPress, rightEl, color = C.primary }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
      </View>
      {rightEl ?? <Ionicons name="chevron-forward" size={18} color={C.dim} />}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => <Text style={styles.sectionHeader}>{title}</Text>;

  const ModalInput = ({ label, value, onChangeText, placeholder, secureTextEntry, showToggle, onToggle, multiline }) => (
    <View style={styles.modalInputGroup}>
      <Text style={styles.modalLabel}>{label}</Text>
      <View style={[styles.modalInputWrap, multiline && { height: 80, alignItems: 'flex-start' }]}>
        <TextInput
          style={[styles.modalInput, multiline && { height: 72, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.hint}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          autoCapitalize="none"
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
            <Ionicons name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} size={18} color={C.hint} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const calificacion = parseFloat(perfilData?.calificacion_promedio || 0);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.bg }}>
        <Text style={styles.pageTitle}>Perfil</Text>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── HERO CARD ─────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <TouchableOpacity onPress={handleSubirFotoPortada} activeOpacity={0.85} style={styles.bannerWrapper}>
            {user?.foto_portada
              ? <Image source={{ uri: user.foto_portada }} style={styles.bannerImg} resizeMode="cover" />
              : <LinearGradient colors={['#0c1e3e','#061830']} style={styles.bannerImg} />}
            <View style={styles.bannerOrb1} />
            <View style={styles.bannerOrb2} />
            <LinearGradient colors={['transparent', C.primary, C.teal, 'transparent']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.bannerAccent} />
            <View style={styles.bannerEditOverlay}>
              {uploadingPortada
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Ionicons name="camera-outline" size={16} color="#fff" /><Text style={styles.bannerEditText}>Cambiar portada</Text></>}
            </View>
          </TouchableOpacity>

          <View style={styles.avatarArea}>
            <TouchableOpacity style={styles.avatarRing} onPress={handleSubirFotoPerfil} activeOpacity={0.85}>
              {uploadingPerfil ? (
                <View style={[styles.avatarImg, { backgroundColor: 'rgba(56,189,248,0.1)', justifyContent:'center', alignItems:'center' }]}>
                  <ActivityIndicator size="small" color={C.primary} />
                </View>
              ) : user?.foto_perfil ? (
                <Image source={{ uri: user.foto_perfil }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={['rgba(56,189,248,0.2)','rgba(34,197,94,0.15)']} style={styles.avatarImg}>
                  <Text style={styles.avatarInitial}>{user?.nombre?.charAt(0)?.toUpperCase() || 'P'}</Text>
                </LinearGradient>
              )}
              <View style={styles.cameraBadge}><Ionicons name="camera" size={12} color="#fff" /></View>
            </TouchableOpacity>

            <View style={styles.userInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>{user?.nombre || 'Productor'}</Text>
                {perfilData?.verificado && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#22d3ee" />
                    <Text style={styles.verifiedText}>Verificado</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
              {perfilData?.nombre_empresa ? <Text style={[styles.userEmail, { color: C.primary, marginTop: 1 }]}>{perfilData.nombre_empresa}</Text> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <View style={styles.roleBadge}>
                  <Ionicons name="fish" size={12} color={C.primary} />
                  <Text style={styles.roleText}>Productor</Text>
                </View>
                {calificacion > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Stars rating={calificacion} />
                    <Text style={{ color: C.yellow, fontSize: 12, fontWeight: '600' }}>{calificacion.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ── ESTADÍSTICAS RÁPIDAS ─────────────────────────── */}
        {loadingData ? (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} />
        ) : stats ? (
          <View style={styles.statsRow}>
            {[
              { label: 'Ventas Totales', value: `Bs. ${parseFloat(stats.ventasTotales || 0).toFixed(0)}`, icon: 'cash-outline', color: C.green },
              { label: 'Producción', value: String(stats.produccionTotal || 0), icon: 'fish-outline', color: C.orange },
              { label: 'Clientes', value: String(stats.clientesActivos || stats.clientes_activos || 0), icon: 'people-outline', color: C.primary },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, { borderColor: `${s.color}30` }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── INFORMACIÓN DEL CRIADERO ─────────────────────── */}
        {perfilData && (perfilData.descripcion || perfilData.ubicacion || perfilData.years_experience) ? (
          <View style={styles.sectionBlock}>
            <SectionHeader title="INFORMACIÓN DEL CRIADERO" />
            <View style={styles.card}>
              {perfilData.descripcion ? (
                <View style={styles.infoRow}>
                  <Ionicons name="document-text-outline" size={18} color={C.primary} />
                  <Text style={styles.infoText}>{perfilData.descripcion}</Text>
                </View>
              ) : null}
              {perfilData.ubicacion ? (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={18} color={C.teal} />
                  <Text style={styles.infoText}>{perfilData.ubicacion}</Text>
                </View>
              ) : null}
              {perfilData.years_experience > 0 ? (
                <View style={styles.infoRow}>
                  <Ionicons name="ribbon-outline" size={18} color={C.orange} />
                  <Text style={styles.infoText}>{perfilData.years_experience} años de experiencia</Text>
                </View>
              ) : null}
              {Array.isArray(perfilData.certificaciones) && perfilData.certificaciones.length > 0 ? (
                <View style={styles.infoRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={C.green} />
                  <Text style={styles.infoText}>{perfilData.certificaciones.join(' • ')}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── HORARIO DE ATENCIÓN ──────────────────────────── */}
        {perfilData?.horario_atencion_inicio ? (
          <View style={styles.sectionBlock}>
            <SectionHeader title="HORARIO DE ATENCIÓN" />
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color={C.purple} />
                <Text style={styles.infoText}>
                  {perfilData.horario_atencion_inicio} – {perfilData.horario_atencion_fin || ''}
                </Text>
              </View>
              {Array.isArray(perfilData.dias_venta) && perfilData.dias_venta.length > 0 ? (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={18} color={C.teal} />
                  <Text style={styles.infoText}>{perfilData.dias_venta.join(', ')}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── PRODUCTOS DESTACADOS ─────────────────────────── */}
        {productos.length > 0 && (
          <View style={styles.sectionBlock}>
            <SectionHeader title="PRODUCTOS DESTACADOS" />
            <View style={styles.card}>
              {productos.map((p, i) => (
                <View key={p.id}>
                  <View style={styles.productRow}>
                    {p.foto_principal
                      ? <Image source={{ uri: p.foto_principal }} style={styles.productThumb} />
                      : <View style={[styles.productThumb, { backgroundColor: `${C.primary}20`, justifyContent:'center', alignItems:'center' }]}>
                          <Ionicons name="fish-outline" size={20} color={C.primary} />
                        </View>}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{p.nombre}</Text>
                      <Text style={styles.productPrice}>Bs. {parseFloat(p.precio).toFixed(2)} / {p.unidad}</Text>
                    </View>
                    <View style={[styles.stockBadge, { backgroundColor: p.stock > 0 ? `${C.green}20` : `${C.red}20` }]}>
                      <Text style={{ fontSize: 11, color: p.stock > 0 ? C.green : C.red, fontWeight: '600' }}>
                        {p.stock > 0 ? `${p.stock} kg` : 'Agotado'}
                      </Text>
                    </View>
                  </View>
                  {i < productos.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── CONFIGURACIÓN DE PEDIDOS ───────────────────── */}
        <View style={styles.sectionBlock}>
          <SectionHeader title="CONFIGURACIÓN DE PEDIDOS" />
          <View style={[styles.card, { padding: 14 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Ionicons name="time-outline" size={18} color={C.primary} />
              <Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }}>Tiempo de espera para confirmación</Text>
            </View>
            <Text style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>
              Cuando peses un pedido, el consumidor tendrá este tiempo para aceptar el precio. Si no responde, se cancela y el stock vuelve. Mín 5, máx 60 minutos.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TextInput
                value={minTemp}
                onChangeText={setMinTemp}
                keyboardType="numeric"
                editable={editandoMin}
                style={{
                  width: 80, padding: 10, borderRadius: 8,
                  borderWidth: 1, borderColor: editandoMin ? C.primary : C.border,
                  backgroundColor: editandoMin ? C.surface : 'transparent',
                  color: C.text, fontSize: 16, fontWeight: '700', textAlign: 'center',
                }}
              />
              <Text style={{ color: C.sub, fontSize: 14 }}>minutos</Text>
              {!editandoMin ? (
                <TouchableOpacity onPress={() => setEditandoMin(true)}
                  style={{ marginLeft: 'auto', backgroundColor: C.primary + '22', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="pencil" size={13} color={C.primary} />
                  <Text style={{ color: C.primary, fontWeight: '700', fontSize: 13 }}>Editar</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={() => { setEditandoMin(false); setMinTemp(String(minutosConf)); }}
                    style={{ backgroundColor: 'transparent', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border }}>
                    <Text style={{ color: C.sub, fontSize: 13 }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity disabled={savingMin}
                    onPress={async () => {
                      const n = parseInt(minTemp, 10);
                      if (!Number.isFinite(n) || n < 5 || n > 60) {
                        Alert.alert('Valor inválido', 'Debe estar entre 5 y 60 minutos');
                        return;
                      }
                      setSavingMin(true);
                      try {
                        await api.patch('/usuarios/minutos-confirmacion', { minutos: n });
                        setMinutosConf(n);
                        setEditandoMin(false);
                        Alert.alert('Guardado', `Tiempo actualizado a ${n} min`);
                      } catch (e) {
                        Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar');
                      } finally { setSavingMin(false); }
                    }}
                    style={{ backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}>
                    {savingMin
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Guardar</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── MI CRIADERO ─────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <SectionHeader title="MI CRIADERO" />
          <View style={styles.card}>
            <MenuItem icon="images-outline" label="Galería del Criadero" sublabel="Fotos y videos de alimentación, captura y preparación" onPress={() => navigation.navigate('GaleriaProductor')} color={C.primary} />
          </View>
        </View>

        {/* ── ESTANQUE ────────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <SectionHeader title="ESTANQUE" />
          <View style={styles.card}>
            <MenuItem
              icon={ubicacionGuardada ? 'checkmark-circle' : guardandoUbicacion ? 'hourglass-outline' : 'location'}
              label={guardandoUbicacion ? 'Obteniendo ubicación…' : 'Actualizar ubicación del estanque'}
              sublabel={ubicacionGuardada ? '¡Guardada correctamente!' : 'Requerido para el tracking de pedidos'}
              onPress={handleGuardarUbicacion}
              color={ubicacionGuardada ? C.green : C.primary}
              rightEl={guardandoUbicacion ? <ActivityIndicator size="small" color={C.primary} /> : undefined}
            />
          </View>
        </View>

        {/* ── CUENTA ──────────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <SectionHeader title="CUENTA" />
          <View style={styles.card}>
            <MenuItem icon="person-outline" label="Editar Perfil" sublabel="Nombre, empresa, descripción, ubicación" color={C.primary} onPress={() => setEditVisible(true)} />
            <View style={styles.divider} />
            <MenuItem
              icon="qr-code-outline"
              label="QR de Pago"
              sublabel={perfilData?.qr_pago_url ? 'QR configurado ✓' : 'Sube tu código QR para recibir pagos'}
              color={C.teal}
              onPress={handleSubirQRPago}
              rightEl={uploadingQR ? <ActivityIndicator size="small" color={C.teal} /> : undefined}
            />
            <View style={styles.divider} />
            <MenuItem
              icon={isDarkMode ? 'moon' : 'sunny-outline'}
              label="Modo Oscuro"
              sublabel={isDarkMode ? 'Activado' : 'Desactivado'}
              color={isDarkMode ? C.purple : C.orange}
              onPress={toggleTheme}
              rightEl={<Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: C.dim, true: `${C.purple}55` }} thumbColor={isDarkMode ? C.purple : '#f4f3f4'} />}
            />
            <View style={styles.divider} />
            <MenuItem icon="notifications-outline" label="Notificaciones" color={C.purple} />
            <View style={styles.divider} />
            <MenuItem icon="lock-closed-outline" label="Cambiar Contraseña" color={C.orange} onPress={() => setPassVisible(true)} />
          </View>
        </View>

        {/* ── SOPORTE ─────────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <SectionHeader title="SOPORTE" />
          <View style={styles.card}>
            <MenuItem icon="help-circle-outline" label="Ayuda" color={C.teal} />
            <View style={styles.divider} />
            <MenuItem icon="document-text-outline" label="Términos y Condiciones" color={C.muted} />
            <View style={styles.divider} />
            <MenuItem icon="information-circle-outline" label="Acerca de" color={C.dim} rightEl={<Text style={{ color: C.dim, fontSize: 13 }}>v1.0.0</Text>} />
          </View>
        </View>

        {/* ── LOGOUT ──────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={C.red} />
          <Text style={[styles.logoutText, { color: C.red }]}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>NaturaPiscis © 2025</Text>
      </ScrollView>

      {/* ══ MODAL: EDITAR PERFIL ══════════════════════════════ */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: C.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={24} color={C.hint} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ModalInput label="Nombre completo" value={editForm.nombre} onChangeText={v => setEditForm(p => ({ ...p, nombre: v }))} placeholder="Tu nombre" />
              <ModalInput label="Teléfono" value={editForm.telefono} onChangeText={v => setEditForm(p => ({ ...p, telefono: v }))} placeholder="Ej. 76543210" />
              <ModalInput label="Nombre del criadero" value={editForm.nombre_empresa} onChangeText={v => setEditForm(p => ({ ...p, nombre_empresa: v }))} placeholder="Nombre de tu empresa" />
              <ModalInput label="Descripción" value={editForm.descripcion} onChangeText={v => setEditForm(p => ({ ...p, descripcion: v }))} placeholder="Describe tu criadero..." multiline />
              <ModalInput label="Ubicación" value={editForm.ubicacion} onChangeText={v => setEditForm(p => ({ ...p, ubicacion: v }))} placeholder="Ciudad, Departamento" />
              <ModalInput label="Años de experiencia" value={editForm.years_experience} onChangeText={v => setEditForm(p => ({ ...p, years_experience: v }))} placeholder="Ej. 5" />

              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.primary }]} onPress={handleGuardarPerfil} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalBtnText}>Guardar Cambios</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══ MODAL: CAMBIAR CONTRASEÑA ════════════════════════ */}
      <Modal visible={passVisible} animationType="slide" transparent onRequestClose={() => setPassVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: C.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setPassVisible(false)}>
                <Ionicons name="close" size={24} color={C.hint} />
              </TouchableOpacity>
            </View>
            <ModalInput
              label="Contraseña actual"
              value={passForm.actual}
              onChangeText={v => setPassForm(p => ({ ...p, actual: v }))}
              placeholder="••••••••"
              secureTextEntry={!showPass.actual}
              showToggle
              onToggle={() => setShowPass(p => ({ ...p, actual: !p.actual }))}
            />
            <ModalInput
              label="Nueva contraseña"
              value={passForm.nueva}
              onChangeText={v => setPassForm(p => ({ ...p, nueva: v }))}
              placeholder="••••••••"
              secureTextEntry={!showPass.nueva}
              showToggle
              onToggle={() => setShowPass(p => ({ ...p, nueva: !p.nueva }))}
            />
            <ModalInput
              label="Confirmar nueva contraseña"
              value={passForm.confirmar}
              onChangeText={v => setPassForm(p => ({ ...p, confirmar: v }))}
              placeholder="••••••••"
              secureTextEntry={!showPass.confirmar}
              showToggle
              onToggle={() => setShowPass(p => ({ ...p, confirmar: !p.confirmar }))}
            />
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.orange, marginTop: 8 }]} onPress={handleCambiarPassword} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalBtnText}>Cambiar Contraseña</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const makeStyles = (C) => StyleSheet.create({
  pageTitle:       { fontSize: 26, fontWeight: 'bold', color: C.text, paddingHorizontal: 20, paddingVertical: 12 },

  // Hero
  heroCard:        { marginHorizontal: 16, marginBottom: 12, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  bannerWrapper:   { height: 110, position: 'relative' },
  bannerImg:       { ...StyleSheet.absoluteFillObject },
  bannerOrb1:      { position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(56,189,248,0.1)' },
  bannerOrb2:      { position: 'absolute', bottom: 0, left: -10, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(34,197,94,0.08)' },
  bannerAccent:    { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  bannerEditOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, backgroundColor: 'rgba(0,0,0,0.25)' },
  bannerEditText:  { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },
  avatarArea:      { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  avatarRing:      { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, borderColor: C.primary, position: 'relative' },
  avatarImg:       { width: '100%', height: '100%', borderRadius: 34, justifyContent: 'center', alignItems: 'center' },
  avatarInitial:   { fontSize: 26, fontWeight: 'bold', color: C.primary },
  cameraBadge:     { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.card },
  userInfo:        { flex: 1 },
  userName:        { fontSize: 17, fontWeight: '700', color: C.text },
  userEmail:       { fontSize: 12, color: C.muted, marginTop: 1 },
  verifiedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(34,211,238,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  verifiedText:    { fontSize: 11, color: '#22d3ee', fontWeight: '600' },
  roleBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(56,189,248,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)' },
  roleText:        { fontSize: 12, fontWeight: '500', color: C.primary },

  // Stats
  statsRow:        { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 10 },
  statCard:        { flex: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  statValue:       { fontSize: 15, fontWeight: '700' },
  statLabel:       { fontSize: 10, color: C.muted, textAlign: 'center' },

  // Info rows
  sectionBlock:    { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader:   { fontSize: 11, fontWeight: '700', color: C.dim, letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 },
  card:            { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  divider:         { height: 1, backgroundColor: 'rgba(56,189,248,0.07)', marginHorizontal: 16 },
  infoRow:         { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  infoText:        { flex: 1, fontSize: 14, color: C.sub, lineHeight: 20 },

  // Products
  productRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  productThumb:    { width: 44, height: 44, borderRadius: 10 },
  productName:     { fontSize: 14, fontWeight: '600', color: C.text },
  productPrice:    { fontSize: 12, color: C.muted, marginTop: 2 },
  stockBadge:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

  // Menu
  menuItem:        { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuIcon:        { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel:       { fontSize: 15, color: C.text, fontWeight: '500' },
  menuSublabel:    { fontSize: 12, color: C.muted, marginTop: 1 },

  // Logout
  logoutButton:    { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', marginBottom: 12 },
  logoutText:      { fontSize: 15, fontWeight: '600' },
  footer:          { textAlign: 'center', color: C.dim, fontSize: 12, paddingBottom: 16 },

  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '88%' },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:      { fontSize: 18, fontWeight: '700' },
  modalInputGroup: { marginBottom: 14 },
  modalLabel:      { fontSize: 13, fontWeight: '500', color: C.sub, marginBottom: 6 },
  modalInputWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14 },
  modalInput:      { flex: 1, fontSize: 15, color: C.text, paddingVertical: 12 },
  modalBtn:        { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  modalBtnText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ProfileScreen;
