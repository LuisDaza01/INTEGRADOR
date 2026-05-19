// src/screens/consumer/TrazabilidadScreen.jsx
// Se abre cuando el consumidor escanea el QR del producto
// Navegación: navigation.navigate('Trazabilidad', { productoId: 42 })
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/axios.config';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

// ── Paso del timeline ─────────────────────────────────────────
const TimelineStep = ({ icon, title, subtitle, date, active, last, colors }) => (
  <View style={styles.stepRow}>
    <View style={styles.stepLeft}>
      <View style={[styles.stepDot, { backgroundColor: active ? '#0d9488' : colors.border, borderColor: active ? '#0d9488' : colors.border }]}>
        <Ionicons name={icon} size={14} color={active ? '#fff' : colors.textSecondary} />
      </View>
      {!last && <View style={[styles.stepLine, { backgroundColor: active ? '#0d9488' : colors.border }]} />}
    </View>
    <View style={[styles.stepContent, !last && { paddingBottom: 20 }]}>
      <Text style={[styles.stepTitle, { color: active ? colors.text : colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.stepSub,   { color: colors.textSecondary }]}>{subtitle}</Text>
      {date && <Text style={[styles.stepDate, { color: colors.textSecondary }]}>{date}</Text>}
    </View>
  </View>
);

// ── Badge de parámetro ─────────────────────────────────────────
const ParamBadge = ({ icon, label, value, color, bg }) => (
  <View style={[styles.paramBadge, { backgroundColor: bg, borderColor: color + '40' }]}>
    <Ionicons name={icon} size={16} color={color} />
    <View>
      <Text style={[styles.paramLabel, { color: color }]}>{label}</Text>
      <Text style={[styles.paramValue, { color }]}>{value}</Text>
    </View>
  </View>
);

const TrazabilidadScreen = ({ route, navigation }) => {
  const { productoId } = route.params;
  const { colors } = useTheme();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [showParams, setShowParams] = useState(false);

  useEffect(() => {
    fetchTrazabilidad();
  }, [productoId]);

  const fetchTrazabilidad = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/productos/${productoId}/trazabilidad`);
      setData(res.data.data || res.data);
    } catch (e) {
      setError(e.response?.status === 404 ? 'Producto no encontrado' : 'Error al cargar trazabilidad');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color="#0d9488" />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Verificando origen...</Text>
    </View>
  );

  if (error) return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <TouchableOpacity style={styles.backBtnTop} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: '#0d9488' }]} onPress={fetchTrazabilidad}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (!data) return null;

  const { producto, productor, crianza, entrega, estadisticas } = data;

  const fechaRegistro = new Date(producto.fechaRegistro).toLocaleDateString('es-BO', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header degradado */}
      <LinearGradient colors={['#0f766e', '#0d9488']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Ionicons name="qr-code-outline" size={20} color="#5eead4" />
              <Text style={styles.headerLabel}>Trazabilidad verificada</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          <Text style={styles.headerProducto}>{producto.nombre}</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#5eead4" />
            <Text style={styles.verifiedText}>Origen verificado · Monitoreo IoT 24/7</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Imagen */}
        {producto.imagen && (
          <Image source={{ uri: producto.imagen }} style={styles.productoImg} resizeMode="cover" />
        )}

        {/* ── Timeline ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            <Ionicons name="time-outline" size={16} color={colors.primary} /> Recorrido del producto
          </Text>
          <View style={{ marginTop: 12 }}>
            <TimelineStep icon="location"         title={`Criado en ${productor.ubicacion || 'Chapare, Bolivia'}`}   subtitle={`${productor.empresa || productor.nombre} · ${crianza.especie}`} date={`Registrado: ${fechaRegistro}`} active last={false} colors={colors} />
            <TimelineStep icon="pulse"            title="Monitoreo continuo del agua"        subtitle={crianza.monitoreo}                      active last={false} colors={colors} />
            <TimelineStep icon="fish"             title="Cosechado y preparado"               subtitle={`Por ${productor.empresa || productor.nombre}`} active last={false} colors={colors} />
            {entrega ? (
              <TimelineStep icon="checkmark-done" title="Entregado al consumidor"             subtitle={`Conductor: ${entrega.repartidor}`}    date={new Date(entrega.fechaEntrega).toLocaleDateString('es-BO')} active last colors={colors} />
            ) : (
              <TimelineStep icon="bicycle"        title="En camino a tu mesa"                subtitle="Pendiente de entrega"                  active={false} last colors={colors} />
            )}
          </View>
        </View>

        {/* ── Productor ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            <Ionicons name="person-outline" size={16} color={colors.primary} /> Quién lo produjo
          </Text>
          <View style={styles.productorRow}>
            <View style={[styles.productorAvatar, { backgroundColor: '#0d948820' }]}>
              <Ionicons name="fish" size={28} color="#0d9488" />
            </View>
            <View style={styles.productorInfo}>
              <Text style={[styles.productorNombre, { color: colors.text }]}>{productor.empresa || productor.nombre}</Text>
              <Text style={[styles.productorEsp,    { color: colors.textSecondary }]}>{productor.especialidad || 'Acuicultura'}</Text>
              {productor.ubicacion && (
                <View style={styles.ubicRow}>
                  <Ionicons name="location-outline" size={13} color="#0d9488" />
                  <Text style={[styles.ubicText, { color: colors.textSecondary }]}>{productor.ubicacion}</Text>
                </View>
              )}
            </View>
          </View>
          {productor.descripcion && (
            <Text style={[styles.productorDesc, { color: colors.textSecondary }]}>{productor.descripcion}</Text>
          )}
          {productor.certificaciones && (
            <View style={[styles.certBadge, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
              <Ionicons name="ribbon-outline" size={14} color="#16a34a" />
              <Text style={styles.certText}>{productor.certificaciones}</Text>
            </View>
          )}
        </View>

        {/* ── Parámetros del agua ── */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          onPress={() => setShowParams(!showParams)}
          activeOpacity={0.85}
        >
          <View style={styles.paramHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              <Ionicons name="leaf-outline" size={16} color="#16a34a" /> Condiciones de crianza
            </Text>
            <Ionicons name={showParams ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
          </View>

          {showParams && (
            <View style={{ marginTop: 12, gap: 8 }}>
              <ParamBadge icon="thermometer-outline" label="Temperatura" value={crianza.parametrosOptimos.temperatura} color="#ef4444" bg="#fef2f2" />
              <ParamBadge icon="flask-outline"       label="pH del agua" value={crianza.parametrosOptimos.ph}          color="#3b82f6" bg="#eff6ff" />
              <ParamBadge icon="eye-outline"         label="Turbidez"    value={crianza.parametrosOptimos.turbidez}    color="#8b5cf6" bg="#f5f3ff" />
              <View style={[styles.iotBadge, { backgroundColor: '#f0fdfa', borderColor: '#5eead4' }]}>
                <Ionicons name="hardware-chip-outline" size={16} color="#0d9488" />
                <Text style={styles.iotText}>{crianza.monitoreo}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Estadísticas ── */}
        {estadisticas?.totalPedidos > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              <Ionicons name="stats-chart-outline" size={16} color={colors.primary} /> En números
            </Text>
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: '#f0fdfa' }]}>
                <Text style={[styles.statNum, { color: '#0d9488' }]}>{estadisticas.totalPedidos}</Text>
                <Text style={styles.statLabel}>pedidos</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#eff6ff' }]}>
                <Text style={[styles.statNum, { color: '#3b82f6' }]}>{estadisticas.unidadesVendidas}</Text>
                <Text style={styles.statLabel}>kg vendidos</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="fish" size={20} color="#0d9488" />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            NaturaPiscis · Plataforma acuícola del Chapare
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1 },
  centered:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:      { fontSize: 14 },
  headerGradient:   { paddingBottom: 20 },
  headerRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  backBtnHeader:    { width: 40, height: 40, justifyContent: 'center' },
  backBtnTop:       { padding: 16 },
  headerCenter:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerLabel:      { color: '#ccfbf1', fontSize: 13, fontWeight: '500' },
  headerProducto:   { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 20, marginTop: 8 },
  verifiedBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginTop: 6, marginBottom: 4 },
  verifiedText:     { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  scroll:           { flex: 1 },
  productoImg:      { width: '100%', height: 200 },
  card:             { margin: 12, marginBottom: 0, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.lg },
  cardTitle:        { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  // Timeline
  stepRow:          { flexDirection: 'row', gap: 12 },
  stepLeft:         { alignItems: 'center', width: 28 },
  stepDot:          { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  stepLine:         { width: 2, flex: 1, marginTop: 4, minHeight: 16 },
  stepContent:      { flex: 1 },
  stepTitle:        { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  stepSub:          { fontSize: 12, lineHeight: 17 },
  stepDate:         { fontSize: 11, marginTop: 3 },
  // Productor
  productorRow:     { flexDirection: 'row', gap: 12, marginTop: 10 },
  productorAvatar:  { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  productorInfo:    { flex: 1 },
  productorNombre:  { fontSize: 15, fontWeight: '700' },
  productorEsp:     { fontSize: 12, marginTop: 1 },
  ubicRow:          { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  ubicText:         { fontSize: 11 },
  productorDesc:    { fontSize: 13, lineHeight: 19, marginTop: 10 },
  certBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, borderWidth: 1, marginTop: 10 },
  certText:         { color: '#16a34a', fontSize: 12, fontWeight: '500', flex: 1 },
  // Params
  paramHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paramBadge:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  paramLabel:       { fontSize: 11, fontWeight: '500' },
  paramValue:       { fontSize: 13, fontWeight: '700', marginTop: 1 },
  iotBadge:         { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  iotText:          { color: '#0f766e', fontSize: 12, flex: 1 },
  // Stats
  statsRow:         { flexDirection: 'row', gap: 12, marginTop: 10 },
  statBox:          { flex: 1, alignItems: 'center', padding: 16, borderRadius: 12 },
  statNum:          { fontSize: 28, fontWeight: '800' },
  statLabel:        { fontSize: 12, color: '#6b7280', marginTop: 2 },
  // Misc
  footer:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  footerText:       { fontSize: 12 },
  errorTitle:       { fontSize: 16, fontWeight: '600' },
  retryBtn:         { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText:        { color: '#fff', fontWeight: '600' },
});

export default TrazabilidadScreen;