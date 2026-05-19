// src/screens/producer/GaleriaProductorScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Image, Modal, Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import * as Haptics from 'expo-haptics';
import api from '../../api/axios.config';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const TILE = (width - SPACING.lg * 2 - SPACING.sm * 2) / 3;

const CATEGORIAS = [
  { id: 'general',      label: 'Criadero',    icono: '🏞️' },
  { id: 'alimentacion', label: 'Alimentación', icono: '🐟' },
  { id: 'captura',      label: 'Captura',      icono: '🎣' },
  { id: 'preparacion',  label: 'Preparación',  icono: '🔪' },
];

const GaleriaProductorScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [galeria, setGaleria]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [subiendo, setSubiendo]       = useState(false);
  const [visor, setVisor]             = useState(null);
  const [categoriaActual, setCategoriaActual] = useState('general');

  useEffect(() => { fetchGaleria(); }, []);

  const fetchGaleria = async () => {
    try {
      const res = await api.get('/productor/perfil');
      const perfil = res.data.data || res.data;
      setGaleria(Array.isArray(perfil.galeria_criadero) ? perfil.galeria_criadero : []);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la galería');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGaleria();
  }, []);

  const handleAgregar = () => {
    Alert.alert('Agregar a la galería', '¿Qué quieres subir?', [
      { text: 'Foto',  onPress: () => pickMedia('Images') },
      { text: 'Video', onPress: () => pickMedia('Videos') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const pickMedia = async (tipo) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir contenido.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: tipo === 'Videos'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      videoMaxDuration: 120,
      allowsEditing: tipo === 'Images',
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    await subirMedia(asset);
  };

  const subirMedia = async (asset) => {
    setSubiendo(true);
    try {
      const formData = new FormData();
      const nombre = asset.uri.split('/').pop();
      const ext    = nombre.split('.').pop().toLowerCase();
      const mime   = asset.type === 'video'
        ? (ext === 'mov' ? 'video/quicktime' : 'video/mp4')
        : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      formData.append('media', { uri: asset.uri, name: nombre, type: mime });
      formData.append('categoria', categoriaActual);

      const res = await api.post('/productor/galeria', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      const nueva = res.data.data?.galeria || res.data.galeria;
      if (nueva) setGaleria(nueva);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Listo!', 'Tu contenido fue publicado en la galería.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir el archivo. Intenta nuevamente.');
    } finally {
      setSubiendo(false);
    }
  };

  const confirmarEliminar = (index) => {
    Alert.alert(
      'Eliminar',
      '¿Eliminar este elemento de tu galería?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminarItem(index) },
      ]
    );
  };

  const eliminarItem = async (index) => {
    try {
      await api.delete(`/productor/galeria/${index}`);
      setGaleria(prev => prev.filter((_, i) => i !== index));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el elemento.');
    }
  };

  const renderItem = ({ item }) => {
    const globalIndex = galeria.findIndex(g => g === item);
    return (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor: colors.surface }]}
      onPress={() => setVisor(item)}
      onLongPress={() => confirmarEliminar(globalIndex)}
      activeOpacity={0.85}
    >
      {item.tipo === 'video' ? (
        <>
          <Image
            source={{ uri: item.url.replace('/upload/', '/upload/so_auto,w_300,h_300,c_fill/') }}
            style={styles.tileImg}
            resizeMode="cover"
          />
          <View style={styles.videoBadge}>
            <Ionicons name="play-circle" size={28} color="#fff" />
          </View>
        </>
      ) : (
        <Image source={{ uri: item.url }} style={styles.tileImg} resizeMode="cover" />
      )}
      {item.titulo ? (
        <View style={styles.tileTituloBar}>
          <Text style={styles.tileTitulo} numberOfLines={1}>{item.titulo}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin contenido aún</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
        Sube fotos y videos de tu criadero para que los consumidores conozcan cómo trabajas.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mi Galería</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {galeria.length} elemento{galeria.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleAgregar}
          disabled={subiendo}
        >
          {subiendo
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="add" size={24} color="#fff" />
          }
        </TouchableOpacity>
      </View>

      {/* Tabs de categorías */}
      <View style={styles.tabsContainer}>
        {CATEGORIAS.map((cat) => {
          const count = galeria.filter(i => (i.categoria || 'general') === cat.id).length;
          const active = categoriaActual === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategoriaActual(cat.id)}
              style={[styles.tab, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <Text style={styles.tabIcono}>{cat.icono}</Text>
              <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.textSecondary }]}>
                {cat.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hint */}
      <View style={[styles.hint, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
        <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
        <Text style={[styles.hintText, { color: colors.primary }]}>
          Toca para ver · Mantén presionado para eliminar
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={galeria.filter(item => (item.categoria || 'general') === categoriaActual)}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={[styles.grid, galeria.length === 0 && { flex: 1 }]}
          ListEmptyComponent={renderEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          columnWrapperStyle={{ gap: SPACING.sm }}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        />
      )}

      {/* Visor pantalla completa */}
      <Modal visible={!!visor} transparent animationType="fade" onRequestClose={() => setVisor(null)}>
        <View style={styles.visorBg}>
          <TouchableOpacity style={styles.visorClose} onPress={() => setVisor(null)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>

          {visor?.tipo === 'video' ? (
            <Video
              source={{ uri: visor.url }}
              style={styles.visorVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          ) : (
            <Image source={{ uri: visor?.url }} style={styles.visorImg} resizeMode="contain" />
          )}

          {visor?.titulo ? (
            <View style={styles.visorTitulo}>
              <Text style={styles.visorTituloText}>{visor.titulo}</Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  backBtn:         { width: 40, height: 40, justifyContent: 'center' },
  headerTitle:     { fontSize: 20, fontWeight: '700' },
  headerSub:       { fontSize: 12, marginTop: 1 },
  addBtn:          { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  tabsContainer:   { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: SPACING.sm },
  tab:             { flex: 1, alignItems: 'center', paddingVertical: 10, paddingBottom: 8, gap: 2 },
  tabIcono:        { fontSize: 16 },
  tabLabel:        { fontSize: 10, fontWeight: '600' },
  tabBadge:        { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginTop: 2 },
  tabBadgeText:    { color: '#fff', fontSize: 9, fontWeight: '700' },
  hint:            { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, borderWidth: 1 },
  hintText:        { fontSize: 12, fontWeight: '500' },
  grid:            { padding: SPACING.lg },
  tile:            { width: TILE, height: TILE, borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  tileImg:         { width: '100%', height: '100%' },
  videoBadge:      { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  tileTituloBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 4, paddingVertical: 3 },
  tileTitulo:      { color: '#fff', fontSize: 9, fontWeight: '600' },
  emptyContainer:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:      { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySub:        { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  visorBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  visorClose:      { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  visorImg:        { width, height: width, maxHeight: '80%' },
  visorVideo:      { width, height: width * 0.75 },
  visorTitulo:     { position: 'absolute', bottom: 60, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12 },
  visorTituloText: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
});

export default GaleriaProductorScreen;
