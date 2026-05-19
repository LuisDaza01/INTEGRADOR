// src/screens/producer/ReservasScreen.jsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios.config';

const ESTADOS = [
  { key: 'pendiente', label: 'Pendientes', color: '#fbbf24' },
  { key: 'aceptada',  label: 'Aceptadas',  color: '#22c55e' },
  { key: 'rechazada', label: 'Rechazadas', color: '#ef4444' },
  { key: 'expirada',  label: 'Expiradas',  color: '#94a3b8' },
  { key: 'cancelada', label: 'Canceladas', color: '#94a3b8' },
];

const fmtFecha = (s) => {
  if (!s) return '';
  return new Date(`${String(s).slice(0, 10)}T00:00:00`).toLocaleDateString('es-BO', {
    weekday: 'long', day: '2-digit', month: 'long',
  });
};

const fmtFechaHora = (s) => {
  if (!s) return '';
  return new Date(s).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
};

const tiempoRestante = (expires_at) => {
  if (!expires_at) return null;
  const ms = new Date(expires_at) - new Date();
  if (ms <= 0) return { texto: 'Expirada', color: '#ef4444' };
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return { texto: `${mins} min`, color: mins < 30 ? '#ef4444' : '#fbbf24' };
  const hrs = Math.floor(mins / 60);
  return { texto: `${hrs} h`, color: hrs < 6 ? '#fbbf24' : '#22c55e' };
};

export default function ReservasScreen() {
  const { colors: C } = useTheme();
  const S = styles(C);
  const [filtro,     setFiltro]     = useState('pendiente');
  const [reservas,   setReservas]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rechazoFor, setRechazoFor] = useState(null);
  const [motivo,     setMotivo]     = useState('');
  const [saving,     setSaving]     = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await api.get('/reservas', { params: { estado: filtro } });
      setReservas(r.data?.data || []);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtro]);

  useEffect(() => { setLoading(true); cargar(); }, [cargar]);
  useEffect(() => {
    const i = setInterval(cargar, 30000);
    return () => clearInterval(i);
  }, [cargar]);

  const aceptar = async (r) => {
    setSaving(true);
    try {
      await api.patch(`/reservas/${r.id}/aceptar`);
      Alert.alert('Reserva aceptada', `Reserva de ${r.consumidor_nombre} confirmada`);
      cargar();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo aceptar');
    } finally { setSaving(false); }
  };

  const rechazar = async () => {
    if (!rechazoFor) return;
    setSaving(true);
    try {
      await api.patch(`/reservas/${rechazoFor.id}/rechazar`, { motivo: motivo || null });
      setRechazoFor(null); setMotivo('');
      cargar();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo rechazar');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <Ionicons name="calendar-outline" size={22} color={C.primary} />
        <Text style={S.titulo}>Reservas</Text>
      </View>

      {/* Tabs estado */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}>
        {ESTADOS.map(e => (
          <TouchableOpacity key={e.key}
            style={{
              paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
              borderWidth: 1.5,
              borderColor: filtro === e.key ? e.color : C.border,
              backgroundColor: filtro === e.key ? e.color + '1f' : C.card,
            }}
            onPress={() => setFiltro(e.key)}>
            <Text style={{ color: filtro === e.key ? e.color : C.textSecondary, fontWeight: '700', fontSize: 12 }}>
              {e.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={S.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} />}>
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : reservas.length === 0 ? (
          <View style={S.empty}>
            <Ionicons name="calendar-outline" size={48} color={C.textSecondary} />
            <Text style={S.emptyText}>No hay reservas {filtro}</Text>
          </View>
        ) : reservas.map(r => {
          const restante = filtro === 'pendiente' ? tiempoRestante(r.expires_at) : null;
          const total = r.precio_estimado
            ? Number(r.precio_estimado)
            : (r.producto_precio ? Number(r.producto_precio) * Number(r.cantidad) : null);
          return (
            <View key={r.id} style={S.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="person-outline" size={14} color={C.textSecondary} />
                    <Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }}>
                      {r.consumidor_nombre || 'Consumidor'}
                    </Text>
                  </View>
                  {r.consumidor_telefono && (
                    <Text style={{ color: C.textSecondary, fontSize: 12, marginBottom: 4 }}>
                      📱 {r.consumidor_telefono}
                    </Text>
                  )}
                  <Text style={{ color: C.text, fontSize: 13, marginBottom: 2 }}>
                    <Text style={{ fontWeight: '700' }}>{r.cantidad}</Text> × {r.producto_nombre || 'producto'}
                    {r.es_cocinado ? ' · cocinado' : ''}
                  </Text>
                  <Text style={{ color: C.textSecondary, fontSize: 12, textTransform: 'capitalize' }}>
                    Para: {fmtFecha(r.fecha_reserva)}
                    {r.hora_reserva ? ` · ${String(r.hora_reserva).slice(0, 5)}` : ''}
                  </Text>
                  {r.notas && (
                    <View style={{ marginTop: 8, padding: 8, backgroundColor: C.background, borderRadius: 6 }}>
                      <Text style={{ color: C.textSecondary, fontSize: 11, fontStyle: 'italic' }}>{r.notas}</Text>
                    </View>
                  )}
                  {r.motivo_rechazo && (
                    <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>
                      Motivo: {r.motivo_rechazo}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  {total !== null && (
                    <View>
                      <Text style={{ color: C.textSecondary, fontSize: 10 }}>Estimado</Text>
                      <Text style={{ color: C.text, fontWeight: '800', fontSize: 16 }}>Bs {total.toFixed(2)}</Text>
                    </View>
                  )}
                  {restante && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: restante.color + '1f', borderRadius: 12 }}>
                      <Ionicons name="time-outline" size={11} color={restante.color} />
                      <Text style={{ color: restante.color, fontSize: 10, fontWeight: '700' }}>{restante.texto}</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={{ color: C.textSecondary, fontSize: 10, marginTop: 8 }}>
                Solicitada: {fmtFechaHora(r.fecha_creacion)}
              </Text>

              {filtro === 'pendiente' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#22c55e', borderRadius: 8, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onPress={() => aceptar(r)} disabled={saving}>
                    <Ionicons name="checkmark" size={15} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Aceptar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(239,68,68,.15)', borderColor: 'rgba(239,68,68,.3)', borderWidth: 1, borderRadius: 8, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onPress={() => { setRechazoFor(r); setMotivo(''); }} disabled={saving}>
                    <Ionicons name="close" size={15} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Modal rechazo */}
      <Modal visible={!!rechazoFor} transparent animationType="fade" onRequestClose={() => setRechazoFor(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <View style={S.modalBox}>
            <Text style={S.modalTitulo}>Rechazar reserva</Text>
            <Text style={{ color: C.textSecondary, fontSize: 12, marginBottom: 12 }}>
              Reserva de {rechazoFor?.consumidor_nombre} para el {fmtFecha(rechazoFor?.fecha_reserva)}
            </Text>
            <Text style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>Motivo (opcional)</Text>
            <TextInput style={[S.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Ej. No tengo stock para esa fecha"
              placeholderTextColor={C.textSecondary}
              value={motivo} onChangeText={setMotivo} multiline />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[S.btnPrimary, { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border }]} onPress={() => setRechazoFor(null)}>
                <Text style={{ color: C.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.btnPrimary, { backgroundColor: '#ef4444' }]} onPress={rechazar} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>Confirmar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  titulo: { color: C.text, fontSize: 20, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: C.textSecondary, marginTop: 12, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: C.background, borderRadius: 16, padding: 20 },
  modalTitulo: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, color: C.text, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  btnPrimary: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
