// src/screens/consumer/ProductoresScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';

const BLURHASH = { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' };
import api from '../../api/axios.config';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

// Per-producer gradient pairs
const GRADIENTS = [
  ['#16a34a', '#15803d'],
  ['#22C55E', '#0f766e'],
  ['#8b5cf6', '#6d28d9'],
  ['#f97316', '#c2410c'],
  ['#ec4899', '#be185d'],
  ['#6366f1', '#4338ca'],
];

const ProductoresScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const C = {
    bg:      colors.background,
    surface: colors.surface,
    card:    colors.card,
    border:  colors.border,
    text:    colors.text,
    sub:     colors.textSecondary,
    hint:    colors.textMuted,
    primary: colors.primary,
    teal:    '#22C55E',
    green:   '#4ade80',
    orange:  '#fb923c',
    purple:  '#c084fc',
  };
  const styles = makeStyles(C);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productores, setProductores] = useState([]);
  const [stats, setStats] = useState({ total: 0, disponibles: 0, productos: 0, promedio: 0 });

  useEffect(() => { fetchProductores(); }, []);

  const fetchProductores = async () => {
    try {
      setLoading(true);
      const response = await api.get('/productores');
      const raw = response.data;
      const data = raw?.data?.productores ?? raw?.data ?? raw?.productores ?? [];
      const safeData = Array.isArray(data) ? data : [];
      setProductores(safeData);
      setStats({
        total:       safeData.length,
        disponibles: safeData.filter(p => p.activo !== false).length,
        productos:   safeData.reduce((s, p) => s + (p.productos_count || 0), 0),
        promedio:    safeData.length > 0
          ? (safeData.reduce((s, p) => s + (parseFloat(p.calificacion) || 0), 0) / safeData.length).toFixed(1)
          : 0,
      });
    } catch {
      setProductores([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProductores();
    setRefreshing(false);
  }, []);

  const filtered = productores.filter(p =>
    p.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.especialidad?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const initials = (name = '') =>
    name.split(' ').slice(0, 2).map(n => n[0] || '').join('').toUpperCase() || '?';

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Cargando productores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.headerBlock}>
          <LinearGradient
            colors={['rgba(34,197,94,0.12)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerTopLine} />
          <Text style={styles.headerTitle}>Productores</Text>
          <Text style={styles.headerSub}>Descubre {filtered.length} productor{filtered.length !== 1 ? 'es' : ''} acuícolas</Text>

          {/* Search + Mapa */}
          <View style={styles.searchRow}>
            <View style={[styles.searchBox, { flex: 1 }]}>
              <Ionicons name="search-outline" size={18} color={C.primary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar productores..."
                placeholderTextColor={C.hint}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={C.hint} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('MapaProductores')}
              style={styles.mapaBtn}>
              <Ionicons name="map-outline" size={18} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats row ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
          {[
            { icon: 'people-outline',          label: 'Activos',   value: stats.total,       glow: C.primary },
            { icon: 'checkmark-circle-outline', label: 'Disponibles',value: stats.disponibles, glow: C.green },
            { icon: 'cube-outline',             label: 'Productos', value: stats.productos,   glow: C.orange },
            { icon: 'star-outline',             label: 'Promedio',  value: stats.promedio,    glow: '#facc15' },
          ].map((s, i) => (
            <View key={i} style={[styles.statPill, { borderColor: `${s.glow}30` }]}>
              <LinearGradient colors={[`${s.glow}18`, `${s.glow}08`]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={[styles.statIcon, { backgroundColor: `${s.glow}20` }]}>
                <Ionicons name={s.icon} size={16} color={s.glow} />
              </View>
              <Text style={[styles.statVal, { color: s.glow }]}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Producer list ── */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={C.primary} colors={[C.primary]} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={52} color={C.hint} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptySub}>Intenta con otro término de búsqueda</Text>
            </View>
          ) : (
            filtered.map((productor, index) => {
              const grad = GRADIENTS[index % GRADIENTS.length];
              const ini  = initials(productor.nombre);
              return (
                <TouchableOpacity key={productor.id} style={styles.card} activeOpacity={0.88}
                  onPress={() => navigation.navigate('DetalleProductor', { id: productor.id })}>

                  {/* Top gradient band */}
                  <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardBand}>
                    {/* Glowing top line */}
                    <View style={[styles.cardGlowLine, { backgroundColor: grad[0] }]} />

                    {/* Avatar */}
                    <View style={styles.bandContent}>
                      {productor.foto_perfil ? (
                        <ExpoImage source={{ uri: productor.foto_perfil }} style={styles.avatar} contentFit="cover" transition={250} placeholder={BLURHASH} />
                      ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                          <Text style={styles.avatarText}>{ini}</Text>
                        </View>
                      )}
                      <View style={styles.bandInfo}>
                        <Text style={styles.cardName} numberOfLines={1}>{productor.nombre}</Text>
                        <Text style={styles.cardSpecialty} numberOfLines={1}>
                          {productor.especialidad || 'Productor acuícola'}
                        </Text>
                        {productor.verificado && (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="shield-checkmark" size={11} color={C.green} />
                            <Text style={styles.verifiedText}>Verificado</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Card body */}
                  <View style={styles.cardBody}>
                    {productor.descripcion_chaco ? (
                      <Text style={styles.cardDesc} numberOfLines={2}>{productor.descripcion_chaco}</Text>
                    ) : null}

                    {/* Meta row */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={12} color={C.primary} />
                        <Text style={styles.metaText}>{productor.ubicacion || 'Bolivia'}</Text>
                      </View>
                      {productor.years_experience > 0 && (
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={12} color={C.teal} />
                          <Text style={[styles.metaText, { color: C.teal }]}>
                            {productor.years_experience} años
                          </Text>
                        </View>
                      )}
                      {productor.vende_cocinado && (
                        <View style={styles.metaItem}>
                          <Ionicons name="restaurant-outline" size={12} color={C.orange} />
                          <Text style={[styles.metaText, { color: C.orange }]}>Cocinado</Text>
                        </View>
                      )}
                    </View>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                      <StatPill icon="cube-outline" value={productor.productos_count || 0} label="Productos" glow={C.primary} styles={styles} />
                      <StatPill icon="star" value={productor.calificacion || '—'} label="Rating" glow="#facc15" isRating styles={styles} />
                      <StatPill icon="people-outline" value={productor.clientes || '—'} label="Clientes" glow={C.purple} styles={styles} />
                    </View>
                  </View>

                  {/* CTA button */}
                  <LinearGradient colors={[grad[0] + '22', grad[0] + '08']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaRow}>
                    <Text style={[styles.ctaText, { color: grad[0] }]}>Ver perfil completo</Text>
                    <Ionicons name="chevron-forward" size={16} color={grad[0]} />
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const StatPill = ({ icon, value, label, glow, isRating, styles }) => (
  <View style={[styles.sPill, { borderColor: `${glow}25` }]}>
    <Ionicons name={icon} size={13} color={glow}
      style={isRating ? { marginRight: 2 } : undefined} />
    <Text style={[styles.sPillVal, { color: glow }]}>{value}</Text>
    <Text style={styles.sPillLbl}>{label}</Text>
  </View>
);

const makeStyles = (C) => StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  safeArea:    { flex: 1, backgroundColor: C.bg },
  loadingBox:  { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: C.sub, fontSize: 14 },

  // Header
  headerBlock:   {
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md,
    overflow: 'hidden', position: 'relative',
    borderBottomWidth: 1, borderBottomColor: 'rgba(34,197,94,0.1)',
  },
  headerTopLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(34,197,94,0.3)',
  },
  headerTitle:   { fontSize: 26, fontWeight: 'bold', color: C.text, marginBottom: 2 },
  headerSub:     { fontSize: 13, color: C.sub, marginBottom: 14 },
  searchRow:     { flexDirection: 'row', gap: 8 },
  searchBox:     {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput:   { flex: 1, fontSize: 14, color: C.text },
  mapaBtn:       { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(34,197,94,0.08)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', justifyContent: 'center', alignItems: 'center' },

  // Stats
  statsScroll:   { maxHeight: 100, flexShrink: 0 },
  statsContent:  { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: 10 },
  statPill:      {
    width: 88, padding: 10, borderRadius: 14, alignItems: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },
  statIcon:      {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 5,
  },
  statVal:       { fontSize: 17, fontWeight: 'bold' },
  statLbl:       { fontSize: 9, color: C.sub, marginTop: 1 },

  // List
  list:          { flex: 1 },
  listContent:   { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  empty:         { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle:    { fontSize: 16, fontWeight: '600', color: C.text },
  emptySub:      { fontSize: 13, color: C.sub },

  // Card
  card:          {
    marginBottom: 16, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.15)',
    backgroundColor: C.surface,
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  cardBand:      { paddingHorizontal: 16, paddingVertical: 14 },
  cardGlowLine:  { position: 'absolute', top: 0, left: 0, right: 0, height: 1, opacity: 0.6 },
  bandContent:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:        {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarFallback:{ width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText:    { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  bandInfo:      { flex: 1 },
  cardName:      { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  cardSpecialty: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText:  { fontSize: 10, color: '#4ade80', fontWeight: '600' },

  cardBody:      { paddingHorizontal: 16, paddingVertical: 12 },
  cardDesc:      { fontSize: 12, color: C.sub, lineHeight: 18, marginBottom: 10 },
  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  metaItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:      { fontSize: 11, color: C.sub },

  statsRow:      { flexDirection: 'row', gap: 8 },
  sPill:         {
    flex: 1, borderRadius: 10, padding: 8, alignItems: 'center',
    backgroundColor: C.card, borderWidth: 1,
  },
  sPillVal:      { fontSize: 14, fontWeight: '700', marginTop: 2 },
  sPillLbl:      { fontSize: 9, color: C.hint, marginTop: 1 },

  ctaRow:        {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(34,197,94,0.08)',
  },
  ctaText:       { fontSize: 13, fontWeight: '700' },
});

export default ProductoresScreen;
