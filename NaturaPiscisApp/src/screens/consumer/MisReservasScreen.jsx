// src/screens/consumer/MisReservasScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios.config';
import { useTheme } from '../../contexts/ThemeContext';

const ESTADOS = [
  { key: 'pendiente', label: 'Pendientes', color: '#fbbf24', icon: 'hourglass-outline' },
  { key: 'aceptada',  label: 'Aceptadas',  color: '#22c55e', icon: 'checkmark-circle-outline' },
  { key: 'rechazada', label: 'Rechazadas', color: '#ef4444', icon: 'close-circle-outline' },
  { key: 'expirada',  label: 'Expiradas',  color: '#94a3b8', icon: 'time-outline' },
  { key: 'cancelada', label: 'Canceladas', color: '#94a3b8', icon: 'close-outline' },
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

export default function MisReservasScreen() {
  const { colors: C } = useTheme();
  const S = styles(C);

  const [filtro,     setFiltro]     = useState('pendiente');
  const [reservas,   setReservas]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const cancelar = (r) => {
    Alert.alert('Cancelar reserva', '¿Seguro que quieres cancelar esta reserva?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: async () => {
        setSaving(true);
        try {
          await api.patch(`/reservas/${r.id}/cancelar`);
          cargar();
        } catch (e) {
          Alert.alert('Error', e.response?.data?.message || 'No se pudo cancelar');
        } finally { setSaving(false); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <Ionicons name="calendar-outline" size={22} color={C.primary} />
        <Text style={S.titulo}>Mis reservas</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}>
        {ESTADOS.map(e => (
          <TouchableOpacity key={e.key}
            style={{
              paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
              borderWidth: 1.5,
              borderColor: filtro === e.key ? e.color : C.border,
              backgroundColor: filtro === e.key ? e.color + '1f' : C.card,
              flexDirection: 'row', alignItems: 'center', gap: 5,
            }}
            onPress={() => setFiltro(e.key)}>
            <Ionicons name={e.icon} size={13} color={filtro === e.key ? e.color : C.textSecondary} />
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
            <Text style={S.emptyText}>No tienes reservas {filtro}</Text>
          </View>
        ) : reservas.map(r => {
          const conf = ESTADOS.find(e => e.key === r.estado);
          const total = r.precio_estimado
            ? Number(r.precio_estimado)
            : (r.producto_precio ? Number(r.producto_precio) * Number(r.cantidad) : null);
          return (
            <View key={r.id} style={S.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <View style={{ paddingHorizontal: 10, paddingVertical: 2, backgroundColor: conf.color + '1f', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name={conf.icon} size={11} color={conf.color} />
                  <Text style={{ color: conf.color, fontSize: 11, fontWeight: '700' }}>{conf.label}</Text>
                </View>
              </View>
              {r.codigo && (
                <View style={{ marginBottom: 10, padding: 10, backgroundColor: C.primary + '12', borderColor: C.primary + '40', borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="pricetag" size={16} color={C.primary} />
                  <View>
                    <Text style={{ color: C.textSecondary, fontSize: 10 }}>Código de reserva</Text>
                    <Text style={{ color: C.primary, fontWeight: '900', fontSize: 18, letterSpacing: 2 }}>{r.codigo}</Text>
                  </View>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.textSecondary, fontSize: 12 }}>
                    Productor: <Text style={{ color: C.text, fontWeight: '700' }}>{r.productor_nombre || '—'}</Text>
                  </Text>
                  {r.items && r.items.length > 0 ? (
                    r.items.map((it, idx) => (
                      <Text key={idx} style={{ color: C.text, fontSize: 14, fontWeight: '700', marginTop: idx === 0 ? 4 : 2 }}>
                        {it.modo === 'peso' ? `${Number(it.peso_solicitado_kg)} kg` : `${Number(it.cantidad)} 🐟`} · {it.producto_nombre}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: C.text, fontSize: 14, fontWeight: '700', marginTop: 4 }}>
                      {r.cantidad} × {r.producto_nombre || 'producto'}
                    </Text>
                  )}
                  <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 2, textTransform: 'capitalize' }}>
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
                {total !== null && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: C.textSecondary, fontSize: 10 }}>{r.estado === 'aceptada' ? 'Estimado final' : 'Estimado'}</Text>
                    <Text style={{ color: C.text, fontWeight: '800', fontSize: 16 }}>Bs {total.toFixed(2)}</Text>
                  </View>
                )}
              </View>

              <Text style={{ color: C.textSecondary, fontSize: 10, marginTop: 8 }}>
                Solicitada: {fmtFechaHora(r.fecha_creacion)}
              </Text>

              {r.pedido_codigo_retiro && (
                <View style={{ marginTop: 10, padding: 10, backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)', borderWidth: 1, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View>
                    <Text style={{ color: C.textSecondary, fontSize: 10 }}>Código de retiro</Text>
                    <Text style={{ color: '#22c55e', fontWeight: '800', fontSize: 16, letterSpacing: 1 }}>{r.pedido_codigo_retiro}</Text>
                  </View>
                  {r.pedido_estado && (
                    <View style={{ paddingHorizontal: 10, paddingVertical: 3, backgroundColor: '#22c55e', borderRadius: 12 }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' }}>
                        {String(r.pedido_estado).replace(/_/g, ' ')}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {r.estado === 'pendiente' && (
                <TouchableOpacity
                  style={{ marginTop: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(239,68,68,.15)', borderColor: 'rgba(239,68,68,.3)', borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  onPress={() => cancelar(r)} disabled={saving}>
                  <Ionicons name="close" size={13} color="#ef4444" />
                  <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 12 }}>Cancelar reserva</Text>
                </TouchableOpacity>
              )}

              {r.estado === 'aceptada' && r.pedido_codigo_retiro && (
                <Text style={{ marginTop: 10, fontSize: 11, color: C.textSecondary, fontStyle: 'italic' }}>
                  La reserva ya fue aceptada y se creó tu pedido. Si necesitas cancelarlo, hazlo desde Mis Pedidos.
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
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
});
