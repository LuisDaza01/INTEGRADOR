// src/screens/producer/OrdersScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, TextInput, Alert, Modal, Animated,
  Vibration, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { usePedidosMonitor } from '../../hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { orderService } from '../../api/services';
import api from '../../api/axios.config';
import { Card, CardBody } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/Loading';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const PRECIO_KG = 35; // Bs. por kg (sincronizado con backend)

const ORDER_STATES = {
  pendiente:              { label: 'Pendiente',              color: '#f59e0b', icon: 'time-outline',             bgColor: 'rgba(245,158,11,0.1)'   },
  confirmado:             { label: 'Confirmado',             color: '#3b82f6', icon: 'checkmark-circle-outline',  bgColor: 'rgba(59,130,246,0.1)'   },
  preparando:             { label: 'En Preparación',         color: '#8b5cf6', icon: 'construct-outline',         bgColor: 'rgba(139,92,246,0.1)'   },
  // ✅ NUEVOS ESTADOS
  pesado:                 { label: 'Pesado',                 color: '#0ea5e9', icon: 'scale-outline',             bgColor: 'rgba(14,165,233,0.1)'   },
  esperando_confirmacion: { label: 'Esperando confirmación', color: '#f97316', icon: 'hourglass-outline',         bgColor: 'rgba(249,115,22,0.1)'   },
  listo_para_recoger:     { label: 'Listo para recoger',     color: '#f97316', icon: 'bag-check-outline',         bgColor: 'rgba(249,115,22,0.1)'   },
  en_camino:              { label: 'En Camino',              color: '#14b8a6', icon: 'bicycle-outline',           bgColor: 'rgba(20,184,166,0.1)'   },
  entregado:              { label: 'Entregado',              color: '#22c55e', icon: 'checkmark-done-outline',    bgColor: 'rgba(34,197,94,0.1)'    },
  cancelado:              { label: 'Cancelado',              color: '#ef4444', icon: 'close-circle-outline',      bgColor: 'rgba(239,68,68,0.1)'    },
};

const FILTER_OPTIONS = [
  { value: 'todos',                  label: 'Todos'                    },
  { value: 'pendiente',              label: 'Pendientes'               },
  { value: 'confirmado',             label: 'Confirmados'              },
  { value: 'preparando',             label: 'En Preparación'           },
  { value: 'esperando_confirmacion', label: 'Esperando confirmación'   },
  { value: 'listo_para_recoger',     label: 'Listos para recoger'      },
  { value: 'en_camino',              label: 'En Camino'                },
  { value: 'entregado',              label: 'Entregados'               },
];

// ── Modal de registro de peso ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// ✅ MODAL REGISTRAR PESO POR ITEM
// El productor ingresa cantidad_pescados + peso_kg por CADA producto del pedido
// Envía array al backend: PUT /pedidos/:id/pesar-items
// ═══════════════════════════════════════════════════════════════
const ModalRegistrarPeso = ({ visible, pedido, onClose, onSuccess, colors }) => {
  // Estado: mapa { detalle_id: { cantidad, pesoKg } }
  const [itemsPeso, setItemsPeso] = useState({});
  const [guardando, setGuardando] = useState(false);

  const items = Array.isArray(pedido?.items) ? pedido.items : [];

  // Prellenar con la cantidad original cuando se abre el modal
  useEffect(() => {
    if (visible && items.length > 0) {
      const inicial = {};
      items.forEach(item => {
        const detalleId = item.detalle_id || item.id;
        inicial[detalleId] = {
          cantidad: String(item.cantidad || ''),
          pesoKg:   '',
        };
      });
      setItemsPeso(inicial);
    }
  }, [visible, pedido?.id]);

  const actualizarItem = (detalleId, campo, valor) => {
    setItemsPeso(prev => ({
      ...prev,
      [detalleId]: { ...prev[detalleId], [campo]: valor }
    }));
  };

  // Cálculos por item y totales
  const itemsCalculados = items.map(item => {
    const detalleId     = item.detalle_id || item.id;
    const datos         = itemsPeso[detalleId] || { cantidad: '', pesoKg: '' };
    const cant          = parseInt(datos.cantidad);
    const peso          = parseFloat(datos.pesoKg);
    const precioPorKg   = parseFloat(item.precio_unitario || 35);
    const precioItem    = !isNaN(peso) && peso > 0 ? peso * precioPorKg : 0;
    const pesoPromGr    = !isNaN(peso) && !isNaN(cant) && cant > 0 ? (peso * 1000) / cant : 0;
    const valido        = cant > 0 && peso > 0;
    return { ...item, detalleId, cant, peso, precioPorKg, precioItem, pesoPromGr, valido, datos };
  });

  const totalPescados = itemsCalculados.reduce((s, i) => s + (i.cant || 0), 0);
  const totalPeso     = itemsCalculados.reduce((s, i) => s + (i.peso || 0), 0);
  const totalPrecio   = itemsCalculados.reduce((s, i) => s + (i.precioItem || 0), 0);
  const todosValidos  = itemsCalculados.length > 0 && itemsCalculados.every(i => i.valido);

  const handleGuardar = async () => {
    // Validar que todos los items tengan datos válidos
    for (const item of itemsCalculados) {
      if (!item.cant || item.cant < 1) {
        Alert.alert('Error', `Cantidad inválida en "${item.nombre}"`);
        return;
      }
      if (!item.peso || item.peso <= 0) {
        Alert.alert('Error', `Peso inválido en "${item.nombre}"`);
        return;
      }
    }

    setGuardando(true);
    try {
      const payload = {
        items: itemsCalculados.map(item => ({
          detalle_id:        item.detalleId,
          cantidad_pescados: item.cant,
          peso_real_kg:      item.peso,
        })),
      };

      const res = await api.put(`/pedidos/${pedido.id}/pesar-items`, payload);
      const data = res.data?.data || res.data;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(data);
      setItemsPeso({});
      onClose();
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err.response?.data?.message || 'No se pudo registrar el peso');
    } finally {
      setGuardando(false);
    }
  };

  if (!pedido) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalOverlay}>
          <View style={[styles.pesoModalContent, { backgroundColor: colors.surface, maxHeight: '88%' }]}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>⚖️ Registrar peso</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  Pedido #{pedido.id} · {pedido.cliente?.nombre || 'Cliente'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                  Este pedido no tiene items para pesar
                </Text>
              </View>
            ) : (
              <React.Fragment>
                <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.pesoHelperText, { color: colors.textSecondary }]}>
                    Pesa cada producto por separado y registra los datos
                  </Text>

                  {itemsCalculados.map((item, idx) => (
                    <View
                      key={item.detalleId}
                      style={[
                        styles.itemPesoCard,
                        {
                          backgroundColor: colors.background,
                          borderColor: item.valido ? '#22C55E' : colors.border,
                        },
                      ]}
                    >
                      {/* Encabezado del producto */}
                      <View style={styles.itemPesoHeader}>
                        <View style={[styles.itemPesoBadge, { backgroundColor: `${colors.primary}20` }]}>
                          <Ionicons name="fish" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.itemPesoNombre, { color: colors.text }]}>{item.nombre}</Text>
                          <Text style={[styles.itemPesoPrecioRef, { color: colors.textSecondary }]}>
                            Pidió {item.cantidad} · Bs. {parseFloat(item.precio_unitario).toFixed(2)}/kg
                          </Text>
                        </View>
                        {item.valido && <Ionicons name="checkmark-circle" size={22} color="#22C55E" />}
                      </View>

                      {/* Inputs en fila: cantidad + peso */}
                      <View style={styles.itemPesoInputRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 4 }]}>
                            Cantidad
                          </Text>
                          <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                            <Ionicons name="fish-outline" size={18} color={colors.textSecondary} />
                            <TextInput
                              style={[styles.input, { color: colors.text, fontSize: 15 }]}
                              placeholder="0"
                              placeholderTextColor={colors.placeholder}
                              keyboardType="numeric"
                              value={item.datos.cantidad}
                              onChangeText={(v) => actualizarItem(item.detalleId, 'cantidad', v)}
                            />
                            <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>ud</Text>
                          </View>
                        </View>

                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 4 }]}>
                            Peso total
                          </Text>
                          <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                            <Ionicons name="scale-outline" size={18} color={colors.textSecondary} />
                            <TextInput
                              style={[styles.input, { color: colors.text, fontSize: 15 }]}
                              placeholder="0.00"
                              placeholderTextColor={colors.placeholder}
                              keyboardType="decimal-pad"
                              value={item.datos.pesoKg}
                              onChangeText={(v) => actualizarItem(item.detalleId, 'pesoKg', v)}
                            />
                            <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>kg</Text>
                          </View>
                        </View>
                      </View>

                      {/* Cálculo del item */}
                      {item.peso > 0 && (
                        <View style={styles.itemPesoResumen}>
                          <View style={styles.resumenRow}>
                            <Text style={[styles.resumenLabel, { fontSize: 12 }]}>
                              Promedio: {item.pesoPromGr.toFixed(0)}g c/u
                            </Text>
                          </View>
                          <View style={[styles.resumenRow, { marginTop: 4 }]}>
                            <Text style={[styles.resumenLabel, { fontWeight: '600' }]}>Subtotal:</Text>
                            <Text style={[styles.resumenVal, { color: '#16A34A', fontSize: 16, fontWeight: '700' }]}>
                              Bs. {item.precioItem.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>

                {/* Resumen total */}
                {totalPrecio > 0 && (
                  <View style={[styles.totalPesoBox, { backgroundColor: '#F0FDF4', borderColor: '#22C55E' }]}>
                    <View style={styles.resumenRow}>
                      <Text style={[styles.resumenLabel, { fontSize: 13 }]}>Total pescados:</Text>
                      <Text style={[styles.resumenVal, { fontSize: 14 }]}>{totalPescados} ud</Text>
                    </View>
                    <View style={styles.resumenRow}>
                      <Text style={[styles.resumenLabel, { fontSize: 13 }]}>Peso total:</Text>
                      <Text style={[styles.resumenVal, { fontSize: 14 }]}>{totalPeso.toFixed(2)} kg</Text>
                    </View>
                    <View style={[styles.resumenRow, { marginTop: 4, borderTopWidth: 1, borderTopColor: '#22C55E', paddingTop: 6 }]}>
                      <Text style={[styles.resumenLabel, { fontWeight: '700', fontSize: 15 }]}>
                        💰 Total a cobrar:
                      </Text>
                      <Text style={[styles.resumenVal, { fontWeight: '800', fontSize: 20, color: '#16A34A' }]}>
                        Bs. {totalPrecio.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}

                <Text style={[styles.pesoNota, { color: colors.textSecondary }]}>
                  El consumidor recibirá una notificación. El tiempo de confirmación lo defines en tu perfil.
                </Text>

                {/* Botón */}
                <TouchableOpacity
                  style={[styles.pesoBtn, {
                    backgroundColor: guardando || !todosValidos ? colors.border : '#22C55E',
                  }]}
                  onPress={handleGuardar}
                  disabled={guardando || !todosValidos}
                >
                  {guardando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.pesoBtnText}>
                        {todosValidos ? 'Confirmar y notificar' : 'Completa todos los pesos'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            )}

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Modal ver comprobante ─────────────────────────────────────
const ModalComprobante = ({ visible, imageUrl, onClose, onConfirmar, colors }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity style={{ position: 'absolute', top: 48, right: 20, zIndex: 10, padding: 8 }} onPress={onClose}>
        <Ionicons name="close" size={30} color="#fff" />
      </TouchableOpacity>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 16 }}>Comprobante de pago</Text>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 320, height: 420, borderRadius: 12, resizeMode: 'contain' }}
        />
      ) : (
        <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Sin imagen</Text>
      )}
      <TouchableOpacity
        style={{ marginTop: 24, backgroundColor: '#22c55e', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }}
        onPress={onConfirmar}
      >
        <Ionicons name="checkmark-circle" size={22} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Confirmar pago y aceptar pedido</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

// ── Componente principal ──────────────────────────────────────
const OrdersScreen = () => {
  const { colors }     = useTheme();
  const navigation     = useNavigation();
  const { pedidos: pedidosMonitor, nuevoPedido, loading, stats, refresh, lastUpdate } = usePedidosMonitor(true);

  const [pedidos,          setPedidos]          = useState([]);
  const [refreshing,       setRefreshing]       = useState(false);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [statusFilter,     setStatusFilter]     = useState('todos');
  const [showFilterModal,  setShowFilterModal]  = useState(false);
  const [selectedPedido,   setSelectedPedido]   = useState(null);
  const [showDetailModal,  setShowDetailModal]  = useState(false);
  const [showNewOrderBanner,setShowNewOrderBanner] = useState(false);
  const [showPesoModal,       setShowPesoModal]       = useState(false);
  const [pedidoParaPesar,     setPedidoParaPesar]     = useState(null);
  const [showComprobante,     setShowComprobante]     = useState(false);
  const [comprobanteUrl,      setComprobanteUrl]      = useState(null);
  const [pedidoComprobante,   setPedidoComprobante]   = useState(null);
  const bannerAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    setPedidos(pedidosMonitor);
    if (selectedPedido) {
      const actualizado = pedidosMonitor.find(p => p.id === selectedPedido.id);
      if (actualizado) setSelectedPedido(actualizado);
    }
  }, [pedidosMonitor]);

  useEffect(() => {
    if (nuevoPedido) {
      setShowNewOrderBanner(true);
      Vibration.vibrate([0, 250, 100, 250]);
      Animated.spring(bannerAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 7 }).start();
      const timer = setTimeout(() => hideBanner(), 5000);
      return () => clearTimeout(timer);
    }
  }, [nuevoPedido]);

  const hideBanner = () => {
    Animated.timing(bannerAnim, { toValue: -100, duration: 300, useNativeDriver: true })
      .start(() => setShowNewOrderBanner(false));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await orderService.cambiarEstado(pedidoId, nuevoEstado);
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
      setSelectedPedido(prev => prev?.id === pedidoId ? { ...prev, estado: nuevoEstado } : prev);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Estado actualizado', `El pedido ahora está: ${ORDER_STATES[nuevoEstado]?.label || nuevoEstado}`);
      setShowDetailModal(false);
      setTimeout(() => refresh(), 1000);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
    }
  };

  // ✅ Ver comprobante QR
  const handleVerComprobante = (pedido) => {
    setPedidoComprobante(pedido);
    setComprobanteUrl(pedido.comprobante_url);
    setShowComprobante(true);
    setShowDetailModal(false);
  };

  const handleConfirmarPagoQR = () => {
    if (!pedidoComprobante) return;
    Alert.alert(
      '¿Confirmar pago?',
      `Confirma que verificaste el comprobante de Bs. ${parseFloat(pedidoComprobante.total || 0).toFixed(2)} de ${pedidoComprobante.cliente?.nombre}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar pago',
          onPress: async () => {
            setShowComprobante(false);
            await handleCambiarEstado(pedidoComprobante.id, 'confirmado');
            setPedidoComprobante(null);
          },
        },
      ]
    );
  };

  // ✅ Abrir modal de pesar
  const handleAbrirPesar = (pedido) => {
    setPedidoParaPesar(pedido);
    setShowPesoModal(true);
    setShowDetailModal(false);
  };

  // ✅ Cuando el peso fue registrado exitosamente
  const handlePesoRegistrado = (data) => {
    const precioFinal = parseFloat(data.precio_final || 0).toFixed(2);
    const minutos     = data.minutos_para_confirmar || 20;
    Alert.alert(
      '⚖️ Peso registrado',
      `Total calculado: Bs. ${precioFinal}\nEl consumidor tiene ${minutos} min para confirmar.`
    );
    setTimeout(() => refresh(), 500);
  };

  const filteredPedidos = pedidos.filter((pedido) => {
    if (statusFilter !== 'todos' && pedido.estado !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return pedido.numero?.toLowerCase().includes(query) ||
             pedido.cliente?.nombre?.toLowerCase().includes(query);
    }
    return true;
  });

  const countByStatus = {
    pendiente:              stats.pendientes       || 0,
    confirmado:             stats.confirmados      || 0,
    preparando:             stats.preparando       || 0,
    listo_para_recoger:     stats.listoParaRecoger || 0,
    en_camino:              stats.enCamino         || 0,
    entregado:              stats.entregados       || 0,
  };

  const openDetail = (pedido) => {
    const pedidoActualizado = pedidos.find(p => p.id === pedido.id) || pedido;
    setSelectedPedido(pedidoActualizado);
    setShowDetailModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>

      {/* Banner nuevo pedido */}
      {showNewOrderBanner && nuevoPedido && (
        <Animated.View style={[styles.newOrderBanner, { transform: [{ translateY: bannerAnim }] }]}>
          <TouchableOpacity style={styles.newOrderBannerContent}
            onPress={() => { hideBanner(); setStatusFilter('pendiente'); }} activeOpacity={0.9}>
            <View style={styles.newOrderIcon}><Ionicons name="cart" size={24} color="#fff" /></View>
            <View style={styles.newOrderInfo}>
              <Text style={styles.newOrderTitle}>🎉 ¡Nuevo Pedido!</Text>
              <Text style={styles.newOrderText}>{nuevoPedido.cliente?.nombre} - Bs. {nuevoPedido.total?.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={hideBanner} style={styles.closeBannerBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Pedidos</Text>
          <View style={styles.headerSubtitleRow}>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {countByStatus.pendiente} pendiente{countByStatus.pendiente !== 1 ? 's' : ''}
            </Text>
            {lastUpdate && (
              <Text style={[styles.lastUpdateText, { color: colors.textSecondary }]}>
                • {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={[styles.refreshButton, { backgroundColor: colors.surface }]} onPress={onRefresh}>
          <Ionicons name={refreshing ? 'sync' : 'refresh-outline'} size={24}
            color={refreshing ? colors.primary : colors.text} />
        </TouchableOpacity>
      </View>

      {/* Summary cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.summaryScroll} contentContainerStyle={styles.summaryContent}>
        {[
          { icon: 'time',             label: 'Pendientes',  value: countByStatus.pendiente,          color: '#f59e0b', filter: 'pendiente'          },
          { icon: 'checkmark-circle', label: 'Confirmados', value: countByStatus.confirmado,         color: '#3b82f6', filter: 'confirmado'         },
          { icon: 'construct',        label: 'Preparando',  value: countByStatus.preparando,         color: '#8b5cf6', filter: 'preparando'         },
          { icon: 'bag-check',        label: 'Para recoger',value: countByStatus.listo_para_recoger, color: '#f97316', filter: 'listo_para_recoger' },
          { icon: 'bicycle',          label: 'En Camino',   value: countByStatus.en_camino,          color: '#14b8a6', filter: 'en_camino'          },
          { icon: 'checkmark-done',   label: 'Entregados',  value: countByStatus.entregado,          color: '#22c55e', filter: 'entregado'          },
        ].map((item) => (
          <SummaryCard key={item.filter} {...item} active={statusFilter === item.filter}
            onPress={() => setStatusFilter(statusFilter === item.filter ? 'todos' : item.filter)}
            colors={colors} />
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar pedido o cliente..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.surface }]}
          onPress={() => setShowFilterModal(true)}>
          <Ionicons name="filter-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
          tintColor={colors.primary} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando pedidos...</Text>
          </View>
        ) : filteredPedidos.length > 0 ? (
          filteredPedidos.map((pedido) => (
            <OrderCard
              key={pedido.id}
              pedido={pedido}
              onPress={() => openDetail(pedido)}
              onConfirmar={handleCambiarEstado}
              onPesar={() => handleAbrirPesar(pedido)}
              onChat={() => navigation.navigate('Chat', { destinatarioId: pedido.cliente?.id, nombre: pedido.cliente?.nombre || 'Cliente' })}
              onVerComprobante={handleVerComprobante}
              colors={colors}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay pedidos</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {statusFilter !== 'todos'
                ? `No hay pedidos con estado "${ORDER_STATES[statusFilter]?.label || statusFilter}"`
                : 'Aún no tienes pedidos recibidos'}
            </Text>
            {statusFilter !== 'todos' && (
              <TouchableOpacity style={[styles.clearFilterButton, { backgroundColor: colors.primary }]}
                onPress={() => setStatusFilter('todos')}>
                <Text style={styles.clearFilterText}>Ver todos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal filtros */}
      <Modal visible={showFilterModal} transparent animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filtrar por Estado</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {FILTER_OPTIONS.map((option) => (
              <TouchableOpacity key={option.value}
                style={[styles.filterOption, { borderBottomColor: colors.border },
                  statusFilter === option.value && styles.filterOptionActive]}
                onPress={() => { setStatusFilter(option.value); setShowFilterModal(false); }}>
                <Text style={[styles.filterOptionText, { color: colors.text },
                  statusFilter === option.value && { color: colors.primary, fontWeight: '500' }]}>
                  {option.label}
                </Text>
                {statusFilter === option.value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Modal detalle */}
      <Modal visible={showDetailModal} transparent animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detailModalContent, { backgroundColor: colors.surface }]}>
            {selectedPedido && (
              <OrderDetail
                pedido={selectedPedido}
                onClose={() => setShowDetailModal(false)}
                onCambiarEstado={handleCambiarEstado}
                onPesar={() => handleAbrirPesar(selectedPedido)}
                onVerComprobante={handleVerComprobante}
                colors={colors}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal registrar peso */}
      <ModalRegistrarPeso
        visible={showPesoModal}
        pedido={pedidoParaPesar}
        onClose={() => setShowPesoModal(false)}
        onSuccess={handlePesoRegistrado}
        colors={colors}
      />

      {/* Modal comprobante QR */}
      <ModalComprobante
        visible={showComprobante}
        imageUrl={comprobanteUrl}
        onClose={() => setShowComprobante(false)}
        onConfirmar={handleConfirmarPagoQR}
        colors={colors}
      />
    </SafeAreaView>
  );
};

// ── SummaryCard ───────────────────────────────────────────────
const SummaryCard = ({ icon, label, value, color, active, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.summaryCard, { backgroundColor: colors.surface },
      active && { borderColor: color, borderWidth: 2 }]}
    onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.summaryIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text>
  </TouchableOpacity>
);

// ── OrderCard ─────────────────────────────────────────────────
const OrderCard = ({ pedido, onPress, onConfirmar, onPesar, onChat, onVerComprobante, colors }) => {
  const estadoInfo = ORDER_STATES[pedido.estado] || ORDER_STATES.pendiente;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Card style={styles.orderCard}>
        <CardBody>
          <View style={styles.orderHeader}>
            <View>
              <Text style={[styles.orderNumber, { color: colors.text }]}>{pedido.numero}</Text>
              <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{pedido.fecha}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusBadge, { backgroundColor: estadoInfo.bgColor }]}>
                <Ionicons name={estadoInfo.icon} size={14} color={estadoInfo.color} />
                <Text style={[styles.statusText, { color: estadoInfo.color }]}>{estadoInfo.label}</Text>
              </View>
              <TouchableOpacity onPress={e => { e.stopPropagation?.(); onChat?.(); }}
                style={{ padding: 6, backgroundColor: 'rgba(59,130,246,0.12)', borderRadius: 8 }}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.orderBody}>
            <View style={styles.clientInfo}>
              <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.clientName, { color: colors.textSecondary }]}>{pedido.cliente?.nombre}</Text>
            </View>
            <Text style={[styles.orderTotal, { color: colors.primary }]}>
              Bs. {parseFloat(pedido.total || 0).toFixed(2)}
            </Text>
          </View>

          {/* ── Acciones rápidas por estado ── */}
          {pedido.estado === 'pendiente' && (
            <View style={styles.quickActions}>
              {pedido.comprobante_url ? (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#8b5cf6', flex: 1 }]}
                  onPress={() => onVerComprobante?.(pedido)}>
                  <Ionicons name="image-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Ver comprobante QR</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#eab308', flex: 1 }]}
                  onPress={() => Alert.alert(
                    '¿Recibiste el pago QR?',
                    `Verifica en tu app del BCP que recibiste Bs. ${pedido.total?.toFixed(2)} de ${pedido.cliente?.nombre}`,
                    [
                      { text: 'No aún', style: 'cancel' },
                      { text: 'Sí, confirmar', onPress: () => onConfirmar(pedido.id, 'confirmado') },
                    ]
                  )}>
                  <Ionicons name="qr-code-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Confirmar pago QR</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton, { flex: 0, paddingHorizontal: 12 }]}
                onPress={() => onConfirmar(pedido.id, 'cancelado')}>
                <Ionicons name="close" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          {pedido.estado === 'confirmado' && (
            <TouchableOpacity style={[styles.actionButton, styles.prepareButton]}
              onPress={() => onConfirmar(pedido.id, 'preparando')}>
              <Ionicons name="construct-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Iniciar preparación</Text>
            </TouchableOpacity>
          )}

          {/* ✅ NUEVO: botón para registrar peso cuando está preparando */}
          {pedido.estado === 'preparando' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#0ea5e9' }]}
              onPress={onPesar}>
              <Ionicons name="scale-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Registrar peso</Text>
            </TouchableOpacity>
          )}

          {/* ✅ Mostrar info de peso cuando está esperando confirmación */}
          {pedido.estado === 'esperando_confirmacion' && pedido.peso_real_kg && (
            <View style={[styles.pesoInfoBadge, { backgroundColor: 'rgba(249,115,22,0.1)' }]}>
              <Ionicons name="hourglass-outline" size={14} color="#f97316" />
              <Text style={[styles.pesoInfoText, { color: '#f97316' }]}>
                {pedido.cantidad_pescados} pescados · {pedido.peso_real_kg}kg · Bs. {parseFloat(pedido.precio_final || 0).toFixed(2)}
              </Text>
            </View>
          )}

          {pedido.estado === 'en_camino' && (
            <TouchableOpacity style={[styles.actionButton, styles.deliverButton]}
              onPress={() => onConfirmar(pedido.id, 'entregado')}>
              <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Marcar entregado</Text>
            </TouchableOpacity>
          )}
        </CardBody>
      </Card>
    </TouchableOpacity>
  );
};

// ── OrderDetail ───────────────────────────────────────────────
const OrderDetail = ({ pedido, onClose, onCambiarEstado, onPesar, onVerComprobante, colors }) => {
  const estadoInfo = ORDER_STATES[pedido.estado] || ORDER_STATES.pendiente;

  const getNextState = () => {
    switch (pedido.estado) {
      case 'pendiente':              return 'confirmado';
      case 'confirmado':             return 'preparando';
      // ✅ preparando → registrar peso (no cambio de estado directo)
      case 'listo_para_recoger':     return 'en_camino';
      case 'en_camino':              return 'entregado';
      default:                       return null;
    }
  };
  const nextState = getNextState();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.detailHeader}>
        <View>
          <Text style={[styles.detailNumber, { color: colors.text }]}>{pedido.numero}</Text>
          <Text style={[styles.detailDate, { color: colors.textSecondary }]}>{pedido.fecha}</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.currentStatus, { backgroundColor: estadoInfo.bgColor }]}>
        <Ionicons name={estadoInfo.icon} size={24} color={estadoInfo.color} />
        <Text style={[styles.currentStatusText, { color: estadoInfo.color }]}>{estadoInfo.label}</Text>
      </View>

      {/* Código de retiro */}
      {pedido.codigo_retiro && (
        <View style={[styles.codigoRetiroBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
          <Ionicons name="key-outline" size={22} color="#3B82F6" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>
              Código para el conductor:
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#3B82F6', letterSpacing: 4, marginTop: 2 }}>
              {pedido.codigo_retiro}
            </Text>
            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
              Pega este código en el paquete
            </Text>
          </View>
        </View>
      )}

      {/* ✅ Info de peso registrado */}
      {pedido.peso_real_kg && (
        <View style={[styles.pesoDetalleBox, { backgroundColor: '#F0FDF4', borderColor: '#22C55E' }]}>
          <Text style={[styles.pesoDetalleTitle, { color: '#16A34A' }]}>⚖️ Peso registrado</Text>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Cantidad:</Text>
            <Text style={styles.resumenVal}>{pedido.cantidad_pescados} pescados</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Peso total:</Text>
            <Text style={styles.resumenVal}>{pedido.peso_real_kg} kg</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={[styles.resumenLabel, { fontWeight: '700' }]}>Precio final:</Text>
            <Text style={[styles.resumenVal, { fontWeight: '800', color: '#16A34A', fontSize: 18 }]}>
              Bs. {parseFloat(pedido.precio_final || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Cliente */}
      <View style={styles.detailSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Cliente</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{pedido.cliente?.nombre}</Text>
        </View>
        {pedido.cliente?.telefono && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>{pedido.cliente.telefono}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{pedido.cliente?.direccion}</Text>
        </View>
      </View>

      {/* Envío */}
      <View style={styles.detailSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Envío</Text>
        <View style={styles.infoRow}>
          <Ionicons name="car-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{pedido.metodoEnvio}</Text>
        </View>
      </View>

      {/* Total */}
      <View style={[styles.totalSection, { backgroundColor: colors.background }]}>
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
        <Text style={[styles.totalValue, { color: colors.primary }]}>
          Bs. {parseFloat(pedido.total || 0).toFixed(2)}
        </Text>
      </View>

      {pedido.notas && (
        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notas</Text>
          <Text style={[styles.notesText, { color: colors.textSecondary }]}>{pedido.notas}</Text>
        </View>
      )}

      {/* Comprobante QR */}
      {pedido.comprobante_url && (
        <TouchableOpacity
          style={[styles.mainActionButton, { backgroundColor: '#8b5cf6', marginBottom: 8 }]}
          onPress={() => onVerComprobante?.(pedido)}>
          <Ionicons name="image-outline" size={22} color="#fff" />
          <Text style={styles.mainActionText}>📸 Ver comprobante de pago</Text>
        </TouchableOpacity>
      )}

      {/* ✅ Botón especial para "preparando" → registrar peso */}
      {pedido.estado === 'preparando' && (
        <TouchableOpacity
          style={[styles.mainActionButton, { backgroundColor: '#0ea5e9' }]}
          onPress={onPesar}>
          <Ionicons name="scale-outline" size={22} color="#fff" />
          <Text style={styles.mainActionText}>⚖️ Registrar peso y calcular precio</Text>
        </TouchableOpacity>
      )}

      {/* Siguiente estado (para el resto) */}
      {nextState && pedido.estado !== 'preparando' && (
        <TouchableOpacity
          style={[styles.mainActionButton, { backgroundColor: ORDER_STATES[nextState]?.color }]}
          onPress={() => onCambiarEstado(pedido.id, nextState)}>
          <Ionicons name={ORDER_STATES[nextState]?.icon} size={22} color="#fff" />
          <Text style={styles.mainActionText}>Cambiar a: {ORDER_STATES[nextState]?.label}</Text>
        </TouchableOpacity>
      )}

      {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
        <TouchableOpacity style={styles.cancelOrderButton}
          onPress={() => onCambiarEstado(pedido.id, 'cancelado')}>
          <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
          <Text style={styles.cancelOrderText}>Cancelar Pedido</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:         { flex: 1 },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle:       { fontSize: 28, fontWeight: 'bold' },
  headerSubtitle:    { fontSize: 14 },
  headerSubtitleRow: { flexDirection: 'row', alignItems: 'center' },
  lastUpdateText:    { fontSize: 12, marginLeft: 4 },
  refreshButton:     { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  newOrderBanner:        { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  newOrderBannerContent: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22c55e', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, elevation: 8 },
  newOrderIcon:          { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  newOrderInfo:          { flex: 1, marginLeft: SPACING.md },
  newOrderTitle:         { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  newOrderText:          { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 2 },
  closeBannerBtn:        { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },

  summaryScroll:   { maxHeight: 100 },
  summaryContent:  { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  summaryCard:     { borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: 'transparent' },
  summaryIcon:     { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  summaryValue:    { fontSize: 18, fontWeight: 'bold' },
  summaryLabel:    { fontSize: 10 },

  searchContainer:      { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, gap: SPACING.sm },
  searchInput:          { flex: 1, height: 44, fontSize: 14 },
  filterButton:         { width: 44, height: 44, borderRadius: BORDER_RADIUS.md, justifyContent: 'center', alignItems: 'center' },

  scrollView:       { flex: 1 },
  scrollContent:    { padding: SPACING.lg, paddingBottom: 100 },
  loadingContainer: { alignItems: 'center', padding: SPACING.xl },
  loadingText:      { marginTop: SPACING.md },
  emptyContainer:   { alignItems: 'center', padding: SPACING.xl },
  emptyTitle:       { fontSize: 20, fontWeight: 'bold', marginTop: SPACING.md },
  emptyText:        { fontSize: 14, textAlign: 'center', marginTop: SPACING.sm },
  clearFilterButton:{ marginTop: SPACING.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.md },
  clearFilterText:  { color: '#fff', fontWeight: '500' },

  orderCard:     { marginBottom: SPACING.md },
  orderHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  orderNumber:   { fontSize: 16, fontWeight: '600' },
  orderDate:     { fontSize: 12, marginTop: 2 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 20 },
  statusText:    { fontSize: 11, fontWeight: '500' },
  orderBody:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  clientInfo:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clientName:    { fontSize: 14 },
  orderTotal:    { fontSize: 18, fontWeight: 'bold' },

  quickActions:     { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  actionButton:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  actionButtonText: { color: '#fff', fontWeight: '500', fontSize: 13 },
  cancelButton:     { backgroundColor: 'rgba(239,68,68,0.1)' },
  prepareButton:    { backgroundColor: '#8b5cf6' },
  deliverButton:    { backgroundColor: '#22c55e' },

  // ✅ Badge info peso en la card
  pesoInfoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, marginTop: 6 },
  pesoInfoText:  { fontSize: 12, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '70%' },
  detailModalContent: { maxHeight: '88%' },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle:   { fontSize: 18, fontWeight: '600' },
  modalSub:     { fontSize: 13, marginTop: 2 },
  filterOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1 },
  filterOptionActive: { backgroundColor: 'rgba(59,130,246,0.1)', marginHorizontal: -SPACING.lg, paddingHorizontal: SPACING.lg },
  filterOptionText:   { fontSize: 16 },

  // ✅ Modal de peso
  pesoModalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg },
  inputLabel:       { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  inputBox:         { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  input:            { flex: 1, fontSize: 18, fontWeight: '600' },
  inputUnit:        { fontSize: 13 },
  resumenBox:       { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 14, gap: 6 },
  resumenRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumenLabel:     { fontSize: 13, color: '#374151' },
  resumenVal:       { fontSize: 14, fontWeight: '600', color: '#374151' },
  pesoNota:         { fontSize: 12, marginTop: 12, textAlign: 'center', fontStyle: 'italic' },
  pesoBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 14 },
  pesoBtnText:      { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Detail
  detailHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  detailNumber:      { fontSize: 24, fontWeight: 'bold' },
  detailDate:        { fontSize: 14 },
  currentStatus:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md },
  currentStatusText: { fontSize: 16, fontWeight: '600' },
  codigoRetiroBox:   { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: SPACING.lg },

  // ✅ Caja de peso en detalle
  pesoDetalleBox:   { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: SPACING.lg, gap: 6 },
  pesoDetalleTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },

  detailSection: { marginBottom: SPACING.lg },
  sectionTitle:  { fontSize: 12, fontWeight: '600', marginBottom: SPACING.sm, textTransform: 'uppercase' },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 6 },
  infoText:      { fontSize: 14, flex: 1 },
  totalSection:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.lg },
  totalLabel:    { fontSize: 16, fontWeight: '500' },
  totalValue:    { fontSize: 24, fontWeight: 'bold' },
  notesText:     { fontSize: 14, fontStyle: 'italic' },

  mainActionButton:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md },
  mainActionText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelOrderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },

  // ✅ Nuevos estilos para modal por items
  pesoHelperText:     { fontSize: 13, marginTop: 8, marginBottom: 12, textAlign: "center", fontStyle: "italic" },
  itemPesoCard:       { borderRadius: 12, borderWidth: 1.5, padding: 12, marginBottom: 10 },
  itemPesoHeader:     { flexDirection: "row", alignItems: "center" },
  itemPesoBadge:      { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  itemPesoNombre:     { fontSize: 15, fontWeight: "600" },
  itemPesoPrecioRef:  { fontSize: 11, marginTop: 2 },
  itemPesoInputRow:   { flexDirection: "row", marginTop: 4 },
  itemPesoResumen:    { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)" },
  totalPesoBox:       { borderRadius: 12, borderWidth: 1.5, padding: 12, marginTop: 12, gap: 4 },
  cancelOrderText:   { color: '#ef4444', fontSize: 14 },
});

export default OrdersScreen;