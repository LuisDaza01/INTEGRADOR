// src/screens/consumer/TiendaScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Image, RefreshControl, Dimensions, ActivityIndicator,
  Modal, ScrollView, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios.config';
import { FishIndicator } from '../../components/ui/FishRefreshControl';
import { SkeletonProductorCard, SkeletonProductCard } from '../../components/ui/Skeleton';
import { useTheme } from '../../contexts/ThemeContext';

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

  const gradients = [['#0ea5e9','#14b8a6'],['#4ade80','#0d9488'],['#c084fc','#8b5cf6'],['#fb923c','#f59e0b']];

  const renderProductor = ({ item, index }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DetalleProductor', { id: item.id })} activeOpacity={0.85}>
      <LinearGradient colors={gradients[index % gradients.length]} style={styles.cardTop}>
        {item.foto_perfil
          ? <Image source={{ uri: item.foto_perfil }} style={styles.cardAvatar} />
          : <View style={styles.cardAvatarFallback}>
              <Text style={styles.cardAvatarText}>{item.nombre?.slice(0,2).toUpperCase() || 'P'}</Text>
            </View>}
        {item.verificado && (
          <View style={styles.veriBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
          </View>
        )}
      </LinearGradient>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.nombre}</Text>
        <Text style={styles.cardLoc} numberOfLines={1}>
          <Ionicons name="location-outline" size={11} color={C.primary} /> {item.ubicacion || 'Bolivia'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
          <Text style={styles.stat}>⭐ {item.calificacion_promedio ? Number(item.calificacion_promedio).toFixed(1) : '—'}</Text>
          <Text style={styles.stat}>📦 {item.total_productos || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProducto = ({ item }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => navigation.navigate('DetalleProducto', { id: item.id })} activeOpacity={0.85}>
      <View style={styles.productImg}>
        {item.imagen_url
          ? <Image source={{ uri: item.imagen_url }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
          : <Ionicons name="fish-outline" size={32} color={C.hint} />}
        <LinearGradient colors={['transparent', 'rgba(6,13,31,0.75)']} style={StyleSheet.absoluteFill} />
      </View>
      <View style={{ padding: 10 }}>
        <Text style={styles.productName} numberOfLines={1}>{item.nombre}</Text>
        <Text style={styles.productCat}>{item.categoria || item.categoria_nombre || 'Pescado Fresco'}</Text>
        <Text style={styles.productPrice}>Bs {parseFloat(item.precio || 0).toFixed(2)}</Text>
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
                      trackColor={{ false: C.surface, true: 'rgba(56,189,248,0.4)' }}
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
                <LinearGradient colors={['#0ea5e9', '#14b8a6']} style={styles.applyGrad}>
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
  filterBtnActive: { backgroundColor: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.3)' },
  filterDot:  { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  searchInput:{ flex: 1, color: C.text, fontSize: 14 },
  tabs:       { flexDirection: 'row', gap: 10 },
  tabBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  tabBtnActive:{ backgroundColor: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.3)' },
  tabText:    { fontSize: 13, fontWeight: '600' },
  list:       { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 100 },
  skeletonGrid:{ padding: 14 },
  empty:      { alignItems: 'center', paddingVertical: 60 },
  // Productor card
  card:       { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  cardTop:    { height: 90, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cardAvatar: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  cardAvatarFallback: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  cardAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  veriBadge:  { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(9,15,30,0.8)', borderRadius: 10, padding: 2 },
  cardInfo:   { padding: 10 },
  cardName:   { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },
  cardLoc:    { fontSize: 11, color: C.hint },
  stat:       { fontSize: 11, color: C.sub },
  // Producto card
  productCard:{ flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  productImg: { height: 110, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  productName:{ fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 3 },
  productCat: { fontSize: 11, color: C.hint, marginBottom: 6 },
  productPrice:{ fontSize: 15, fontWeight: 'bold', color: C.primary },
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
