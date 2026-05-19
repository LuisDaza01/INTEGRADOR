// src/screens/consumer/FavoritosScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/axios.config';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const STORAGE_KEY = 'favoritos_ids';

// Hook global para favoritos — exportar para usarlo en TiendaScreen también
export const useFavoritos = () => {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => v && setIds(JSON.parse(v)))
      .catch(() => {});
  }, []);

  const toggle = async (productoId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nuevo = ids.includes(productoId)
      ? ids.filter(i => i !== productoId)
      : [...ids, productoId];
    setIds(nuevo);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevo));
    return !ids.includes(productoId);
  };

  const isFavorito = (productoId) => ids.includes(productoId);

  return { ids, toggle, isFavorito };
};

const ProductoFavCard = ({ producto, onRemove, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    {producto.imagen ? (
      <Image source={{ uri: producto.imagen }} style={styles.cardImg} />
    ) : (
      <View style={[styles.cardImgPlaceholder, { backgroundColor: colors.primaryLight + '20' }]}>
        <Ionicons name="fish-outline" size={28} color={colors.primary} />
      </View>
    )}
    <View style={styles.cardInfo}>
      <Text style={[styles.cardNombre, { color: colors.text }]} numberOfLines={1}>
        {producto.nombre}
      </Text>
      <Text style={[styles.cardProductor, { color: colors.textSecondary }]} numberOfLines={1}>
        {producto.productor_nombre || 'Productor NaturaPiscis'}
      </Text>
      <Text style={[styles.cardPrecio, { color: colors.primary }]}>
        Bs. {parseFloat(producto.precio).toFixed(2)} / kg
      </Text>
    </View>
    <TouchableOpacity
      style={styles.removeBtn}
      onPress={() => onRemove(producto.id)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="heart" size={22} color="#ef4444" />
    </TouchableOpacity>
  </TouchableOpacity>
);

const FavoritosScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { ids, toggle } = useFavoritos();

  const [productos,  setProductos]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavoritos = useCallback(async () => {
    if (!ids.length) { setProductos([]); setLoading(false); return; }
    try {
      const results = await Promise.allSettled(
        ids.map(id => api.get(`/productos/${id}`))
      );
      const validos = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.data.data || r.value.data)
        .filter(Boolean);
      setProductos(validos);
    } catch { setProductos([]); }
    finally { setLoading(false); }
  }, [ids.join(',')]);

  useEffect(() => { fetchFavoritos(); }, [fetchFavoritos]);

  const handleRemove = async (id) => {
    Alert.alert('Quitar favorito', '¿Eliminar de tus favoritos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: async () => {
        await toggle(id);
        setProductos(prev => prev.filter(p => p.id !== id));
      }},
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFavoritos();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mis favoritos</Text>
        {productos.length > 0 && (
          <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
            {productos.length} producto{productos.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Ionicons name="heart-outline" size={40} color={colors.textSecondary} style={{ opacity: 0.4 }} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando...</Text>
        </View>
      ) : productos.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="heart-dislike-outline" size={56} color={colors.textSecondary} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin favoritos</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Toca el ❤️ en cualquier producto para guardarlo aquí
          </Text>
          <TouchableOpacity
            style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Tienda')}
          >
            <Text style={styles.exploreBtnText}>Explorar tienda</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <ProductoFavCard
              producto={item}
              onRemove={handleRemove}
              onPress={() => navigation.navigate('DetalleProducto', { id: item.id })}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1 },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle:        { fontSize: 24, fontWeight: 'bold' },
  headerCount:        { fontSize: 13 },
  lista:              { paddingHorizontal: SPACING.lg, paddingBottom: 40, paddingTop: 4 },
  card:               { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: BORDER_RADIUS.lg, borderWidth: 1 },
  cardImg:            { width: 64, height: 64, borderRadius: 12 },
  cardImgPlaceholder: { width: 64, height: 64, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardInfo:           { flex: 1 },
  cardNombre:         { fontSize: 14, fontWeight: '600' },
  cardProductor:      { fontSize: 12, marginTop: 2 },
  cardPrecio:         { fontSize: 14, fontWeight: '700', marginTop: 4 },
  removeBtn:          { padding: 6 },
  centered:           { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 40 },
  loadingText:        { fontSize: 14 },
  emptyTitle:         { fontSize: 20, fontWeight: '700' },
  emptySub:           { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  exploreBtn:         { marginTop: 8, paddingHorizontal: 28, paddingVertical: 12, borderRadius: BORDER_RADIUS.lg },
  exploreBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default FavoritosScreen;