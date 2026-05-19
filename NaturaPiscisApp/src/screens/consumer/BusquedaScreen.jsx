// src/screens/consumer/BusquedaScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Image, ActivityIndicator, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/axios.config';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const MAX_HISTORIAL = 8;
const DEBOUNCE_MS   = 400;

const BusquedaScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const inputRef = useRef(null);

  const [query, setQuery]           = useState('');
  const [resultados, setResultados] = useState({ productos: [], productores: [] });
  const [loading, setLoading]       = useState(false);
  const [historial, setHistorial]   = useState([]);
  const [activeTab, setActiveTab]   = useState('todos');
  const debounceRef = useRef(null);

  // Cargar historial al montar
  useEffect(() => {
    AsyncStorage.getItem('busqueda_historial')
      .then(v => v && setHistorial(JSON.parse(v)))
      .catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const guardarHistorial = async (q) => {
    const nuevo = [q, ...historial.filter(h => h !== q)].slice(0, MAX_HISTORIAL);
    setHistorial(nuevo);
    await AsyncStorage.setItem('busqueda_historial', JSON.stringify(nuevo));
  };

  const limpiarHistorial = async () => {
    setHistorial([]);
    await AsyncStorage.removeItem('busqueda_historial');
  };

  const buscar = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) {
      setResultados({ productos: [], productores: [] });
      return;
    }
    setLoading(true);
    try {
      const [prodRes, prodtRes] = await Promise.all([
        api.get(`/productores/buscar?q=${encodeURIComponent(q)}`).catch(() => ({ data: { data: [] } })),
        api.get(`/productos/buscar?q=${encodeURIComponent(q)}`).catch(() => ({ data: { data: [] } })),
      ]);
      setResultados({
        productores: prodRes.data.data || prodRes.data || [],
        productos:   prodtRes.data.data || prodtRes.data || [],
      });
    } catch {
      setResultados({ productos: [], productores: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const onChangeText = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscar(text), DEBOUNCE_MS);
  };

  const onSubmit = () => {
    if (query.trim().length >= 2) {
      guardarHistorial(query.trim());
      buscar(query.trim());
      Keyboard.dismiss();
    }
  };

  const onHistorialPress = (h) => {
    setQuery(h);
    buscar(h);
  };

  const totalResultados = resultados.productos.length + resultados.productores.length;
  const hayResultados   = totalResultados > 0;
  const hayQuery        = query.trim().length >= 2;

  // Filtrar por tab
  const productosVisible   = activeTab !== 'productores';
  const productoresVisible = activeTab !== 'productos';

  // ── Render ítem producto ──────────────────────────────────────
  const renderProducto = ({ item }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      onPress={() => { guardarHistorial(query); navigation.navigate('DetalleProducto', { id: item.id }); }}
    >
      {item.imagen ? (
        <Image source={{ uri: item.imagen }} style={styles.resultImg} />
      ) : (
        <View style={[styles.resultImgPlaceholder, { backgroundColor: colors.primaryLight + '20' }]}>
          <Ionicons name="fish-outline" size={22} color={colors.primary} />
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>{item.nombre}</Text>
        <Text style={[styles.resultSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.categoria_nombre || item.categoria || 'Producto'}
        </Text>
        <Text style={[styles.resultPrice, { color: colors.primary }]}>
          Bs. {parseFloat(item.precio || 0).toFixed(2)} / kg
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  // ── Render ítem productor ─────────────────────────────────────
  const renderProductor = ({ item }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      onPress={() => { guardarHistorial(query); navigation.navigate('DetalleProductor', { productorId: item.id }); }}
    >
      <View style={[styles.resultImgPlaceholder, { backgroundColor: '#0284c720' }]}>
        <Ionicons name="storefront-outline" size={22} color="#0284c7" />
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
          {item.nombre_empresa || item.nombre}
        </Text>
        <Text style={[styles.resultSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.ubicacion || 'Chapare, Bolivia'}
        </Text>
        {item.especialidad && (
          <Text style={[styles.resultTag, { backgroundColor: '#0284c710', color: '#0284c7' }]}>
            {item.especialidad}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>

      {/* Barra de búsqueda */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={{ marginLeft: 4 }} />
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar productos o productores..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
        {!loading && query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResultados({ productos: [], productores: [] }); }}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs — solo si hay resultados */}
      {hayQuery && hayResultados && (
        <View style={[styles.tabs, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {[
            { key: 'todos',       label: `Todos (${totalResultados})`              },
            { key: 'productos',   label: `Productos (${resultados.productos.length})`  },
            { key: 'productores', label: `Productores (${resultados.productores.length})` },
          ].map(tab => (
            <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}>
              <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.primary : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={[1]} // truco para usar ListHeaderComponent
        keyExtractor={() => 'main'}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <View style={styles.listContent}>

            {/* Historial — si no hay query */}
            {!hayQuery && historial.length > 0 && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Búsquedas recientes</Text>
                  <TouchableOpacity onPress={limpiarHistorial}>
                    <Text style={[styles.clearBtn, { color: colors.primary }]}>Limpiar</Text>
                  </TouchableOpacity>
                </View>
                {historial.map((h, i) => (
                  <TouchableOpacity key={i} style={[styles.historialItem, { borderBottomColor: colors.border }]}
                    onPress={() => onHistorialPress(h)}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.historialText, { color: colors.text }]}>{h}</Text>
                    <TouchableOpacity onPress={() => {
                      const nuevo = historial.filter((_, idx) => idx !== i);
                      setHistorial(nuevo);
                      AsyncStorage.setItem('busqueda_historial', JSON.stringify(nuevo));
                    }}>
                      <Ionicons name="close" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Sugerencias cuando no hay historial ni query */}
            {!hayQuery && historial.length === 0 && (
              <View style={styles.sugerencias}>
                <Ionicons name="search-outline" size={40} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                <Text style={[styles.sugerenciasTitle, { color: colors.text }]}>¿Qué estás buscando?</Text>
                <Text style={[styles.sugerenciasText, { color: colors.textSecondary }]}>
                  Busca por nombre de producto, especie o nombre del productor
                </Text>
                <View style={styles.chips}>
                  {['Tambaqui', 'Carpa', 'Surubí', 'Chapare'].map(s => (
                    <TouchableOpacity key={s} style={[styles.chip, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primary + '40' }]}
                      onPress={() => onHistorialPress(s)}>
                      <Text style={[styles.chipText, { color: colors.primary }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Sin resultados */}
            {hayQuery && !loading && !hayResultados && (
              <View style={styles.emptyState}>
                <Ionicons name="search-circle-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin resultados</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No encontramos nada para "{query}"
                </Text>
              </View>
            )}

            {/* Productores */}
            {hayResultados && productoresVisible && resultados.productores.length > 0 && (
              <View>
                {activeTab === 'todos' && (
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Productores</Text>
                )}
                {resultados.productores.map(item => (
                  <View key={`prod-${item.id}`}>{renderProductor({ item })}</View>
                ))}
              </View>
            )}

            {/* Productos */}
            {hayResultados && productosVisible && resultados.productos.length > 0 && (
              <View style={{ marginTop: productoresVisible && resultados.productores.length > 0 ? 8 : 0 }}>
                {activeTab === 'todos' && (
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Productos</Text>
                )}
                {resultados.productos.map(item => (
                  <View key={`item-${item.id}`}>{renderProducto({ item })}</View>
                ))}
              </View>
            )}
          </View>
        )}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1 },
  searchBar:          { flexDirection: 'row', alignItems: 'center', margin: 12, borderRadius: 14,
                        borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 2, gap: 6 },
  backBtn:            { padding: 4 },
  searchInput:        { flex: 1, height: 44, fontSize: 15 },
  tabs:               { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: 12 },
  tab:                { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabText:            { fontSize: 12, fontWeight: '500' },
  listContent:        { padding: 12, paddingTop: 8 },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle:       { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  clearBtn:           { fontSize: 13 },
  historialItem:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  historialText:      { flex: 1, fontSize: 14 },
  sugerencias:        { alignItems: 'center', paddingTop: 40, gap: 8 },
  sugerenciasTitle:   { fontSize: 18, fontWeight: '600' },
  sugerenciasText:    { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  chips:              { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'center' },
  chip:               { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText:           { fontSize: 13, fontWeight: '500' },
  resultItem:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
                        borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  resultImg:          { width: 52, height: 52, borderRadius: 10 },
  resultImgPlaceholder:{ width: 52, height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  resultInfo:         { flex: 1 },
  resultName:         { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  resultSub:          { fontSize: 12, marginBottom: 2 },
  resultPrice:        { fontSize: 13, fontWeight: '700' },
  resultTag:          { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2,
                        borderRadius: 6, fontSize: 11, fontWeight: '500', marginTop: 2 },
  emptyState:         { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle:         { fontSize: 18, fontWeight: '600' },
  emptyText:          { fontSize: 13 },
});

export default BusquedaScreen;