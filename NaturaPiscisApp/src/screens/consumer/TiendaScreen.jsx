// src/screens/consumer/TiendaScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Image, RefreshControl, Dimensions, ActivityIndicator,
  Modal, ScrollView, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import api from '../../api/axios.config';

const BLURHASH = { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' };
import { FishIndicator } from '../../components/ui/FishRefreshControl';
import { SkeletonProductorCard, SkeletonProductCard } from '../../components/ui/Skeleton';
import { useTheme } from '../../contexts/ThemeContext';
import { useFavoritos } from '../../contexts/FavoritosContext';

const { width } = Dimensions.get('window');
const cardW = (width - 48) / 2;
const PAGE = 10;

const SORT_PROD = [
  { value: 'fecha_desc', label: 'Más recientes' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
  { value: 'nombre_asc', label: 'Nombre A–Z' },
];

const TiendaScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { isFavorito, toggle } = useFavoritos();
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
  };
  const styles = makeStyles(C);

  const [tab, setTab]               = useState('productores');
  const [search, setSearch]         = useState('');
  const [debSearch, setDebSearch]   = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  // Filters for productores
  const [pFilters, setPFilters] = useState({ verificado: false });
  // Filters for productos
  const [qFilters, setQFilters] = useState({ precio_min: '', precio_max: '', order: 'fecha_desc' });
  // Draft state inside modal (before applying)
  const [draft, setDraft] = useState({});

  // Productores pagination
  const [productores, setProductores] = useState([]);
  const [pPage, setPPage]             = useState(1);
  const [pHasMore, setPHasMore]       = useState(true);
  const [pLoading, setPLoading]       = useState(true);
  const [pLoadMore, setPLoadMore]     = useState(false);

  // Productos pagination
  const [productos, setProductos]   = useState([]);
  const [qPage, setQPage]           = useState(1);
  const [qHasMore, setQHasMore]     = useState(true);
  const [qLoading, setQLoading]     = useState(true);
  const [qLoadMore, setQLoadMore]   = useState(false);

  const debRef = useRef(null);

  useEffect(() => {
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setDebSearch(search), 350);
  }, [search]);

  const fetchProductores = useCallback(async (pg, q, filters) => {
    if (pg === 1) setPLoading(true); else setPLoadMore(true);
    try {
      const params = { page: pg, limit: PAGE, q: q || undefined };
      if (filters?.verificado) params.verificado = 'true';
      const r = await api.get('/productores', { params });
      const raw = r.data;
      const arr = raw?.data?.productores ?? raw?.data ?? raw?.productores ?? raw ?? [];
      const data = Array.isArray(arr) ? arr : [];
      setProductores(prev => pg === 1 ? data : [...prev, ...data]);
      setPHasMore(data.length === PAGE);
    } catch { /* ignore */ }
    finally { setPLoading(false); setPLoadMore(false); }
  }, []);

  const fetchProductos = useCallback(async (pg, q, filters) => {
    if (pg === 1) setQLoading(true); else setQLoadMore(true);
    try {
      const params = { page: pg, limit: PAGE, q: q || undefined };
      if (filters?.precio_min) params.precio_min = filters.precio_min;
      if (filters?.precio_max) params.precio_max = filters.precio_max;
      if (filters?.order)      params.order      = filters.order;
      const r = await api.get('/productos', { params });
      const raw = r.data;
      const arr = raw?.data?.productos ?? raw?.data ?? raw?.productos ?? raw ?? [];
      const data = Array.isArray(arr) ? arr : [];
      setProductos(prev => pg === 1 ? data : [...prev, ...data]);
      setQHasMore(data.length === PAGE);
    } catch { /* ignore */ }
    finally { setQLoading(false); setQLoadMore(false); }
  }, []);

  // Reset + fetch when search or filters change
  useEffect(() => {
    setPPage(1); setProductores([]); setPHasMore(true);
    fetchProductores(1, debSearch, pFilters);
  }, [debSearch, pFilters]);

  useEffect(() => {
    setQPage(1); setProductos([]); setQHasMore(true);
    fetchProductos(1, debSearch, qFilters);
  }, [debSearch, qFilters]);

  useEffect(() => { if (pPage > 1) fetchProductores(pPage, debSearch, pFilters); }, [pPage]);
  useEffect(() => { if (qPage > 1) fetchProductos(qPage, debSearch, qFilters); }, [qPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProductores(1, debSearch, pFilters),
      fetchProductos(1, debSearch, qFilters),
    ]);
    setPPage(1); setQPage(1);
    setRefreshing(false);
  }, [debSearch, pFilters, qFilters]);

  const openFilter = () => {
    setDraft(tab === 'productores' ? { ...pFilters } : { ...qFilters });
    setFilterVisible(true);
  };

  const applyFilter = () => {
    if (tab === 'productores') setPFilters({ ...draft });
    else setQFilters({ ...draft });
    setFilterVisible(false);
  };

  const resetFilter = () => {
    const empty = tab === 'productores'
      ? { verificado: false }
      : { precio_min: '', precio_max: '', order: 'fecha_desc' };
    setDraft(empty);
  };

  const isProductores = tab === 'productores';
  const hasActiveFilters = isProductores
    ? pFilters.verificado
    : (qFilters.precio_min || qFilters.precio_max || qFilters.order !== 'fecha_desc');

  const gradients = [['#16a34a','#22C55E'],['#0d9488','#4ade80'],['#c084fc','#8b5cf6'],['#fb923c','#f59e0b']];

  const goProductor = (id) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); navigation.navigate('DetalleProductor', { id }); };
  const goProducto  = (id) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); navigation.navigate('DetalleProducto', { id }); };

  const renderProductor = ({ item, index }) => {
    const grad = gradients[index % gradients.length];
    return (
      <TouchableOpacity style={styles.card} onPress={() => goProductor(item.id)} activeOpacity={0.9}>
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardTop}>
          {/* decorative blobs */}
          <View style={styles.cardBlobA} />
          <View style={styles.cardBlobB} />
          {item.verificado && (
            <View style={styles.veriBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#fff" />
              <Text style={styles.veriText}>Verificado</Text>
            </View>
          )}
          {/* Avatar con anillo */}
          <View style={styles.avatarRing}>
            {item.foto_perfil
              ? <ExpoImage source={{ uri: item.foto_perfil }} style={styles.cardAvatar} contentFit="cover" transition={250} placeholder={BLURHASH} />
              : <View style={styles.cardAvatarFallback}>
                  <Text style={styles.cardAvatarText}>{item.nombre?.slice(0,2).toUpperCase() || 'P'}</Text>
                </View>}
          </View>
        </LinearGradient>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.nombre}</Text>
          <View style={styles.cardLocRow}>
            <Ionicons name="location" size={11} color={C.primary} />
            <Text style={styles.cardLoc} numberOfLines={1}>{item.ubicacion || 'Bolivia'}</Text>
          </View>
          <View style={styles.cardStatsRow}>
            <View style={styles.statPill}>
              <Ionicons name="star" size={11} color="#fbbf24" />
              <Text style={styles.statPillText}>{item.calificacion_promedio ? Number(item.calificacion_promedio).toFixed(1) : '—'}</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="cube" size={11} color={C.green} />
              <Text style={styles.statPillText}>{item.total_productos || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderProducto = ({ item }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => goProducto(item.id)} activeOpacity={0.9}>
      <View style={styles.productImg}>
        {item.imagen_url
          ? <ExpoImage source={{ uri: item.imagen_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={250} placeholder={BLURHASH} />
          : <Ionicons name="fish-outline" size={34} color={C.hint} />}
        <LinearGradient colors={['transparent', 'rgba(6,13,31,0.55)']} style={StyleSheet.absoluteFill} />
        {/* Category chip */}
        <View style={styles.prodCatChip}>
          <Ionicons name="pricetag" size={9} color={C.green} />
          <Text style={styles.prodCatChipText} numberOfLines={1}>{item.categoria || item.categoria_nombre || 'Fresco'}</Text>
        </View>
        {/* Fav */}
        <TouchableOpacity style={styles.prodFav} hitSlop={8} onPress={() => toggle(item.id)}>
          <Ionicons name={isFavorito(item.id) ? 'heart' : 'heart-outline'} size={14} color={isFavorito(item.id) ? '#ef4444' : '#fff'} />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.nombre}</Text>
        <View style={styles.prodRatingRow}>
          {Number(item.total_valoraciones) > 0 ? (
            <>
              <Ionicons name="star" size={11} color="#fbbf24" />
              <Text style={styles.prodRatingText}>{Number(item.promedio_valoracion).toFixed(1)}</Text>
              <Text style={styles.prodRatingCount}>({item.total_valoraciones})</Text>
            </>
          ) : (
            <Text style={styles.prodNuevo}>Nuevo</Text>
          )}
        </View>
        <View style={styles.productFooter}>
          <View>
            <Text style={styles.prodPriceLabel}>Precio</Text>
            <Text style={styles.productPrice}>Bs {parseFloat(item.precio || 0).toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.prodAddBtn} onPress={() => goProducto(item.id)} hitSlop={6}>
            <LinearGradient colors={['#16a34a', '#22C55E']} style={styles.prodAddGrad}>
              <Ionicons name="add" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const data          = isProductores ? productores : productos;
  const isLoading     = isProductores ? pLoading    : qLoading;
  const isLoadMore    = isProductores ? pLoadMore   : qLoadMore;
  const hasMore       = isProductores ? pHasMore    : qHasMore;
  const loadNextPage  = () => {
    if (!isLoadMore && !isLoading && hasMore) {
      if (isProductores) setPPage(p => p + 1);
      else setQPage(p => p + 1);
    }
  };

  const renderFooter = () => {
    if (isLoadMore) return (
      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <ActivityIndicator size="small" color={C.primary} />
      </View>
    );
    if (!hasMore && data.length > 0) return (
      <Text style={{ textAlign: 'center', color: C.hint, fontSize: 12, paddingVertical: 16 }}>— Todos cargados —</Text>
    );
    return null;
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={[C.surface, C.bg]} style={styles.header}>
        <LinearGradient colors={['transparent', C.primary, C.teal, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerLine} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={styles.title}>Tienda</Text>
          <TouchableOpacity onPress={openFilter} style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}>
            <Ionicons name="options-outline" size={18} color={hasActiveFilters ? C.primary : C.hint} />
            {hasActiveFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={17} color={C.primary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput} placeholder="Buscar..." placeholderTextColor={C.hint}
            value={search} onChangeText={setSearch} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={C.hint} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['productores', 'productos'].map(t => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
              <Ionicons name={t === 'productores' ? 'people-outline' : 'fish-outline'} size={15}
                color={tab === t ? C.primary : C.hint} />
              <Text style={[styles.tabText, { color: tab === t ? C.primary : C.hint }]}>
                {t === 'productores' ? 'Productores' : 'Productos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <FishIndicator visible={refreshing} />

      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            isProductores ? <SkeletonProductorCard key={i} /> : <SkeletonProductCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={styles.list}
          renderItem={isProductores ? renderProductor : renderProducto}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor="transparent" colors={['transparent']} progressBackgroundColor="transparent" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="fish-outline" size={48} color={C.hint} />
              <Text style={{ color: C.hint, marginTop: 12, fontSize: 14 }}>Sin resultados</Text>
            </View>
          }
        />
      )}

      {/* ── Filter Modal ── */}
      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setFilterVisible(false)} />
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Title row */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={22} color={C.sub} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
              {isProductores ? (
                /* Productores filters */
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>ESTADO</Text>
                  <View style={styles.filterRow}>
                    <Text style={styles.filterRowText}>Solo verificados</Text>
                    <Switch
                      value={draft.verificado || false}
                      onValueChange={v => setDraft(d => ({ ...d, verificado: v }))}
                      trackColor={{ false: C.surface, true: 'rgba(34,197,94,0.4)' }}
                      thumbColor={draft.verificado ? C.primary : C.hint}
                    />
                  </View>
                </View>
              ) : (
                /* Productos filters */
                <>
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>RANGO DE PRECIO (Bs)</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={styles.priceInput}>
                        <Text style={styles.priceLabel}>Mínimo</Text>
                        <TextInput
                          style={styles.priceField}
                          placeholder="0"
                          placeholderTextColor={C.hint}
                          keyboardType="numeric"
                          value={draft.precio_min || ''}
                          onChangeText={v => setDraft(d => ({ ...d, precio_min: v }))}
                        />
                      </View>
                      <View style={styles.priceInput}>
                        <Text style={styles.priceLabel}>Máximo</Text>
                        <TextInput
                          style={styles.priceField}
                          placeholder="∞"
                          placeholderTextColor={C.hint}
                          keyboardType="numeric"
                          value={draft.precio_max || ''}
                          onChangeText={v => setDraft(d => ({ ...d, precio_max: v }))}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>ORDENAR POR</Text>
                    {SORT_PROD.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={styles.filterRow}
                        onPress={() => setDraft(d => ({ ...d, order: opt.value }))}>
                        <Text style={[styles.filterRowText, draft.order === opt.value && { color: C.primary }]}>
                          {opt.label}
                        </Text>
                        {draft.order === opt.value && (
                          <Ionicons name="checkmark" size={18} color={C.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilter}>
                <Text style={{ color: C.hint, fontSize: 14 }}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyFilter} style={styles.applyBtn}>
                <LinearGradient colors={['#16a34a', '#22C55E']} style={styles.applyGrad}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Aplicar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const makeStyles = (C) => StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  header:     { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: C.border },
  headerLine: { height: 1, position: 'absolute', top: 0, left: 0, right: 0 },
  title:      { fontSize: 22, fontWeight: 'bold', color: C.text },
  filterBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  filterDot:  { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  searchInput:{ flex: 1, color: C.text, fontSize: 14 },
  tabs:       { flexDirection: 'row', gap: 10 },
  tabBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  tabBtnActive:{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  tabText:    { fontSize: 13, fontWeight: '600' },
  list:       { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 100 },
  skeletonGrid:{ padding: 14 },
  empty:      { alignItems: 'center', paddingVertical: 60 },
  // Productor card
  card:       { flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
  cardTop:    { height: 96, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  cardBlobA:  { position: 'absolute', top: -24, right: -16, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.16)' },
  cardBlobB:  { position: 'absolute', bottom: -28, left: -18, width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.10)' },
  avatarRing: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)' },
  cardAvatar: { width: 52, height: 52, borderRadius: 26 },
  cardAvatarFallback: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  cardAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  veriBadge:  { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(9,15,30,0.55)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3 },
  veriText:   { fontSize: 8.5, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  cardInfo:   { padding: 11 },
  cardName:   { fontSize: 13.5, fontWeight: '700', color: C.text, marginBottom: 5 },
  cardLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardLoc:    { fontSize: 11, color: C.hint, flex: 1 },
  cardStatsRow:{ flexDirection: 'row', gap: 6, marginTop: 9 },
  statPill:   { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  statPillText:{ fontSize: 11, fontWeight: '600', color: C.sub },
  // Producto card
  productCard:{ flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
  productImg: { height: 120, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  prodCatChip:{ position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(9,15,30,0.7)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, maxWidth: '75%' },
  prodCatChipText:{ fontSize: 9.5, fontWeight: '600', color: '#fff' },
  prodFav:    { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(9,15,30,0.5)', justifyContent: 'center', alignItems: 'center' },
  productInfo:{ padding: 11 },
  productName:{ fontSize: 13.5, fontWeight: '600', color: C.text, marginBottom: 4 },
  prodRatingRow:{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8, minHeight: 14 },
  prodRatingText:{ fontSize: 11, fontWeight: '700', color: C.text },
  prodRatingCount:{ fontSize: 10, color: C.hint },
  prodNuevo:{ fontSize: 10, fontWeight: '600', color: C.green },
  productFooter:{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  prodPriceLabel:{ fontSize: 9, color: C.hint, marginBottom: 1, textTransform: 'uppercase', letterSpacing: 0.4 },
  productPrice:{ fontSize: 16, fontWeight: 'bold', color: C.primary },
  prodAddBtn: { borderRadius: 12, overflow: 'hidden' },
  prodAddGrad:{ width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet:   { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0, maxHeight: '85%', borderWidth: 1, borderColor: C.border },
  modalHandle:  { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: C.text },
  filterSection:{ marginBottom: 24 },
  filterLabel:  { fontSize: 11, fontWeight: '700', color: C.hint, letterSpacing: 1, marginBottom: 12 },
  filterRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  filterRowText:{ fontSize: 14, color: C.sub },
  priceInput:   { flex: 1, backgroundColor: C.background, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border },
  priceLabel:   { fontSize: 11, color: C.hint, marginBottom: 4 },
  priceField:   { fontSize: 16, color: C.text, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, paddingVertical: 16, borderTopWidth: 1, borderTopColor: C.border },
  resetBtn:     { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 14 },
  applyBtn:     { flex: 2, borderRadius: 14, overflow: 'hidden' },
  applyGrad:    { paddingVertical: 14, alignItems: 'center' },
});

export default TiendaScreen;
