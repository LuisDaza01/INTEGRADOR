// src/screens/consumer/HomeScreenConsumer.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios.config';
import { SkeletonProductCard, SkeletonOrderCard, SkeletonStatCard } from '../../components/ui/Skeleton';
import { FishIndicator } from '../../components/ui/FishRefreshControl';

const { width } = Dimensions.get('window');

const HomeScreenConsumer = ({ navigation }) => {
  const { user }        = useAuth();
  const { colors, isDarkMode } = useTheme();
  const C = {
    bg:      colors.background,
    surface: colors.surface,
    card:    colors.card,
    border:  colors.border,
    text:    colors.text,
    sub:     colors.textSecondary,
    hint:    colors.textMuted,
    primary: colors.secondary,
    teal:    '#14b8a6',
    green:   '#4ade80',
    orange:  '#fb923c',
    purple:  '#c084fc',
  };
  const styles = makeStyles(C, isDarkMode);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [productos, setProductos]   = useState([]);
  const [pedidos, setPedidos]       = useState([]);

  // Wave animation
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeWave = (val, duration, delay) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration, useNativeDriver: true }),
      ]));
    Animated.parallel([
      makeWave(wave1, 3200, 0),
      makeWave(wave2, 2600, 500),
      makeWave(wave3, 3800, 1000),
    ]).start();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, pedRes] = await Promise.all([
        api.get('/productos?limit=6').catch(() => ({ data: { data: [] } })),
        api.get('/pedidos/recientes').catch(() => ({ data: [] })),
      ]);
      setProductos(prodRes.data.data || prodRes.data || []);
      setPedidos(pedRes.data.data || pedRes.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const pedidoActivo    = pedidos.find(p => ['en_camino', 'listo_para_recoger', 'preparando', 'confirmado'].includes(p.estado || p.status));
  const pedidoEnCamino  = pedidos.find(p => (p.estado || p.status) === 'en_camino');
  const firstName       = user?.nombre?.split(' ')[0] || 'Amigo';

  const statusColor = e => ({ pendiente:'#f59e0b', confirmado:'#3b82f6', preparando:'#8b5cf6', listo_para_recoger:'#10b981', en_camino:'#06b6d4', entregado:'#22c55e', cancelado:'#ef4444' }[e] || '#6b7280');
  const statusLabel = e => ({ pendiente:'Pendiente', confirmado:'Confirmado', preparando:'Preparando', listo_para_recoger:'Listo', en_camino:'En camino', entregado:'Entregado', cancelado:'Cancelado' }[e] || e);
  const puedeTracking = e => ['pendiente','confirmado','preparando','listo_para_recoger','en_camino'].includes(e);

  if (loading) return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Hero skeleton */}
      <View style={[styles.hero, { paddingBottom: 20 }]}>
        <View style={{ marginBottom: 16 }}>
          <SkeletonStatCard />
        </View>
      </View>
      {/* Feature chips skeleton */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={{ width: 90, height: 80, borderRadius: 16, marginRight: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border }} />
        ))}
      </ScrollView>
      {/* Products skeleton */}
      <View style={styles.section}>
        <View style={{ height: 14, width: 160, borderRadius: 7, backgroundColor: C.card, marginBottom: 12 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonProductCard key={i} />)}
        </ScrollView>
      </View>
      {/* Orders skeleton */}
      <View style={styles.section}>
        <View style={{ height: 14, width: 140, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />
        {Array.from({ length: 3 }).map((_, i) => <SkeletonOrderCard key={i} />)}
      </View>
    </ScrollView>
  );

  return (
    <ScrollView style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="transparent" colors={['transparent']} progressBackgroundColor="transparent" />}
      showsVerticalScrollIndicator={false}>
      <FishIndicator visible={refreshing} />

      {/* ── Hero ── */}
      <LinearGradient
        colors={isDarkMode ? ['#071228', '#0a1835', '#060f22', '#030b18'] : ['#e0f2fe', '#f0f9ff', '#f9fafb', '#e0fdfa']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        {/* Shimmer top line */}
        <LinearGradient colors={['transparent', C.primary, C.teal, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroLine} />

        {/* Glow orbs */}
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />

        {/* Animated waves */}
        <Animated.View style={[styles.wave, styles.waveA, {
          transform: [{ translateY: wave1.interpolate({ inputRange: [0,1], outputRange: [0,-8] }) }],
          opacity:    wave1.interpolate({ inputRange: [0,0.5,1], outputRange: [0.3,0.5,0.3] }),
        }]} />
        <Animated.View style={[styles.wave, styles.waveB, {
          transform: [{ translateY: wave2.interpolate({ inputRange: [0,1], outputRange: [0,-10] }) }],
          opacity:    wave2.interpolate({ inputRange: [0,0.5,1], outputRange: [0.2,0.4,0.2] }),
        }]} />
        <Animated.View style={[styles.wave, styles.waveC, {
          transform: [{ translateY: wave3.interpolate({ inputRange: [0,1], outputRange: [0,-6] }) }],
          opacity:    wave3.interpolate({ inputRange: [0,0.5,1], outputRange: [0.12,0.25,0.12] }),
        }]} />

        {/* Hero content */}
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroSub}>Bienvenido de vuelta</Text>
            <Text style={styles.heroName}>{firstName}</Text>
            <View style={styles.heroBadge}>
              <Ionicons name="fish" size={12} color={C.teal} />
              <Text style={styles.heroBadgeText}>Acuicultura sostenible</Text>
            </View>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Busqueda')}>
              <Ionicons name="search-outline" size={20} color={C.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Conversaciones')}>
              <Ionicons name="chatbubbles-outline" size={20} color={C.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Carrito')}>
              <Ionicons name="cart-outline" size={20} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA button */}
        <TouchableOpacity onPress={() => navigation.navigate('Tienda')} style={styles.heroCta} activeOpacity={0.85}>
          <LinearGradient colors={['#0ea5e9', '#14b8a6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.heroCtaGrad}>
            <Ionicons name="storefront-outline" size={16} color="#fff" />
            <Text style={styles.heroCtaText}>Explorar productores</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Banner pedido en camino ── */}
      {pedidoEnCamino && (
        <TouchableOpacity style={[styles.activeBanner, { borderColor: 'rgba(6,182,212,0.4)' }]}
          onPress={() => navigation.navigate('TrackingPedido', { pedidoId: pedidoEnCamino.rawId || pedidoEnCamino.id })}
          activeOpacity={0.88}>
          <LinearGradient colors={['rgba(6,182,212,0.15)', 'rgba(6,182,212,0.08)']}
            style={StyleSheet.absoluteFill} />
          <View style={styles.activeBannerLeft}>
            <View style={[styles.activePulse, { borderColor: '#06b6d4' }]}>
              <Ionicons name="bicycle" size={20} color="#06b6d4" />
            </View>
            <View>
              <Text style={styles.activeBannerTitle}>Pedido en camino</Text>
              <Text style={styles.activeBannerSub}>Toca para ver en el mapa</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.hint} />
        </TouchableOpacity>
      )}

      {/* ── Feature chips ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        {[
          { icon: 'fish-outline',  color: C.primary, label: 'Frescos',     sub: 'Del criadero' },
          { icon: 'leaf-outline',  color: C.green,   label: 'Sostenible',  sub: 'Eco-certif.' },
          { icon: 'time-outline',  color: C.orange,  label: 'Entrega',     sub: '24-48h' },
          { icon: 'shield-outline', color: C.purple,  label: 'Garantizado', sub: '100% seguro' },
        ].map((f, i) => (
          <View key={i} style={styles.featureChip}>
            <View style={[styles.featureIcon, { borderColor: `${f.color}35`, backgroundColor: `${f.color}12` }]}>
              <Ionicons name={f.icon} size={20} color={f.color} />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
            <Text style={styles.featureSub}>{f.sub}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ── Analizar frescura ── */}
      <TouchableOpacity
        style={[styles.frescuraCard, { backgroundColor: C.card, borderColor: 'rgba(34,197,94,0.3)' }]}
        onPress={() => navigation.navigate('AnalizarFrescura')}
        activeOpacity={0.85}
      >
        <View style={[styles.frescuraIconWrap, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
          <Text style={{ fontSize: 28 }}>🔬</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.frescuraTitulo, { color: C.text }]}>¿Es fresco tu pescado?</Text>
          <Text style={[styles.frescuraSub, { color: C.sub }]}>Toma una foto y la IA lo analiza en segundos</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={C.hint} />
      </TouchableOpacity>

      {/* ── Productos destacados ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Productos Destacados</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tienda')}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 4 }}>
          {productos.length > 0 ? productos.slice(0, 6).map(p => (
            <TouchableOpacity key={p.id} style={styles.productCard}
              onPress={() => navigation.navigate('DetalleProducto', { id: p.id })}
              activeOpacity={0.88}>
              {/* Card inner gradient */}
              <LinearGradient
                colors={isDarkMode ? ['rgba(30,58,100,0.22)', 'rgba(9,15,30,0.65)'] : ['transparent', 'transparent']}
                style={StyleSheet.absoluteFill} />

              {/* Image */}
              <View style={styles.productImgWrap}>
                {p.imagen_url ? (
                  <Image source={{ uri: p.imagen_url }} style={styles.productImg} />
                ) : (
                  <View style={styles.productImgFallback}>
                    <Ionicons name="fish-outline" size={32} color={C.hint} />
                  </View>
                )}
                {/* Top gradient overlay */}
                <LinearGradient
                  colors={isDarkMode ? ['transparent', 'rgba(6,13,31,0.75)'] : ['transparent', 'rgba(0,0,0,0.18)']}
                  style={styles.productImgOverlay} />
                {/* Favorite */}
                <TouchableOpacity style={styles.favBtn}>
                  <Ionicons name="heart-outline" size={15} color={C.sub} />
                </TouchableOpacity>
              </View>

              {/* Info */}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{p.nombre}</Text>
                <Text style={styles.productCat}>{p.categoria || 'Pescado Fresco'}</Text>
                <View style={styles.productFooter}>
                  <Text style={styles.productPrice}>Bs {parseFloat(p.precio || 0).toFixed(2)}</Text>
                  <TouchableOpacity style={styles.addBtn}
                    onPress={() => navigation.navigate('DetalleProducto', { id: p.id })}>
                    <LinearGradient colors={['#0ea5e9', '#14b8a6']} style={styles.addBtnGrad}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyState}>
              <Ionicons name="fish-outline" size={36} color={C.hint} />
              <Text style={styles.emptyText}>No hay productos</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── Pedidos recientes ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pedidos Recientes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MisPedidos')}>
            <Text style={styles.seeAll}>Ver historial</Text>
          </TouchableOpacity>
        </View>

        {pedidos.length > 0 ? pedidos.slice(0, 3).map(pedido => {
          const estado = pedido.estado || pedido.status;
          const sc     = statusColor(estado);
          return (
            <View key={pedido.id} style={styles.orderCard}>
              <LinearGradient
                colors={isDarkMode ? ['rgba(15,23,42,0.97)', 'rgba(9,15,30,0.99)'] : [C.surface, C.surface]}
                style={StyleSheet.absoluteFill} />
              {/* Shimmer top line */}
              <View style={[styles.orderShimmer, { backgroundColor: `${sc}50` }]} />
              <View style={styles.orderTop}>
                <View style={[styles.orderIcon, { backgroundColor: `${sc}18`, borderColor: `${sc}30` }]}>
                  <Ionicons name="bag-outline" size={18} color={sc} />
                </View>
                <View style={styles.orderMid}>
                  <Text style={styles.orderNum}>Pedido #{pedido.id}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(pedido.date || pedido.fecha_pedido).toLocaleDateString('es-BO')}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <View style={[styles.statusBadge, { backgroundColor: `${sc}18`, borderColor: `${sc}35` }]}>
                    <View style={[styles.statusDot, { backgroundColor: sc }]} />
                    <Text style={[styles.statusText, { color: sc }]}>{statusLabel(estado)}</Text>
                  </View>
                  <Text style={styles.orderTotal}>Bs {parseFloat(pedido.total || 0).toFixed(2)}</Text>
                </View>
              </View>

              {puedeTracking(estado) && (
                <TouchableOpacity style={styles.trackBtn}
                  onPress={() => navigation.navigate('TrackingPedido', { pedidoId: pedido.id })}>
                  <Ionicons name="navigate" size={13} color={C.primary} />
                  <Text style={styles.trackBtnText}>
                    {estado === 'en_camino' ? 'Ver en tiempo real' : 'Seguir pedido'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }) : (
          <View style={styles.emptyOrder}>
            <Ionicons name="receipt-outline" size={36} color={C.hint} />
            <Text style={styles.emptyText}>No hay pedidos recientes</Text>
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const makeStyles = (C, isDarkMode) => StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  // Hero
  hero: {
    margin: 14, borderRadius: 24, padding: 20, paddingBottom: 24,
    overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: 'rgba(56,189,248,0.22)',
    shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14, shadowRadius: 18, elevation: 10,
  },
  heroLine:    { height: 1, position: 'absolute', top: 0, left: 0, right: 0 },
  orb1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(56,189,248,0.09)', top: -80, right: -60 },
  orb2: { position: 'absolute', width: 150, height: 150, borderRadius: 75,  backgroundColor: 'rgba(20,184,166,0.07)', bottom: -50, left: -40 },
  orb3: { position: 'absolute', width: 100, height: 100, borderRadius: 50,  backgroundColor: 'rgba(192,132,252,0.06)', top: '25%', left: '45%' },
  wave: { position: 'absolute', left: -20, right: -20, height: 70, borderRadius: 35 },
  waveA: { backgroundColor: 'rgba(56,189,248,0.11)',  bottom: -20 },
  waveB: { backgroundColor: 'rgba(20,184,166,0.08)',  bottom: -10 },
  waveC: { backgroundColor: 'rgba(139,92,246,0.05)', bottom: -4 },
  heroRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroSub:       { fontSize: 12, color: C.hint, marginBottom: 2 },
  heroName:      { fontSize: 26, fontWeight: 'bold', color: C.text, marginBottom: 6 },
  heroBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(20,184,166,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(20,184,166,0.25)' },
  heroBadgeText: { fontSize: 11, color: C.teal, fontWeight: '500' },
  heroActions:   { flexDirection: 'row', gap: 8 },
  heroIconBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(56,189,248,0.1)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.22)', justifyContent: 'center', alignItems: 'center' },
  heroCta:       { borderRadius: 14, overflow: 'hidden' },
  heroCtaGrad:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, gap: 8 },
  heroCtaText:   { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },

  // Active banner
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 14, marginBottom: 12, borderRadius: 16, padding: 14,
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#06b6d4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  activePulse:      { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(6,182,212,0.12)' },
  activeBannerTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
  activeBannerSub:   { color: C.hint, fontSize: 12, marginTop: 1 },

  // Feature chips
  featureChip: {
    width: 90, backgroundColor: C.surface, borderRadius: 16, padding: 12, marginRight: 10,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
    shadowColor: isDarkMode ? '#38bdf8' : '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.1 : 0.06, shadowRadius: 6, elevation: 3,
  },
  featureIcon:  { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  featureLabel: { fontSize: 12, fontWeight: '600', color: C.text, textAlign: 'center' },
  featureSub:   { fontSize: 10, color: C.hint, textAlign: 'center', marginTop: 1 },

  // Frescura card
  frescuraCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 14, marginTop: 14, padding: 16, borderRadius: 16, borderWidth: 1.5,
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  frescuraIconWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  frescuraTitulo:   { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  frescuraSub:      { fontSize: 12 },

  // Section
  section:       { paddingHorizontal: 14, marginTop: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: C.text },
  seeAll:        { fontSize: 13, color: C.primary, fontWeight: '500' },

  // Product card
  productCard: {
    width: 158, borderRadius: 18, marginRight: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: isDarkMode ? 'rgba(56,189,248,0.18)' : C.border, backgroundColor: C.card,
    shadowColor: isDarkMode ? '#38bdf8' : '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.18 : 0.12, shadowRadius: isDarkMode ? 14 : 8, elevation: 8,
  },
  productImgWrap:    { height: 120, position: 'relative' },
  productImg:        { width: '100%', height: '100%', resizeMode: 'cover' },
  productImgFallback:{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: C.card },
  productImgOverlay: { ...StyleSheet.absoluteFillObject },
  favBtn:            { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: isDarkMode ? 'rgba(9,15,30,0.75)' : 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  productInfo:       { padding: 12 },
  productName:       { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 3 },
  productCat:        { fontSize: 11, color: C.hint, marginBottom: 8 },
  productFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice:      { fontSize: 15, fontWeight: 'bold', color: C.primary },
  addBtn:            { width: 28, height: 28, borderRadius: 8, overflow: 'hidden' },
  addBtnGrad:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState:        { width: width - 80, padding: 32, borderRadius: 16, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  emptyText:         { marginTop: 8, fontSize: 13, color: C.hint },

  // Order card
  orderCard: {
    borderRadius: 18, marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  orderShimmer: { height: 1, marginHorizontal: 20 },
  orderTop:     { flexDirection: 'row', alignItems: 'center', padding: 14 },
  orderIcon:    { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  orderMid:     { flex: 1 },
  orderNum:     { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  orderDate:    { fontSize: 12, color: C.hint },
  orderRight:   { alignItems: 'flex-end', gap: 4 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusDot:    { width: 5, height: 5, borderRadius: 2.5 },
  statusText:   { fontSize: 11, fontWeight: '600' },
  orderTotal:   { fontSize: 13, fontWeight: '700', color: C.text },
  trackBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  trackBtnText: { color: C.primary, fontSize: 13, fontWeight: '600' },
  emptyOrder:   { padding: 32, borderRadius: 16, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
});

export default HomeScreenConsumer;
