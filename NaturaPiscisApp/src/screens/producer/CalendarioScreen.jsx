// src/screens/producer/CalendarioScreen.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios.config';

const DIAS_SEMANA = [
  { key: 'lunes',     label: 'Lun' },
  { key: 'martes',    label: 'Mar' },
  { key: 'miercoles', label: 'Mié' },
  { key: 'jueves',    label: 'Jue' },
  { key: 'viernes',   label: 'Vie' },
  { key: 'sabado',    label: 'Sáb' },
  { key: 'domingo',   label: 'Dom' },
];

const NOMBRE_MES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const ymd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function CalendarioScreen() {
  const { colors: C } = useTheme();
  const S = styles(C);

  const [cursor, setCursor] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const [misDias,     setMisDias]     = useState([]);
  const [excepciones, setExcepciones] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [modal,       setModal]       = useState(null); // { fecha, exc, estado }
  const [motivoExc,   setMotivoExc]   = useState('');
  const [capMaxExc,   setCapMaxExc]   = useState('');

  // Selección de rango
  const [rangeMode,  setRangeMode]  = useState(false);
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd,   setRangeEnd]   = useState(null);
  const [bulkOpen,   setBulkOpen]   = useState(false);
  const [bulkMotivo, setBulkMotivo] = useState('');
  const [bulkCap,    setBulkCap]    = useState('');

  const desde = useMemo(() => {
    const d = new Date(cursor);
    d.setDate(1);
    const dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dow);
    return d;
  }, [cursor]);

  const hasta = useMemo(() => {
    const d = new Date(desde);
    d.setDate(d.getDate() + 41);
    return d;
  }, [desde]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [resDias, resExc] = await Promise.all([
        api.get('/disponibilidad/dias'),
        api.get('/disponibilidad/excepciones', { params: { desde: ymd(desde), hasta: ymd(hasta) } }),
      ]);
      setMisDias(resDias.data?.data || []);
      setExcepciones(resExc.data?.data || []);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el calendario');
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => { cargar(); }, [cargar]);

  const diasHabilitadosSet = useMemo(() => new Set(misDias.map(d => d.dia)), [misDias]);
  const excByFecha = useMemo(() => {
    const map = new Map();
    for (const e of excepciones) {
      const f = typeof e.fecha === 'string' ? e.fecha.slice(0, 10) : ymd(new Date(e.fecha));
      map.set(f, e);
    }
    return map;
  }, [excepciones]);

  const toggleDia = async (diaKey) => {
    setSaving(true);
    try {
      const ya = misDias.find(d => d.dia === diaKey);
      if (ya) {
        await api.delete(`/disponibilidad/dias/${diaKey}`);
      } else {
        await api.put('/disponibilidad/dias', {
          dia: diaKey, hora_inicio: '08:00', hora_fin: '18:00', venta_directa: true,
        });
      }
      await cargar();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo actualizar');
    } finally { setSaving(false); }
  };

  const dias = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(desde);
      d.setDate(desde.getDate() + i);
      const f = ymd(d);
      const exc = excByFecha.get(f);
      const dowKey = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][d.getDay()];
      const enMes = d.getMonth() === cursor.getMonth();
      let estado;
      if (exc?.tipo === 'bloqueado')        estado = 'bloqueado';
      else if (exc?.tipo === 'disponible')  estado = 'disponible';
      else if (diasHabilitadosSet.has(dowKey)) estado = 'disponible';
      else estado = 'inactivo';
      arr.push({ date: d, fecha: f, exc, enMes, estado });
    }
    return arr;
  }, [desde, excByFecha, diasHabilitadosSet, cursor]);

  const hoy = ymd(new Date());

  const colorEstado = (estado) => {
    if (estado === 'disponible') return { bg: 'rgba(34,197,94,.18)',  text: '#22c55e', border: 'rgba(34,197,94,.4)' };
    if (estado === 'bloqueado')  return { bg: 'rgba(239,68,68,.18)',  text: '#ef4444', border: 'rgba(239,68,68,.4)' };
    return { bg: C.card,                                   text: C.textSecondary, border: C.border };
  };

  const abrirExcepcion = (d) => {
    setMotivoExc(d.exc?.motivo || '');
    setCapMaxExc(d.exc?.capacidad_max ? String(d.exc.capacidad_max) : '');
    setModal({ fecha: d.fecha, exc: d.exc, estado: d.estado });
  };

  const rangoOrdenado = useMemo(() => {
    if (!rangeStart) return null;
    const a = rangeStart, b = rangeEnd ?? rangeStart;
    return a <= b ? [a, b] : [b, a];
  }, [rangeStart, rangeEnd]);

  const enRango = (fecha) => {
    if (!rangoOrdenado) return false;
    return fecha >= rangoOrdenado[0] && fecha <= rangoOrdenado[1];
  };

  const clickDia = (d) => {
    if (!rangeMode) { abrirExcepcion(d); return; }
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(d.fecha); setRangeEnd(null); setBulkOpen(false);
    } else {
      setRangeEnd(d.fecha); setBulkOpen(true);
    }
  };

  const limpiarRango = () => { setRangeStart(null); setRangeEnd(null); setBulkOpen(false); setBulkMotivo(''); setBulkCap(''); };
  const salirRange   = () => { setRangeMode(false); limpiarRango(); };

  const aplicarRango = async (tipo) => {
    if (!rangoOrdenado) return;
    setSaving(true);
    try {
      const body = { desde: rangoOrdenado[0], hasta: rangoOrdenado[1], tipo };
      if (tipo === 'bloqueado')  body.motivo = bulkMotivo || null;
      if (tipo === 'disponible') body.capacidad_max = bulkCap ? parseInt(bulkCap, 10) : null;
      await api.put('/disponibilidad/excepciones/bulk', body);
      limpiarRango();
      await cargar();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo aplicar el rango');
    } finally { setSaving(false); }
  };

  const guardarBloqueo = async () => {
    setSaving(true);
    try {
      await api.put('/disponibilidad/excepciones', {
        fecha: modal.fecha, tipo: 'bloqueado', motivo: motivoExc || null,
      });
      setModal(null);
      await cargar();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo bloquear');
    } finally { setSaving(false); }
  };

  const guardarHabilitacion = async () => {
    setSaving(true);
    try {
      await api.put('/disponibilidad/excepciones', {
        fecha: modal.fecha,
        tipo: 'disponible',
        capacidad_max: capMaxExc ? parseInt(capMaxExc, 10) : null,
      });
      setModal(null);
      await cargar();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo habilitar');
    } finally { setSaving(false); }
  };

  const quitarExcepcion = async () => {
    setSaving(true);
    try {
      await api.delete(`/disponibilidad/excepciones/${modal.fecha}`);
      setModal(null);
      await cargar();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo quitar');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <Ionicons name="calendar-outline" size={22} color={C.primary} />
        <Text style={S.titulo}>Calendario de reservas</Text>
      </View>

      <ScrollView contentContainerStyle={S.scroll}>
        {/* Días de la semana */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Días habilitados (semanal)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {DIAS_SEMANA.map(d => {
              const activo = diasHabilitadosSet.has(d.key);
              return (
                <TouchableOpacity key={d.key} onPress={() => toggleDia(d.key)} disabled={saving}
                  style={{
                    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: activo ? 'rgba(34,197,94,.4)' : C.border,
                    backgroundColor: activo ? 'rgba(34,197,94,.18)' : C.card,
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                  }}>
                  <Ionicons name={activo ? 'checkmark' : 'add'} size={13} color={activo ? '#22c55e' : C.textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: activo ? '#22c55e' : C.textSecondary }}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 10 }}>
            Por defecto: 08:00 – 18:00.
          </Text>
        </View>

        {/* Header del mes */}
        <View style={S.monthHeader}>
          <TouchableOpacity onPress={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))} style={S.monthBtn}>
            <Ionicons name="chevron-back" size={18} color={C.text} />
          </TouchableOpacity>
          <Text style={S.monthLabel}>{NOMBRE_MES[cursor.getMonth()]} {cursor.getFullYear()}</Text>
          <TouchableOpacity onPress={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))} style={S.monthBtn}>
            <Ionicons name="chevron-forward" size={18} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* Toggle modo rango */}
        <TouchableOpacity
          onPress={() => rangeMode ? salirRange() : setRangeMode(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            paddingVertical: 10, borderRadius: 10, marginBottom: 10,
            borderWidth: 1.5,
            borderColor: rangeMode ? 'rgba(59,130,246,.5)' : C.border,
            backgroundColor: rangeMode ? 'rgba(59,130,246,.15)' : C.card,
          }}>
          <Ionicons name="apps-outline" size={15} color={rangeMode ? '#3b82f6' : C.text} />
          <Text style={{ color: rangeMode ? '#3b82f6' : C.text, fontWeight: '700', fontSize: 13 }}>
            {rangeMode ? 'Salir de selección' : 'Seleccionar rango de días'}
          </Text>
        </TouchableOpacity>

        {rangeMode && (
          <Text style={{ color: C.textSecondary, fontSize: 11, marginBottom: 8, textAlign: 'center' }}>
            {!rangeStart && 'Toca el día de inicio del rango.'}
            {rangeStart && !rangeEnd && `Inicio: ${rangeStart}. Ahora toca el día final.`}
            {rangeStart && rangeEnd && `Rango: ${rangoOrdenado[0]} → ${rangoOrdenado[1]}`}
          </Text>
        )}

        {/* Grid */}
        <View style={S.card}>
          <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            {['L','M','X','J','V','S','D'].map((l, i) => (
              <Text key={i} style={{ flex: 1, textAlign: 'center', color: C.textSecondary, fontSize: 11, fontWeight: '700' }}>{l}</Text>
            ))}
          </View>
          {loading ? (
            <ActivityIndicator color={C.primary} style={{ marginVertical: 30 }} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {dias.map((d, i) => {
                const c = colorEstado(d.estado);
                const esHoy = d.fecha === hoy;
                const selec = enRango(d.fecha);
                return (
                  <TouchableOpacity key={i} onPress={() => clickDia(d)}
                    style={{
                      width: `${100/7}%`, aspectRatio: 1, padding: 2,
                    }}>
                    <View style={{
                      flex: 1,
                      borderRadius: 10,
                      borderWidth: selec ? 2 : 1.5,
                      borderColor: selec ? '#3b82f6' : esHoy ? C.primary : c.border,
                      backgroundColor: selec ? 'rgba(59,130,246,.25)' : c.bg,
                      alignItems: 'center', justifyContent: 'center',
                      opacity: d.enMes ? 1 : 0.35,
                      position: 'relative',
                    }}>
                      <Text style={{
                        color: selec ? '#3b82f6' : c.text,
                        fontWeight: esHoy || selec ? '800' : '600',
                        fontSize: 13,
                      }}>
                        {d.date.getDate()}
                      </Text>
                      {d.exc && (
                        <View style={{
                          position: 'absolute', top: 4, right: 5,
                          width: 5, height: 5, borderRadius: 3,
                          backgroundColor: selec ? '#3b82f6' : c.text,
                        }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
            <Legend C={C} color="#22c55e" label="Disponible" />
            <Legend C={C} color="#ef4444" label="Bloqueado" />
            <Legend C={C} color={C.textSecondary} label="Inactivo" />
          </View>
        </View>
      </ScrollView>

      {/* Modal bulk rango */}
      <Modal visible={bulkOpen && !!rangoOrdenado} transparent animationType="fade" onRequestClose={() => !saving && setBulkOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <View style={S.modalBox}>
            {rangoOrdenado && (() => {
              const total = Math.round((new Date(rangoOrdenado[1]) - new Date(rangoOrdenado[0])) / (1000*60*60*24)) + 1;
              return (
                <>
                  <Text style={S.modalTitulo}>Aplicar a {total} día{total !== 1 ? 's' : ''}</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 12, marginBottom: 16 }}>
                    {rangoOrdenado[0]} → {rangoOrdenado[1]}
                  </Text>

                  <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>🚫 Bloquear todo el rango</Text>
                  <TextInput style={S.input} placeholder="Motivo (opcional)" placeholderTextColor={C.textSecondary}
                    value={bulkMotivo} onChangeText={setBulkMotivo} />
                  <TouchableOpacity style={[S.btnPrimary, { backgroundColor: '#ef4444' }]} disabled={saving}
                    onPress={() => aplicarRango('bloqueado')}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>Bloquear {total} día{total !== 1 ? 's' : ''}</Text>}
                  </TouchableOpacity>

                  <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 6 }}>✅ Habilitar todo el rango</Text>
                  <TextInput style={S.input} placeholder="Cupo máximo por día (opcional)" placeholderTextColor={C.textSecondary}
                    keyboardType="numeric" value={bulkCap} onChangeText={setBulkCap} />
                  <TouchableOpacity style={[S.btnPrimary, { backgroundColor: '#22c55e' }]} disabled={saving}
                    onPress={() => aplicarRango('disponible')}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>Habilitar {total} día{total !== 1 ? 's' : ''}</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity style={[S.btnGhost, { marginTop: 12, borderWidth: 1, borderColor: C.border, borderRadius: 10 }]}
                    onPress={() => aplicarRango('limpiar')} disabled={saving}>
                    <Ionicons name="trash-outline" size={14} color={C.textSecondary} />
                    <Text style={{ color: C.textSecondary, fontWeight: '600', fontSize: 13 }}>Quitar excepciones del rango</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[S.btnGhost, { marginTop: 6 }]} onPress={() => setBulkOpen(false)} disabled={saving}>
                    <Text style={{ color: C.textSecondary, fontSize: 13 }}>Cancelar</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal excepción */}
      <Modal visible={!!modal} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <View style={S.modalBox}>
            <Text style={S.modalTitulo}>{modal?.fecha}</Text>
            <Text style={{ color: C.textSecondary, fontSize: 12, marginBottom: 16 }}>
              Estado: {modal?.estado}{modal?.exc ? ' · excepción puntual' : ''}
            </Text>

            <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>🚫 Bloquear este día</Text>
            <TextInput style={S.input} placeholder="Motivo (opcional)" placeholderTextColor={C.textSecondary}
              value={motivoExc} onChangeText={setMotivoExc} />
            <TouchableOpacity style={[S.btnPrimary, { backgroundColor: '#ef4444' }]} onPress={guardarBloqueo} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>Bloquear</Text>}
            </TouchableOpacity>

            <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 6 }}>✅ Habilitar (ignora días semanales)</Text>
            <TextInput style={S.input} placeholder="Cupo máximo (opcional)" placeholderTextColor={C.textSecondary}
              keyboardType="numeric" value={capMaxExc} onChangeText={setCapMaxExc} />
            <TouchableOpacity style={[S.btnPrimary, { backgroundColor: '#22c55e' }]} onPress={guardarHabilitacion} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>Habilitar</Text>}
            </TouchableOpacity>

            {modal?.exc && (
              <TouchableOpacity style={[S.btnGhost, { marginTop: 12 }]} onPress={quitarExcepcion} disabled={saving}>
                <Ionicons name="trash-outline" size={14} color={C.textSecondary} />
                <Text style={{ color: C.textSecondary, fontWeight: '600', fontSize: 13 }}>Quitar excepción</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[S.btnGhost, { marginTop: 6 }]} onPress={() => setModal(null)}>
              <Text style={{ color: C.textSecondary, fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const Legend = ({ C, color, label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color, opacity: 0.4 }} />
    <Text style={{ fontSize: 11, color: C.textSecondary }}>{label}</Text>
  </View>
);

const styles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  titulo: { color: C.text, fontSize: 20, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  cardTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  monthBtn: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 8 },
  monthLabel: { color: C.text, fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: C.background, borderRadius: 16, padding: 20 },
  modalTitulo: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, color: C.text, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, fontSize: 13 },
  btnPrimary: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnGhost: { paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
});
