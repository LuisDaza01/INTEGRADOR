// src/screens/driver/RepartidorScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Animated,
  RefreshControl, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
// ✅ BUG 1 CORREGIDO: usar instancia api con interceptores (token automático + limpieza 401)
// ya NO importamos axios directo ni API_BASE_URL
import api from '../../api/axios.config';

const POLLING_INTERVAL = 15000;
const LOCATION_INTERVAL = 10000;

const RepartidorScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, logout } = useAuth(); // ✅ ya no necesitamos `token` manual

  const [codigo, setCodigo] = useState('');
  const [cargandoCodigo, setCargandoCodigo] = useState(false);
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pedidoExitoso, setPedidoExitoso] = useState(null);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  // Pedido pendiente de confirmación de ETA (modal abierto si !== null)
  const [pedidoPendienteETA, setPedidoPendienteETA] = useState(null);
  const [etaCustom, setEtaCustom] = useState('');

  const successScale = useRef(new Animated.Value(0)).current;
  const pollingRef = useRef(null);
  const locationRef = useRef(null);

  // ── Logout ──────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  // ── Cargar pedidos disponibles ──────────────────────────
  // ✅ BUG FIX: backend devuelve array directo (no envuelto en data.data)
  // El endpoint GET /repartidor/pedidos-disponibles responde con [] directamente
  const cargarPedidos = async (silencioso = false) => {
    if (!silencioso) setCargandoPedidos(true);
    try {
      const res = await api.get('/repartidor/pedidos-disponibles');
      // Backend puede responder: [] directo O { success, data: [] }
      const lista = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setPedidosDisponibles(lista);

      const activo = lista.find(p => p.estado === 'en_camino');
      setPedidoActivo(activo || null);
    } catch (err) {
      console.error('Error cargando pedidos:', err.response?.data || err.message);
    } finally {
      setCargandoPedidos(false);
      setRefreshing(false);
    }
  };

  // ── Enviar ubicación GPS al backend ────────────────────
  const iniciarEnvioUbicacion = async (pedidoId) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('⚠️ Permiso de ubicación denegado');
        return;
      }

      locationRef.current = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          // ✅ usa instancia api con token automático
          await api.post(`/repartidor/pedidos/${pedidoId}/ubicacion`, {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
          console.log('📍 Ubicación enviada:', location.coords.latitude, location.coords.longitude);
        } catch (err) {
          console.error('Error enviando ubicación:', err.message);
        }
      }, LOCATION_INTERVAL);

    } catch (err) {
      console.error('Error iniciando GPS:', err.message);
    }
  };

  const detenerEnvioUbicacion = () => {
    if (locationRef.current) {
      clearInterval(locationRef.current);
      locationRef.current = null;
    }
  };

  useEffect(() => {
    cargarPedidos();
    pollingRef.current = setInterval(() => cargarPedidos(true), POLLING_INTERVAL);
    return () => {
      clearInterval(pollingRef.current);
      detenerEnvioUbicacion();
    };
  }, []);

  useEffect(() => {
    if (pedidoActivo) {
      iniciarEnvioUbicacion(pedidoActivo.id);
    } else {
      detenerEnvioUbicacion();
    }
  }, [pedidoActivo?.id]);

  // ── Confirmar recogida con código ───────────────────────
  // ✅ FLUJO codigo_retiro COMPLETO:
  //    1. Busca el pedido por código en la lista local (rápido, offline-first)
  //    2. Si no está en lista, intenta directo al backend (código válido pero pedido no visible)
  //    3. Llama POST /repartidor/pedidos/:id/recoger con { codigo_retiro }
  //    4. Backend valida, asigna repartidor, manda push al consumidor
  const confirmarCodigo = async () => {
    const codigoLimpio = codigo.toUpperCase().trim();
    // Nuevos códigos son 6 dígitos; los antiguos (NP-...) podían ser hasta 12.
    if (codigoLimpio.length < 4) {
      Alert.alert('Código inválido', 'Ingresa los 6 dígitos del código');
      return;
    }

    setCargandoCodigo(true);
    try {
      // Buscar pedido por código en la lista local
      const pedido = pedidosDisponibles.find(p => p.codigo_retiro === codigoLimpio);

      if (!pedido) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Código no encontrado',
          'El código no corresponde a ningún pedido disponible. Verifica que el pedido esté en estado "listo para recoger".'
        );
        return;
      }

      // En vez de hacer el POST aquí, abrir el modal de ETA.
      // El POST se hace en `confirmarConETA` cuando el conductor elige el tiempo.
      setPedidoPendienteETA({ pedido, codigoLimpio });
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo procesar el código');
    } finally {
      setCargandoCodigo(false);
    }
  };

  // Hace el POST de recogida con la ETA elegida por el conductor.
  const confirmarConETA = async (etaMinutos) => {
    if (!pedidoPendienteETA) return;
    const { pedido, codigoLimpio } = pedidoPendienteETA;
    setCargandoCodigo(true);
    try {
      const res = await api.post(`/repartidor/pedidos/${pedido.id}/recoger`, {
        codigo_retiro: codigoLimpio,
        eta_minutos: etaMinutos || null,
      });
      const respuesta = res.data?.data || res.data;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPedidoExitoso(respuesta);
      setCodigo('');
      setPedidoPendienteETA(null);
      setEtaCustom('');
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
      setTimeout(() => {
        setPedidoExitoso(null);
        successScale.setValue(0);
        cargarPedidos(true);
      }, 3000);
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const mensaje = err.response?.data?.message || err.response?.data?.error || 'Error al confirmar el código';
      Alert.alert('Error', mensaje);
    } finally {
      setCargandoCodigo(false);
    }
  };

  // ── Marcar pedido como entregado ────────────────────────
  const marcarEntregado = (pedidoId) => {
    Alert.alert(
      'Confirmar entrega',
      '¿Ya entregaste el pedido al consumidor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, entregado',
          onPress: async () => {
            try {
              // ✅ usa instancia api
              await api.post(`/repartidor/pedidos/${pedidoId}/entregar`, {});
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              detenerEnvioUbicacion();
              cargarPedidos(true);
            } catch (err) {
              const mensaje = err.response?.data?.message
                || err.response?.data?.error
                || 'Error al marcar entregado';
              Alert.alert('Error', mensaje);
            }
          },
        },
      ]
    );
  };

  const getEstadoColor = (estado) => ({
    listo_para_recoger: '#F59E0B', en_camino: '#3B82F6',
    entregado: '#22C55E', preparando: '#8B5CF6', confirmado: '#06B6D4',
  }[estado] || colors.textSecondary);

  const getEstadoLabel = (estado) => ({
    pendiente: 'Pendiente', confirmado: 'Confirmado',
    preparando: 'Preparando', listo_para_recoger: 'Listo para recoger',
    en_camino: 'En camino', entregado: 'Entregado',
  }[estado] || estado);

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-BO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={[styles.avatarSmall, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="bicycle" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{user?.nombre || 'Conductor'}</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Panel de entregas</Text>
          </View>
          {pedidoActivo && (
            <View style={styles.gpsIndicator}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>GPS</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleLogout} style={{ padding: 8 }}>
            <Ionicons name="log-out-outline" size={24} color={colors.error || '#EF4444'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); cargarPedidos(); }}
              tintColor={colors.primary}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* ── INGRESAR CÓDIGO ── */}
          <View style={[styles.codigoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.codigoHeader}>
              <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
              <Text style={[styles.codigoTitle, { color: colors.text }]}>Ingresar código del paquete</Text>
            </View>
            <Text style={[styles.codigoHint, { color: colors.textSecondary }]}>
              Ingresa los 6 dígitos del código del paquete
            </Text>
            <View style={[styles.inputRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.codigoInput, { color: colors.text, letterSpacing: 6, fontSize: 22, fontWeight: '700' }]}
                placeholder="000000"
                placeholderTextColor={colors.placeholder}
                value={codigo}
                onChangeText={(t) => setCodigo(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                autoCorrect={false}
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={confirmarCodigo}
              />
              <TouchableOpacity
                style={[styles.confirmarBtn, { backgroundColor: codigo.trim().length >= 6 ? colors.primary : colors.buttonDisabled }]}
                onPress={confirmarCodigo}
                disabled={cargandoCodigo || codigo.trim().length < 6}
              >
                {cargandoCodigo
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="checkmark" size={22} color="#fff" />
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* ── BANNER ÉXITO ── */}
          {pedidoExitoso && (
            <Animated.View style={[styles.successBanner, { transform: [{ scale: successScale }] }]}>
              <Ionicons name="checkmark-circle" size={28} color="#fff" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.successTitle}>¡Código correcto!</Text>
                <Text style={styles.successSub}>{pedidoExitoso.message}</Text>
                <Text style={styles.successSub}>📱 Consumidor notificado · 📍 GPS activado</Text>
              </View>
            </Animated.View>
          )}

          {/* ── PEDIDOS DISPONIBLES ── */}
          <View style={styles.pedidosSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Pedidos disponibles ({pedidosDisponibles.length})
            </Text>

            {cargandoPedidos ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : pedidosDisponibles.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Ionicons name="checkmark-circle-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay pedidos disponibles</Text>
              </View>
            ) : (
              pedidosDisponibles.map((pedido) => (
                <View key={pedido.id} style={[styles.pedidoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.pedidoHeader}>
                    <View>
                      <Text style={[styles.pedidoId, { color: colors.text }]}>Pedido #{pedido.id}</Text>
                      <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(pedido.estado) + '20' }]}>
                        <Text style={[styles.estadoText, { color: getEstadoColor(pedido.estado) }]}>
                          {getEstadoLabel(pedido.estado)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.pedidoTotal, { color: colors.primary }]}>
                      Bs. {parseFloat(pedido.total).toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.codigoBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="key-outline" size={14} color={colors.primary} />
                    <Text style={[styles.codigoBadgeText, { color: colors.primary }]}>{pedido.codigo_retiro}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      {pedido.entrega_direccion}, {pedido.entrega_ciudad}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      {pedido.consumidor_nombre}{pedido.consumidor_telefono ? ` · ${pedido.consumidor_telefono}` : ''}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      {pedido.total_items} producto(s) · {formatFecha(pedido.fecha_pedido)}
                    </Text>
                  </View>

                  {pedido.estado === 'en_camino' && (
                    <View style={{ gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.entregadoBtn, { backgroundColor: '#3B82F6' }]}
                        onPress={() => navigation.navigate('TrackingPedido', { pedidoId: pedido.id })}
                      >
                        <Ionicons name="navigate-outline" size={18} color="#fff" />
                        <Text style={styles.entregadoBtnText}>Ver ruta</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.entregadoBtn, { backgroundColor: '#22C55E' }]}
                        onPress={() => marcarEntregado(pedido.id)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                        <Text style={styles.entregadoBtnText}>Marcar como entregado</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.notaContainer}>
            <Ionicons name="refresh-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.notaText, { color: colors.textSecondary }]}>Se actualiza cada 15 segundos</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal: ETA tras confirmar código ── */}
      <Modal visible={!!pedidoPendienteETA} transparent animationType="fade" onRequestClose={() => !cargandoCodigo && setPedidoPendienteETA(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: 18, padding: 22, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Ionicons name="time-outline" size={26} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' }}>¿En cuánto llegas a la parada?</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                El consumidor recibirá la hora aproximada de llegada
              </Text>
            </View>

            {/* Presets */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {[
                { label: '2 h',     mins: 120 },
                { label: '2 h 30',  mins: 150 },
                { label: '3 h',     mins: 180 },
                { label: '3 h 30',  mins: 210 },
              ].map(p => (
                <TouchableOpacity key={p.mins}
                  onPress={() => confirmarConETA(p.mins)} disabled={cargandoCodigo}
                  style={{ flex: 1, minWidth: '45%', paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary + '60', backgroundColor: colors.primary + '12', alignItems: 'center', opacity: cargandoCodigo ? 0.5 : 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom */}
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>Otro tiempo (en minutos):</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              <TextInput
                value={etaCustom} onChangeText={setEtaCustom}
                keyboardType="number-pad" placeholder="ej. 90" placeholderTextColor={colors.textMuted}
                style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.background, fontSize: 15 }}
              />
              <TouchableOpacity
                onPress={() => {
                  const m = parseInt(etaCustom, 10);
                  if (Number.isFinite(m) && m > 0 && m <= 24 * 60) confirmarConETA(m);
                  else Alert.alert('Tiempo inválido', 'Ingresa minutos entre 1 y 1440');
                }}
                disabled={cargandoCodigo || !etaCustom}
                style={{ paddingHorizontal: 18, justifyContent: 'center', borderRadius: 10, backgroundColor: colors.primary, opacity: (cargandoCodigo || !etaCustom) ? 0.5 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>OK</Text>
              </TouchableOpacity>
            </View>

            {/* Sin ETA / cancelar */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setPedidoPendienteETA(null)} disabled={cargandoCodigo}
                style={{ flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', opacity: cargandoCodigo ? 0.5 : 1 }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmarConETA(null)} disabled={cargandoCodigo}
                style={{ flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', opacity: cargandoCodigo ? 0.5 : 1 }}>
                <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 13 }}>Sin ETA</Text>
              </TouchableOpacity>
            </View>

            {cargandoCodigo && (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  avatarSmall: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSub: { fontSize: 12 },
  gpsIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8, backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  gpsText: { fontSize: 11, color: '#16A34A', fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  codigoCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  codigoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codigoTitle: { fontSize: 16, fontWeight: '600' },
  codigoHint: { fontSize: 13 },
  inputRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginTop: 4 },
  codigoInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  confirmarBtn: { width: 52, justifyContent: 'center', alignItems: 'center' },
  successBanner: { backgroundColor: '#22C55E', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center' },
  successTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successSub: { color: '#fff', fontSize: 13, marginTop: 2 },
  pedidosSection: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  emptyState: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  pedidoCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  pedidoHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pedidoId: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  estadoText: { fontSize: 12, fontWeight: '500' },
  pedidoTotal: { fontSize: 17, fontWeight: '700' },
  codigoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  codigoBadgeText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  infoText: { fontSize: 13, flex: 1 },
  entregadoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, marginTop: 4 },
  entregadoBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  notaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  notaText: { fontSize: 12 },
});

export default RepartidorScreen;