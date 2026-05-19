// src/screens/producer/NotificacionesScreen.jsx
// Centro de notificaciones — alertas IoT + backend
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useLagunas } from '../../hooks/useLagunas';
import { producerService } from '../../api/services/producer.service';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const TIPO_CONFIG = {
  alerta_iot:   { icon: 'thermometer',       color: '#ef4444', bg: '#fef2f2', label: 'Alerta IoT'     },
  nuevo_pedido: { icon: 'cart',               color: '#3b82f6', bg: '#eff6ff', label: 'Nuevo pedido'   },
  estado_pedido:{ icon: 'checkmark-circle',   color: '#22c55e', bg: '#f0fdf4', label: 'Estado pedido'  },
  sistema:      { icon: 'information-circle', color: '#8b5cf6', bg: '#f5f3ff', label: 'Sistema'        },
  bomba:        { icon: 'water',              color: '#0284c7', bg: '#e0f2fe', label: 'Control bomba'  },
};

// Formatear tiempo relativo
const timeAgo = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return 'Ahora mismo';
  if (diff < 3600) return `Hace ${Math.floor(diff/60)} min`;
  if (diff < 86400)return `Hace ${Math.floor(diff/3600)}h`;
  return new Date(iso).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' });
};

const NotificacionesScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { alerts } = useLagunas();

  const [notificaciones, setNotificaciones] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro,     setFiltro]     = useState('todas');

  useEffect(() => {
    cargar();
  }, []);

  // Convertir alertas IoT en notificaciones cuando lleguen nuevas
  useEffect(() => {
    if (!alerts?.length) return;
    const nuevas = alerts.map(a => ({
      id:      `iot-${Date.now()}-${Math.random()}`,
      tipo:    'alerta_iot',
      titulo:  a.type === 'critical' ? '🚨 Alerta crítica' : '⚠️ Fuera de rango',
      mensaje: a.message || String(a),
      leida:   false,
      fecha:   new Date().toISOString(),
    }));
    setNotificaciones(prev => {
      const ids = new Set(prev.map(n => n.mensaje));
      const sinDuplicados = nuevas.filter(n => !ids.has(n.mensaje));
      return [...sinDuplicados, ...prev].slice(0, 50);
    });
  }, [alerts]);

  const cargar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await producerService.getNotifications();
      if (res.success) setNotificaciones(res.data);
    } catch {
      setNotificaciones([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const marcarLeida = async (id) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    await producerService.markNotificationAsRead(id);
  };

  const marcarTodasLeidas = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    await producerService.markAllNotificationsAsRead();
  };

  const eliminarNotificacion = (id) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id));
  };

  const limpiarTodo = () => {
    Alert.alert('Limpiar notificaciones', '¿Eliminar todas las notificaciones?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpiar', style: 'destructive', onPress: () => setNotificaciones([]) },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargar(true);
  };

  const FILTROS = [
    { key: 'todas',    label: 'Todas'    },
    { key: 'no_leidas',label: 'No leídas'},
    { key: 'alerta_iot',label: 'IoT'    },
    { key: 'nuevo_pedido', label: 'Pedidos' },
  ];

  const filtradas = notificaciones.filter(n => {
    if (filtro === 'todas')     return true;
    if (filtro === 'no_leidas') return !n.leida;
    return n.tipo === filtro;
  });

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const renderItem = ({ item }) => {
    const cfg = TIPO_CONFIG[item.tipo] || TIPO_CONFIG.sistema;
    return (
      <TouchableOpacity
        style={[styles.notifItem, { backgroundColor: item.leida ? colors.surface : cfg.bg, borderColor: item.leida ? colors.cardBorder : cfg.color + '40' }]}
        onPress={() => marcarLeida(item.id)}
        onLongPress={() => {
          Alert.alert('Eliminar', '¿Eliminar esta notificación?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => eliminarNotificacion(item.id) },
          ]);
        }}
        activeOpacity={0.85}
      >
        <View style={[styles.notifIcon, { backgroundColor: cfg.color + '20' }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.notifTipo, { color: cfg.color }]}>{cfg.label}</Text>
            {!item.leida && <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />}
          </View>
          <Text style={[styles.notifTitulo, { color: colors.text }]} numberOfLines={1}>
            {item.titulo}
          </Text>
          <Text style={[styles.notifMensaje, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.mensaje}
          </Text>
          <Text style={[styles.notifFecha, { color: colors.textSecondary }]}>
            {timeAgo(item.fecha)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notificaciones</Text>
          {noLeidas > 0 && (
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {noLeidas} sin leer
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {noLeidas > 0 && (
            <TouchableOpacity onPress={marcarTodasLeidas} style={[styles.actionBtn, { backgroundColor: colors.surface }]}>
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Leer todas</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={limpiarTodo} style={[styles.actionBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        {FILTROS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtroChip, filtro === f.key && { backgroundColor: colors.primary }]}
            onPress={() => setFiltro(f.key)}
          >
            <Text style={[styles.filtroText, { color: filtro === f.key ? '#fff' : colors.textSecondary }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        data={filtradas}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.4 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin notificaciones</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filtro === 'no_leidas' ? 'Todas las notificaciones están leídas' : 'No hay notificaciones en esta categoría'}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle:   { fontSize: 24, fontWeight: 'bold' },
  headerSub:     { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { fontSize: 13, fontWeight: '500' },
  filtros:       { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  filtroChip:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filtroText:    { fontSize: 13, fontWeight: '500' },
  lista:         { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  notifItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: BORDER_RADIUS.lg, borderWidth: 1 },
  notifIcon:     { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 2 },
  notifContent:  { flex: 1, minWidth: 0 },
  notifHeader:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  notifTipo:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  unreadDot:     { width: 7, height: 7, borderRadius: 3.5 },
  notifTitulo:   { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  notifMensaje:  { fontSize: 12, lineHeight: 17, marginBottom: 4 },
  notifFecha:    { fontSize: 11 },
  empty:         { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle:    { fontSize: 18, fontWeight: '600' },
  emptyText:     { fontSize: 13, textAlign: 'center' },
});

export default NotificacionesScreen;