// src/screens/consumer/HomeScreenConsumer.jsx
// Rediseño futurista con estética neón, glassmorphism y tipografía SpaceGrotesk
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
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';

const BLURHASH = { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' };
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFavoritos } from '../../contexts/FavoritosContext';
import api from '../../api/axios.config';
import { SkeletonProductCard, SkeletonOrderCard, SkeletonStatCard } from '../../components/ui/Skeleton';
import { FishIndicator } from '../../components/ui/FishRefreshControl';

const { width } = Dimensions.get('window');

const HomeScreenConsumer = ({ navigation }) => {
  const { user }        = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { isFavorito, toggle } = useFavoritos();

  // Colores neón con fallback para compatibilidad
  const neonCyan  = colors.neonCyan  || '#00F5FF';
  const neonGreen = colors.neonGreen || '#00FF88';

  const C = {
    bg:      colors.background,
    surface: colors.surface,
    card:    colors.card,
    border:  colors.border,
    text:    colors.text,
    sub:     colors.textSecondary,
    hint:    colors.textMuted,
    primary: colors.primary,
    teal:    '#10b981',
    green:   '#4ade80',
    orange:  '#fb923c',
    purple:  '#c084fc',
    neonCyan,
    neonGreen,
  };
  const styles = makeStyles(C, isDarkMode);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [productos, setProductos]   = useState([]);
  const [pedidos, setPedidos]       = useState([]);

  // Animaciones de olas neón
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  // Parallax scroll
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animaciones de entrada escalonada para secciones
  const heroFade     = useRef(new Animated.Value(0)).current;
  const chipsFade    = useRef(new Animated.Value(0)).current;
  const frescuraFade = useRef(new Animated.Value(0)).current;
  const productsFade = useRef(new Animated.Value(0)).current;
  const ordersFade   = useRef(new Animated.Value(0)).current;
  const heroSlide    = useRef(new Animated.Value(30)).current;
  const chipsSlide   = useRef(new Animated.Value(30)).current;
  const frescuraSlide = useRef(new Animated.Value(30)).current;
  const productsSlide = useRef(new Animated.Value(30)).current;
  const ordersSlide   = useRef(new Animated.Value(30)).current;

  // Animación de pulso para el icono de frescura
  const frescuraPulse = useRef(new Animated.Value(1)).current;
  // Animación de rotación para el borde del card de frescura
  const frescuraRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Olas animadas con colores neón
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

    // Pulso del icono de frescura
    Animated.loop(
      Animated.sequence([
        Animated.timing(frescuraPulse, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
        Animated.timing(frescuraPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Rotación continua del borde de frescura
    Animated.loop(
      Animated.timing(frescuraRotation, { toValue: 1, duration: 4000, useNativeDriver: true })
    ).start();

    fetchData();
  }, []);

  // Ejecutar animaciones de entrada cuando termine la carga
  const runEntryAnimations = () => {
    const stagger = (fade, slide, delay) =>
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
      ]);

    Animated.stagger(100, [
      stagger(heroFade, heroSlide, 0),
      stagger(chipsFade, chipsSlide, 0),
      stagger(frescuraFade, frescuraSlide, 0),
      stagger(productsFade, productsSlide, 0),
      stagger(ordersFade, ordersSlide, 0),
    ]).start();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, pedRes] = await Promise.all([
        api.get('/productos?limit=6').catch(() => ({ data: { data: [] } })),
        api.get('/pedidos/recientes').catch(() => ({ data: [] })),
      ]);
      setProductos(prodRes.data.data || prodRes.data || []);
      setPedidos(pedRes.data.data || pedRes.data || []);
    } catch { /* ignorar */ } finally {
      setLoading(false);
      runEntryAnimations();
    }
  };

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
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

  // Interpolación de rotación para el borde de frescura
  const frescuraRotate = frescuraRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ── Estado de carga: esqueleto ──
  if (loading) return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Esqueleto del hero */}
      <View style={[styles.hero, { paddingBottom: 20 }]}>
        <View style={{ marginBottom: 16 }}>
          <SkeletonStatCard />
        </View>
      </View>
      {/* Esqueleto de chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={{ width: 90, height: 80, borderRadius: 16, marginRight: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border }} />
        ))}
      </ScrollView>
      {/* Esqueleto de productos */}
      <View style={styles.section}>
        <View style={{ height: 14, width: 160, borderRadius: 7, backgroundColor: C.card, marginBottom: 12 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonProductCard key={i} />)}
        </ScrollView>
      </View>
      {/* Esqueleto de pedidos */}
      <View style={styles.section}>
        <View style={{ height: 14, width: 140, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />
        {Array.from({ length: 3 }).map((_, i) => <SkeletonOrderCard key={i} />)}
      </View>
    </ScrollView>
  );

  return (
    <Animated.ScrollView style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="transparent" colors={['transparent']} progressBackgroundColor="transparent" />}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      scrollEventThrottle={16}>
      <FishIndicator visible={refreshing} />

      {/* ── Hero con parallax y estética neón ── */}
      <Animated.View style={[
        { transform: [{ translateY: Animated.multiply(scrollY, 0.4) }] },
        { opacity: heroFade, transform: [{ translateY: Animated.multiply(scrollY, 0.4) }, { translateY: heroSlide }] },
      ]}>
      <LinearGradient
        colors={isDarkMode
          ? ['#030810', '#06101f', '#071228', '#040d1a']
          : ['#e0f2fe', '#f0f9ff', '#f9fafb', '#e0fdfa']
        }
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        {/* Línea shimmer neón en la parte superior */}
        <LinearGradient colors={['transparent', neonCyan, neonGreen, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroLine} />

        {/* Orbes de brillo flotantes con colores neón */}
        <View style={[styles.orb1, { backgroundColor: `${neonCyan}14` }]} />
        <View style={[styles.orb2, { backgroundColor: `${neonGreen}10` }]} />
        <View style={[styles.orb3, { backgroundColor: `${C.purple}0C` }]} />

        {/* Olas animadas con brillo neón */}
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

        {/* Contenido del hero */}
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroSub}>Bienvenido de vuelta</Text>
            <Text style={styles.heroName}>{firstName}</Text>
            <View style={styles.heroBadge}>
              <Ionicons name="fish" size={12} color={neonCyan} />
              <Text style={styles.heroBadgeText}>Acuicultura sostenible</Text>
            </View>
          </View>
          {/* Botones de acción con glassmorphism */}
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Busqueda')}>
              <Ionicons name="search-outline" size={20} color={neonCyan} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Conversaciones')}>
              <Ionicons name="chatbubbles-outline" size={20} color={neonCyan} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Carrito')}>
              <Ionicons name="cart-outline" size={20} color={neonCyan} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón CTA con gradiente neón verde */}
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); navigation.navigate('Tienda'); }} style={styles.heroCta} activeOpacity={0.85}>
          <LinearGradient colors={[neonGreen, '#22C55E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.heroCtaGrad}>
            <Ionicons name="storefront-outline" size={16} color="#030810" />
            <Text style={styles.heroCtaText}>Explorar productores</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(3,8,16,0.6)" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
      </Animated.View>

      {/* ── Banner pedido en camino ── */}
      {pedidoEnCamino && (
        <TouchableOpacity style={[styles.activeBanner, { borderColor: `${neonCyan}60` }]}
          onPress={() => navigation.navigate('TrackingPedido', { pedidoId: pedidoEnCamino.rawId || pedidoEnCamino.id })}
          activeOpacity={0.88}>
          <LinearGradient colors={[`${neonCyan}20`, `${neonCyan}0A`]}
            style={StyleSheet.absoluteFill} />
          <View style={styles.activeBannerLeft}>
            <View style={[styles.activePulse, { borderColor: neonCyan }]}>
              <Ionicons name="bicycle" size={20} color={neonCyan} />
            </View>
            <View>
              <Text style={styles.activeBannerTitle}>Pedido en camino</Text>
              <Text style={styles.activeBannerSub}>Toca para ver en el mapa</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.hint} />
        </TouchableOpacity>
      )}

      {/* ── Chips de características con glassmorphism ── */}
      <Animated.View style={{ opacity: chipsFade, transform: [{ translateY: chipsSlide }] }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          {[
            { icon: 'fish-outline',  color: neonCyan,  label: 'Frescos',     sub: 'Del criadero' },
            { icon: 'leaf-outline',  color: neonGreen,  label: 'Sostenible',  sub: 'Eco-certif.' },
            { icon: 'time-outline',  color: C.orange,  label: 'Entrega',     sub: '24-48h' },
            { icon: 'shield-outline', color: C.purple,  label: 'Garantizado', sub: '100% seguro' },
          ].map((f, i) => (
            <View key={i} style={[styles.featureChip, { borderColor: `${f.color}30` }]}>
              <View style={[styles.featureIcon, { borderColor: `${f.color}40`, backgroundColor: `${f.color}15` }]}>
                <Ionicons name={f.icon} size={20} color={f.color} style={{
                  // Brillo sutil del icono
                  textShadowColor: f.color,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 8,
                }} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureSub}>{f.sub}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── Card de análisis de frescura con borde gradiente rotativo ── */}
      <Animated.View style={{ opacity: frescuraFade, transform: [{ translateY: frescuraSlide }] }}>
        <TouchableOpacity
          style={styles.frescuraOuter}
          onPress={() => navigation.navigate('AnalizarFrescura')}
          activeOpacity={0.85}
        >
          {/* Borde con gradiente rotativo animado */}
          <Animated.View style={[styles.frescuraRotatingBorder, { transform: [{ rotate: frescuraRotate }] }]}>
            <LinearGradient
              colors={[neonGreen, neonCyan, `${C.purple}`, neonGreen]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          {/* Contenido interior del card */}
          <View style={styles.frescuraCard}>
            <Animated.View style={[styles.frescuraIconWrap, { transform: [{ scale: frescuraPulse }] }]}>
              <Text style={{ fontSize: 28 }}>🔬</Text>
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.frescuraTitulo, { color: C.text }]}>¿Es fresco tu pescado?</Text>
              <Text style={[styles.frescuraSub, { color: C.sub }]}>Toma una foto y la IA lo analiza en segundos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={neonGreen} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Productos destacados con diseño neón ── */}
      <Animated.View style={[styles.section, { opacity: productsFade, transform: [{ translateY: productsSlide }] }]}>
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
              {/* Gradiente interior glassmorphism */}
              <LinearGradient
                colors={isDarkMode ? ['rgba(0,245,255,0.05)', 'rgba(10,15,30,0.85)'] : ['transparent', 'transparent']}
                style={StyleSheet.absoluteFill} />

              {/* Imagen del producto */}
              <View style={styles.productImgWrap}>
                {p.imagen_url ? (
                  <ExpoImage source={{ uri: p.imagen_url }} style={styles.productImg} contentFit="cover" transition={250} placeholder={BLURHASH} />
                ) : (
                  <View style={styles.productImgFallback}>
                    <Ionicons name="fish-outline" size={32} color={C.hint} />
                  </View>
                )}
                {/* Overlay de gradiente dramático */}
                <LinearGradient
                  colors={isDarkMode ? ['transparent', 'rgba(3,8,16,0.85)'] : ['transparent', 'rgba(0,0,0,0.18)']}
                  style={styles.productImgOverlay} />
                {/* Botón de favorito */}
                <TouchableOpacity style={styles.favBtn} onPress={() => toggle(p.id)} hitSlop={8}>
                  <Ionicons name={isFavorito(p.id) ? 'heart' : 'heart-outline'} size={15} color={isFavorito(p.id) ? '#ef4444' : C.sub} />
                </TouchableOpacity>
              </View>

              {/* Información del producto */}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{p.nombre}</Text>
                <View style={styles.prodRatingRow}>
                  {Number(p.total_valoraciones) > 0 ? (
                    <>
                      <Ionicons name="star" size={11} color="#fbbf24" />
                      <Text style={styles.prodRatingText}>{Number(p.promedio_valoracion).toFixed(1)}</Text>
                      <Text style={styles.prodRatingCount}>({p.total_valoraciones})</Text>
                    </>
                  ) : (
                    <Text style={styles.prodCat}>{p.categoria || 'Pescado Fresco'}</Text>
                  )}
                </View>
                <View style={styles.productFooter}>
                  <Text style={styles.productPrice}>Bs {parseFloat(p.precio || 0).toFixed(2)}</Text>
                  {/* Botón + con gradiente neón cyan a verde */}
                  <TouchableOpacity style={styles.addBtn}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); navigation.navigate('DetalleProducto', { id: p.id }); }}>
                    <LinearGradient colors={[neonCyan, neonGreen]} style={styles.addBtnGrad}>
                      <Ionicons name="add" size={16} color="#030810" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyState}>
              <Ionicons name="fish-outline" size={36} color={neonCyan} style={{
                textShadowColor: neonCyan,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 12,
              }} />
              <Text style={styles.emptyText}>No hay productos</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* ── Pedidos recientes con glassmorphism ── */}
      <Animated.View style={[styles.section, { opacity: ordersFade, transform: [{ translateY: ordersSlide }] }]}>
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
            <View key={pedido.id} style={[styles.orderCard, { borderLeftColor: sc, borderLeftWidth: 3 }]}>
              <LinearGradient
                colors={isDarkMode ? ['rgba(10,15,30,0.92)', 'rgba(6,10,20,0.98)'] : [C.surface, C.surface]}
                style={StyleSheet.absoluteFill} />
              {/* Línea shimmer superior con color del estado */}
              <LinearGradient
                colors={['transparent', `${sc}80`, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.orderShimmer} />
              <View style={styles.orderTop}>
                <View style={[styles.orderIcon, { backgroundColor: `${sc}18`, borderColor: `${sc}40` }]}>
                  <Ionicons name="bag-outline" size={18} color={sc} />
                </View>
                <View style={styles.orderMid}>
                  <Text style={styles.orderNum}>Pedido #{pedido.id}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(pedido.date || pedido.fecha_pedido).toLocaleDateString('es-BO')}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  {/* Badge de estado con brillo neón */}
                  <View style={[styles.statusBadge, {
                    backgroundColor: `${sc}18`,
                    borderColor: `${sc}45`,
                    shadowColor: sc,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 4,
                  }]}>
                    <View style={[styles.statusDot, { backgroundColor: sc }]} />
                    <Text style={[styles.statusText, { color: sc }]}>{statusLabel(estado)}</Text>
                  </View>
                  <Text style={styles.orderTotal}>Bs {parseFloat(pedido.total || 0).toFixed(2)}</Text>
                </View>
              </View>

              {/* Botón de seguimiento con estilo neón */}
              {puedeTracking(estado) && (
                <TouchableOpacity style={styles.trackBtn}
                  onPress={() => navigation.navigate('TrackingPedido', { pedidoId: pedido.id })}>
                  <Ionicons name="navigate" size={13} color={neonCyan} />
                  <Text style={styles.trackBtnText}>
                    {estado === 'en_camino' ? 'Ver en tiempo real' : 'Seguir pedido'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }) : (
          <View style={styles.emptyOrder}>
            <Ionicons name="receipt-outline" size={36} color={neonCyan} style={{
              textShadowColor: neonCyan,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 12,
            }} />
            <Text style={styles.emptyText}>No hay pedidos recientes</Text>
          </View>
        )}
      </Animated.View>

      <View style={{ height: 32 }} />
    </Animated.ScrollView>
  );
};

// ── Estilos futuristas con glassmorphism y neón ──
const makeStyles = (C, isDarkMode) => StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  // ── Hero: fondo profundo con bordes neón ──
  hero: {
    margin: 14, borderRadius: 24, padding: 20, paddingBottom: 24,
    overflow: 'hidden', position: 'relative',
    borderWidth: 1,
    borderColor: isDarkMode ? `${C.neonCyan}30` : 'rgba(56,189,248,0.22)',
    shadowColor: C.neonCyan,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDarkMode ? 0.25 : 0.14,
    shadowRadius: 22,
    elevation: 12,
  },
  heroLine: { height: 2, position: 'absolute', top: 0, left: 0, right: 0 },

  // Orbes de brillo más grandes y difusos
  orb1: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -100, right: -80 },
  orb2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, bottom: -60, left: -50 },
  orb3: { position: 'absolute', width: 120, height: 120, borderRadius: 60, top: '20%', left: '40%' },

  // Olas con colores neón
  wave: { position: 'absolute', left: -20, right: -20, height: 70, borderRadius: 35 },
  waveA: { backgroundColor: `${C.neonCyan}18`, bottom: -20 },
  waveB: { backgroundColor: `${C.neonGreen}12`, bottom: -10 },
  waveC: { backgroundColor: `${C.purple}0A`, bottom: -4 },

  heroRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  heroSub: {
    fontSize: 12,
    color: C.hint,
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-Regular',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroName: {
    fontSize: 30,
    fontFamily: 'SpaceGrotesk-Bold',
    color: C.text,
    marginBottom: 8,
    // Brillo neón en el nombre
    textShadowColor: isDarkMode ? `${C.neonCyan}40` : 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: isDarkMode ? 12 : 0,
  },
  // Badge con brillo neón cyan
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: `${C.neonCyan}15`,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: `${C.neonCyan}35`,
    shadowColor: C.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isDarkMode ? 0.3 : 0,
    shadowRadius: 8,
    elevation: isDarkMode ? 3 : 0,
  },
  heroBadgeText: {
    fontSize: 11,
    color: C.neonCyan,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  heroActions: { flexDirection: 'row', gap: 8 },
  // Botones de acción con glassmorphism
  heroIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: isDarkMode ? 'rgba(0,245,255,0.08)' : 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: isDarkMode ? `${C.neonCyan}25` : 'rgba(34,197,94,0.22)',
    justifyContent: 'center', alignItems: 'center',
    // Sombra neón sutil
    shadowColor: C.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isDarkMode ? 0.2 : 0,
    shadowRadius: 6,
    elevation: isDarkMode ? 2 : 0,
  },
  heroCta: { borderRadius: 14, overflow: 'hidden' },
  heroCtaGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  heroCtaText: {
    flex: 1, color: '#030810', fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },

  // ── Banner activo con brillo neón ──
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 14, marginBottom: 12, borderRadius: 16, padding: 14,
    borderWidth: 1, overflow: 'hidden',
    backgroundColor: isDarkMode ? 'rgba(10,15,30,0.85)' : undefined,
    shadowColor: C.neonCyan, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  activePulse: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: `${C.neonCyan}15`,
  },
  activeBannerTitle: {
    color: C.text, fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  activeBannerSub: {
    color: C.hint, fontSize: 12, marginTop: 1,
    fontFamily: 'SpaceGrotesk-Regular',
  },

  // ── Chips de características con glassmorphism ──
  featureChip: {
    width: 92,
    backgroundColor: isDarkMode ? 'rgba(10,15,30,0.75)' : C.surface,
    borderRadius: 16, padding: 12, marginRight: 10,
    borderWidth: 1, alignItems: 'center',
    // Sombra neón sutil
    shadowColor: isDarkMode ? C.neonCyan : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.15 : 0.06,
    shadowRadius: 8, elevation: 3,
  },
  featureIcon: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  featureLabel: {
    fontSize: 12, fontFamily: 'SpaceGrotesk-SemiBold',
    color: C.text, textAlign: 'center',
  },
  featureSub: {
    fontSize: 10, color: C.hint, textAlign: 'center', marginTop: 1,
    fontFamily: 'SpaceGrotesk-Regular',
  },

  // ── Card de frescura con borde gradiente rotativo ──
  frescuraOuter: {
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 18, overflow: 'hidden',
    position: 'relative',
  },
  frescuraRotatingBorder: {
    position: 'absolute',
    top: -50, left: -50, right: -50, bottom: -50,
    borderRadius: 200,
  },
  frescuraCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    margin: 1.5, padding: 16, borderRadius: 16,
    backgroundColor: isDarkMode ? 'rgba(10,15,30,0.92)' : C.card,
    // Brillo neón verde
    shadowColor: C.neonGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.2,
    shadowRadius: 14, elevation: 6,
  },
  frescuraIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: `${C.neonGreen}18`,
    borderWidth: 1, borderColor: `${C.neonGreen}40`,
    // Brillo pulsante
    shadowColor: C.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isDarkMode ? 0.4 : 0.15,
    shadowRadius: 10,
    elevation: isDarkMode ? 4 : 0,
  },
  frescuraTitulo: {
    fontSize: 15, fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 2,
  },
  frescuraSub: {
    fontSize: 12, fontFamily: 'SpaceGrotesk-Regular',
  },

  // ── Secciones ──
  section:       { paddingHorizontal: 14, marginTop: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: {
    fontSize: 17, fontFamily: 'SpaceGrotesk-Bold',
    color: C.text,
    letterSpacing: 0.3,
  },
  seeAll: {
    fontSize: 13, color: C.neonCyan,
    fontFamily: 'SpaceGrotesk-Medium',
  },

  // ── Card de producto con glassmorphism neón ──
  productCard: {
    width: 162, borderRadius: 18, marginRight: 12, overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDarkMode ? `${C.neonCyan}22` : C.border,
    backgroundColor: isDarkMode ? 'rgba(10,15,30,0.85)' : C.card,
    shadowColor: isDarkMode ? C.neonCyan : '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: isDarkMode ? 0.2 : 0.12,
    shadowRadius: isDarkMode ? 16 : 8, elevation: 8,
  },
  productImgWrap:    { height: 120, position: 'relative' },
  productImg:        { width: '100%', height: '100%', resizeMode: 'cover' },
  productImgFallback:{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: C.card },
  productImgOverlay: { ...StyleSheet.absoluteFillObject },
  favBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: isDarkMode ? 'rgba(10,15,30,0.8)' : 'rgba(255,255,255,0.85)',
    borderWidth: 1, borderColor: isDarkMode ? `${C.neonCyan}20` : C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  productInfo: { padding: 12 },
  productName: {
    fontSize: 13, fontFamily: 'SpaceGrotesk-SemiBold',
    color: C.text, marginBottom: 3,
  },
  productCat:    { fontSize: 11, color: C.hint, fontFamily: 'SpaceGrotesk-Regular' },
  prodRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8, minHeight: 14 },
  prodRatingText: {
    fontSize: 11, fontFamily: 'SpaceGrotesk-Bold', color: C.text,
  },
  prodRatingCount: { fontSize: 10, color: C.hint, fontFamily: 'SpaceGrotesk-Regular' },
  productFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // Precio con color neón verde
  productPrice: {
    fontSize: 15, fontFamily: 'SpaceGrotesk-Bold',
    color: C.neonGreen,
    textShadowColor: isDarkMode ? `${C.neonGreen}30` : 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: isDarkMode ? 6 : 0,
  },
  // Botón + con gradiente neón
  addBtn: { width: 30, height: 30, borderRadius: 10, overflow: 'hidden' },
  addBtnGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Estados vacíos con glassmorphism
  emptyState: {
    width: width - 80, padding: 32, borderRadius: 16, alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(10,15,30,0.8)' : C.surface,
    borderWidth: 1,
    borderColor: isDarkMode ? `${C.neonCyan}20` : C.border,
  },
  emptyText: {
    marginTop: 8, fontSize: 13, color: C.hint,
    fontFamily: 'SpaceGrotesk-Regular',
  },

  // ── Card de pedido con glassmorphism y borde neón de estado ──
  orderCard: {
    borderRadius: 18, marginBottom: 10, overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDarkMode ? `${C.neonCyan}18` : C.border,
    backgroundColor: isDarkMode ? 'rgba(10,15,30,0.85)' : undefined,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  orderShimmer: { height: 2, position: 'absolute', top: 0, left: 0, right: 0 },
  orderTop:     { flexDirection: 'row', alignItems: 'center', padding: 14 },
  orderIcon: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  orderMid: { flex: 1 },
  orderNum: {
    fontSize: 14, fontFamily: 'SpaceGrotesk-SemiBold',
    color: C.text, marginBottom: 2,
  },
  orderDate: {
    fontSize: 12, color: C.hint,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: {
    fontSize: 11, fontFamily: 'SpaceGrotesk-SemiBold',
  },
  orderTotal: {
    fontSize: 13, fontFamily: 'SpaceGrotesk-Bold', color: C.text,
  },
  // Botón de tracking con estilo neón
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? `${C.neonCyan}15` : C.border,
  },
  trackBtnText: {
    color: C.neonCyan, fontSize: 13,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  emptyOrder: {
    padding: 32, borderRadius: 16, alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(10,15,30,0.8)' : C.surface,
    borderWidth: 1,
    borderColor: isDarkMode ? `${C.neonCyan}20` : C.border,
  },
});

export default HomeScreenConsumer;
