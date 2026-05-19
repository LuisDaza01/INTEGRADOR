// src/screens/consumer/MisPedidosScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Image, RefreshControl, ActivityIndicator,
  Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { io } from 'socket.io-client';
import api from '../../api/axios.config';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../constants/config';

// ── Countdown para esperando_confirmacion ─────────────────────
const TIMER_TOTAL_SEG = 30 * 60; // 30 minutos

const useCountdown = (expiresAt) => {
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const notifEnviada = useRef(false);

  useEffect(() => {
    if (!expiresAt) return;
    notifEnviada.current = false;

    const calcular = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000));
      setSegundosRestantes(diff);
    };

    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Notificación local cuando quedan exactamente 5 minutos
  useEffect(() => {
    if (segundosRestantes <= 300 && segundosRestantes > 0 && !notifEnviada.current) {
      notifEnviada.current = true;
      Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ ¡Quedan 5 minutos!',
          body: 'Confirma tu pedido antes de que se cancele automáticamente.',
          sound: true,
        },
        trigger: null,
      }).catch(() => {}); // silenciar si no hay permisos
    }
  }, [segundosRestantes]);

  const minutos  = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const expirado = segundosRestantes === 0 && !!expiresAt;
  // porcentaje de tiempo consumido (0 = inicio, 1 = expirado)
  const progreso = expiresAt
    ? Math.min(1, 1 - segundosRestantes / TIMER_TOTAL_SEG)
    : 0;

  // 3 niveles de urgencia
  const nivel = expirado          ? 'expirado'
              : segundosRestantes < 300  ? 'critico'   // < 5 min → rojo
              : segundosRestantes < 900  ? 'urgente'   // < 15 min → naranja
              :                            'normal';   // verde

  return { minutos, segundos, expirado, segundosRestantes, progreso, nivel };
};

// ── Card de confirmación de precio (esperando_confirmacion) ───
const NIVEL_COLORS = {
  normal:   { border: '#22C55E', bg: '#F0FDF4', text: '#16A34A', track: '#22C55E' },
  urgente:  { border: '#F97316', bg: '#FEF3C7', text: '#D97706', track: '#F97316' },
  critico:  { border: '#EF4444', bg: '#FEF2F2', text: '#DC2626', track: '#EF4444' },
  expirado: { border: '#EF4444', bg: '#FEF2F2', text: '#DC2626', track: '#EF4444' },
};

const CardConfirmarPrecio = ({ order, onConfirmar, onRechazar, cargando }) => {
  const { colors: themeColors, isDarkMode } = useTheme();
  const { minutos, segundos, expirado, progreso, nivel } = useCountdown(order.confirmacion_expires_at);
  const col = NIVEL_COLORS[nivel];

  const cardStyles = StyleSheet.create({
    confirmCard:    { borderRadius: 12, borderWidth: 2, padding: 14, gap: 10, backgroundColor: themeColors.surface },
    confirmHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    confirmTitle:   { fontSize: 15, fontWeight: '700' },
    pesoResumen:    { gap: 6 },
    pesoRow:        { flexDirection: 'row', justifyContent: 'space-between' },
    pesoLabel:      { fontSize: 13, color: themeColors.textSecondary },
    pesoVal:        { fontSize: 13, fontWeight: '600', color: themeColors.text },
    pesoTotalRow:   { borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: 8, marginTop: 4 },
    pesoTotalLabel: { fontSize: 15, fontWeight: '700', color: themeColors.text },
    pesoTotalVal:   { fontSize: 20, fontWeight: '800', color: '#16A34A' },
    timerBarWrap:   { marginBottom: 6 },
    timerBarTrack:  { height: 6, backgroundColor: themeColors.border, borderRadius: 3, overflow: 'hidden' },
    timerBarFill:   { height: 6, borderRadius: 3 },
    countdownBox:   { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },
    countdownText:  { fontSize: 13, fontWeight: '600', flex: 1 },
    confirmButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
    rechazarBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EF4444' },
    rechazarText:   { color: '#EF4444', fontWeight: '600' },
    aceptarBtn:     { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: '#22C55E' },
    aceptarText:    { color: '#fff', fontWeight: '700' },
  });

  return (
    <View style={[cardStyles.confirmCard, { borderColor: col.border }]}>
      {/* Header */}
      <View style={cardStyles.confirmHeader}>
        <Ionicons
          name={expirado ? 'close-circle' : nivel === 'critico' ? 'warning' : 'scale-outline'}
          size={22}
          color={col.text}
        />
        <Text style={[cardStyles.confirmTitle, { color: col.text }]}>
          {expirado
            ? 'Tiempo expirado'
            : nivel === 'critico'
              ? '🚨 ¡Confirma ahora!'
              : '⚖️ ¡Tu pedido fue pesado!'}
        </Text>
      </View>

      {/* Detalles del peso */}
      <View style={cardStyles.pesoResumen}>
        <View style={cardStyles.pesoRow}>
          <Text style={cardStyles.pesoLabel}>Pescados pesados:</Text>
          <Text style={cardStyles.pesoVal}>{order.cantidad_pescados} unidades</Text>
        </View>
        <View style={cardStyles.pesoRow}>
          <Text style={cardStyles.pesoLabel}>Peso total:</Text>
          <Text style={cardStyles.pesoVal}>{order.peso_real_kg} kg</Text>
        </View>
        <View style={cardStyles.pesoRow}>
          <Text style={cardStyles.pesoLabel}>Precio por kg:</Text>
          <Text style={cardStyles.pesoVal}>Bs. 35/kg</Text>
        </View>
        <View style={[cardStyles.pesoRow, cardStyles.pesoTotalRow]}>
          <Text style={cardStyles.pesoTotalLabel}>💰 Total a pagar:</Text>
          <Text style={cardStyles.pesoTotalVal}>
            Bs. {parseFloat(order.precio_final || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Barra de tiempo restante */}
      {!expirado && (
        <View style={cardStyles.timerBarWrap}>
          <View style={cardStyles.timerBarTrack}>
            <View style={[
              cardStyles.timerBarFill,
              { width: `${(1 - progreso) * 100}%`, backgroundColor: col.track }
            ]} />
          </View>
        </View>
      )}

      {/* Countdown */}
      <View style={[cardStyles.countdownBox, { backgroundColor: col.bg }]}>
        <Ionicons
          name={expirado ? 'close-circle-outline' : 'time-outline'}
          size={16}
          color={col.text}
        />
        {expirado ? (
          <Text style={[cardStyles.countdownText, { color: col.text }]}>
            El tiempo expiró — pedido cancelado automáticamente
          </Text>
        ) : (
          <Text style={[cardStyles.countdownText, { color: col.text }]}>
            {nivel === 'critico' ? '🚨 ' : ''}
            Tienes {minutos}:{segundos.toString().padStart(2, '0')} min para confirmar o cancelar
          </Text>
        )}
      </View>

      {/* Botones */}
      {!expirado && (
        <View style={cardStyles.confirmButtons}>
          <TouchableOpacity
            style={[cardStyles.rechazarBtn, cargando && { opacity: 0.5 }]}
            onPress={onRechazar}
            disabled={cargando}
          >
            <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
            <Text style={cardStyles.rechazarText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[cardStyles.aceptarBtn, { backgroundColor: col.track }, cargando && { opacity: 0.5 }]}
            onPress={onConfirmar}
            disabled={cargando}
          >
            {cargando
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={cardStyles.aceptarText}>Confirmar y pagar</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const SOCKET_URL = API_BASE_URL.replace('/api', '');

// ── Componente principal ──────────────────────────────────────
const MisPedidosScreen = ({ navigation }) => {
  const [orders,          setOrders]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]       = useState(false);
  const [searchQuery,     setSearchQuery]      = useState('');
  const [statusFilter,    setStatusFilter]     = useState('todos');
  const [expandedOrder,   setExpandedOrder]    = useState(null);
  const [showFilterModal, setShowFilterModal]  = useState(false);
  const [cargandoAccion,  setCargandoAccion]   = useState(null);
  const [ratingModal,     setRatingModal]      = useState(null); // { pedidoId }
  const [ratingEstrellas, setRatingEstrellas]  = useState(0);
  const [ratingComentario,setRatingComentario] = useState('');
  const [ratingLoading,   setRatingLoading]    = useState(false);
  const socketRef = useRef(null);

  const { colors, isDarkMode } = useTheme();
  const { token } = useAuth();
  const styles = makeStyles(colors, isDarkMode);

  const statusOptions = [
    { value: 'todos',                  label: 'Todos'                  },
    { value: 'pendiente',              label: 'Pendiente'              },
    { value: 'confirmado',             label: 'Confirmado'             },
    { value: 'preparando',             label: 'Preparando'             },
    { value: 'esperando_confirmacion', label: 'Esperando confirmación' },
    { value: 'listo_para_recoger',     label: 'Listo para recoger'     },
    { value: 'en_camino',              label: 'En camino'              },
    { value: 'entregado',              label: 'Entregado'              },
    { value: 'cancelado',              label: 'Cancelado'              },
    { value: 'cancelado_por_tiempo',   label: 'Cancelado por tiempo'   },
  ];

  const fetchPedidos = useCallback(async () => {
    try {
      const response = await api.get('/pedidos');
      const data = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      const pedidosMapeados = data.map((pedido) => ({
        id:     `PED-${pedido.id}`,
        rawId:  pedido.id,
        date:   new Date(pedido.fecha_pedido).toLocaleDateString('es-BO'),
        status: pedido.estado,
        total:  parseFloat(pedido.total || 0),
        // ✅ Campos nuevos del flujo de peso
        cantidad_pescados:       pedido.cantidad_pescados       || null,
        peso_real_kg:            pedido.peso_real_kg            || null,
        precio_final:            pedido.precio_final            || null,
        confirmacion_expires_at: pedido.confirmacion_expires_at || null,
        productor_qr_pago_url:   pedido.items?.[0]?.productor_qr_pago_url || null,
        productor_nombre:        pedido.items?.[0]?.productor_nombre || null,
        items: Array.isArray(pedido.items)
          ? pedido.items.map((item) => ({
              id:       item.producto_id,
              name:     item.nombre || 'Producto',
              quantity: item.cantidad,
              price:    parseFloat(item.precio_unitario || 0),
              image:    item.imagen || null,
            }))
          : [],
        shipping: {
          method:  pedido.metodo_envio || 'Entrega a domicilio',
          address: pedido.direccion    || 'Ver detalles',
          cost:    parseFloat(pedido.costo_envio || 5.0),
        },
      }));

      // Poner primero los que necesitan acción del consumidor
      pedidosMapeados.sort((a, b) => {
        if (a.status === 'esperando_confirmacion') return -1;
        if (b.status === 'esperando_confirmacion') return 1;
        return 0;
      });

      setOrders(pedidosMapeados);
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 30000);
    return () => clearInterval(interval);
  }, [fetchPedidos]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnectionDelay: 500,
    });
    socket.on('pedido_actualizado', ({ id, estado }) => {
      setOrders(prev => prev.map(o => o.rawId === id ? { ...o, status: estado } : o));
    });
    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPedidos();
  };

  // ✅ Consumidor acepta el precio pesado → ir a pantalla de pago QR
  const handleConfirmarPrecio = async (rawId) => {
    const pedido = orders.find(o => o.rawId === rawId);
    if (!pedido) return;
    navigation.navigate('PagoQR', {
      pedidoIdExistente: rawId,
      total: parseFloat(pedido.precio_final || pedido.total || 0),
      qrPagoUrl: pedido.productor_qr_pago_url,
      productorNombre: pedido.productor_nombre || 'el productor',
    });
  };

  // ✅ Consumidor rechaza el precio pesado
  const handleRechazarPrecio = (rawId, precioFinal) => {
    Alert.alert(
      'Rechazar precio',
      `¿Seguro que deseas rechazar el precio de Bs. ${parseFloat(precioFinal || 0).toFixed(2)}? El pedido será cancelado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, rechazar',
          style: 'destructive',
          onPress: async () => {
            setCargandoAccion(rawId);
            try {
              await api.post(`/pedidos/${rawId}/rechazar-precio`);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert('Pedido cancelado', 'El pedido fue cancelado por rechazo de precio.');
              fetchPedidos();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'No se pudo rechazar el precio');
            } finally {
              setCargandoAccion(null);
            }
          },
        },
      ]
    );
  };

  const handleEnviarCalificacion = async () => {
    if (!ratingEstrellas) return Alert.alert('Selecciona una puntuación', 'Elige entre 1 y 5 estrellas.');
    setRatingLoading(true);
    try {
      await api.post(`/repartidor/pedidos/${ratingModal.pedidoId}/calificar`, {
        estrellas: ratingEstrellas,
        comentario: ratingComentario.trim() || undefined,
      });
      Alert.alert('¡Gracias!', 'Tu calificación fue enviada.');
      setRatingModal(null);
      setRatingEstrellas(0);
      setRatingComentario('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo enviar la calificación');
    } finally {
      setRatingLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'todos' && order.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return order.id.toLowerCase().includes(query) ||
             order.items.some((item) => item.name.toLowerCase().includes(query));
    }
    return true;
  });

  const getStatusStyle = (status) => ({
    entregado:              { bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-circle'  },
    en_camino:              { bg: '#DBEAFE', text: '#1E40AF', icon: 'bicycle'           },
    listo_para_recoger:     { bg: '#EDE9FE', text: '#5B21B6', icon: 'bag-check'        },
    confirmado:             { bg: '#EDE9FE', text: '#5B21B6', icon: 'cube'             },
    preparando:             { bg: '#EDE9FE', text: '#5B21B6', icon: 'construct'        },
    // ✅ Estados nuevos
    pesado:                 { bg: '#E0F2FE', text: '#0369A1', icon: 'scale'            },
    esperando_confirmacion: { bg: '#FEF3C7', text: '#92400E', icon: 'hourglass'        },
    pendiente:              { bg: '#FEF3C7', text: '#92400E', icon: 'time'             },
    cancelado:              { bg: '#FEE2E2', text: '#991B1B', icon: 'close-circle'     },
    cancelado_por_tiempo:   { bg: '#FEE2E2', text: '#991B1B', icon: 'hourglass'        },
  }[status] || { bg: '#F3F4F6', text: '#374151', icon: 'document-text' });

  const puedeVerTracking = (status) =>
    ['confirmado', 'preparando', 'pesado', 'esperando_confirmacion', 'listo_para_recoger', 'en_camino'].includes(status);

  const puedeCalificar = (status) => status === 'entregado';

  const renderOrderCard = (order) => {
    const statusStyle = getStatusStyle(order.status);
    const isExpanded  = expandedOrder === order.id;
    const necesitaConfirmar = order.status === 'esperando_confirmacion';

    return (
      <View key={order.id} style={[
        styles.orderCard,
        necesitaConfirmar && styles.orderCardUrgente,
      ]}>
        {/* Header */}
        <TouchableOpacity
          style={styles.orderHeader}
          onPress={() => setExpandedOrder(isExpanded ? null : order.id)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusIconContainer, { backgroundColor: statusStyle.bg }]}>
              <Ionicons name={statusStyle.icon} size={20} color={statusStyle.text} />
            </View>
            <View>
              <Text style={styles.orderId}>{order.id}</Text>
              <Text style={styles.orderDate}>{order.date}</Text>
            </View>
          </View>
          <View style={styles.orderHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {order.status.replace(/_/g, ' ')}
              </Text>
            </View>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* ✅ Card especial para confirmar precio */}
        {necesitaConfirmar && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
            <CardConfirmarPrecio
              order={order}
              onConfirmar={() => handleConfirmarPrecio(order.rawId)}
              onRechazar={() => handleRechazarPrecio(order.rawId, order.precio_final)}
              cargando={cargandoAccion === order.rawId}
            />
          </View>
        )}

        {/* Botón tracking */}
        {puedeVerTracking(order.status) && (
          <TouchableOpacity
            style={styles.trackingButton}
            onPress={() => navigation.navigate('TrackingPedido', { pedidoId: order.rawId })}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={16} color="#fff" />
            <Text style={styles.trackingButtonText}>
              {order.status === 'en_camino' ? '🚴 Ver en tiempo real' : 'Seguir pedido'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Botón calificar repartidor */}
        {puedeCalificar(order.status) && (
          <TouchableOpacity
            style={styles.calificarButton}
            onPress={() => { setRatingModal({ pedidoId: order.rawId }); setRatingEstrellas(0); setRatingComentario(''); }}
            activeOpacity={0.8}
          >
            <Ionicons name="star-outline" size={16} color="#eab308" />
            <Text style={styles.calificarButtonText}>Calificar repartidor</Text>
          </TouchableOpacity>
        )}

        {/* Items preview */}
        <View style={styles.itemsPreview}>
          {order.items.slice(0, 2).map((item, idx) => (
            <View key={idx} style={styles.itemPreviewRow}>
              <Text style={styles.itemPreviewText} numberOfLines={1}>
                {item.quantity}x {item.name}
              </Text>
              <Text style={styles.itemPreviewPrice}>
                Bs {(item.quantity * item.price).toFixed(2)}
              </Text>
            </View>
          ))}
          {order.items.length > 2 && (
            <Text style={styles.moreItems}>+{order.items.length - 2} más</Text>
          )}
        </View>

        {/* Footer total — muestra precio_final si está disponible */}
        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            Bs {parseFloat(order.precio_final || order.total || 0).toFixed(2)}
            {order.precio_final && order.precio_final !== order.total && (
              <Text style={{ fontSize: 11, color: colors.textSecondary }}> (pesado)</Text>
            )}
          </Text>
        </View>

        {/* Detalles expandidos */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />

            {/* ✅ Sección de peso si hay datos */}
            {order.peso_real_kg && (
              <>
                <Text style={styles.sectionTitle}>⚖️ Detalle del peso</Text>
                <View style={styles.pesoExpandido}>
                  <View style={styles.pesoExpandidoRow}>
                    <Text style={styles.pesoExpandidoLabel}>Cantidad pesada:</Text>
                    <Text style={styles.pesoExpandidoVal}>{order.cantidad_pescados} pescados</Text>
                  </View>
                  <View style={styles.pesoExpandidoRow}>
                    <Text style={styles.pesoExpandidoLabel}>Peso total:</Text>
                    <Text style={styles.pesoExpandidoVal}>{order.peso_real_kg} kg</Text>
                  </View>
                  <View style={styles.pesoExpandidoRow}>
                    <Text style={[styles.pesoExpandidoLabel, { fontWeight: '700' }]}>Precio final:</Text>
                    <Text style={[styles.pesoExpandidoVal, { fontWeight: '700', color: '#16A34A' }]}>
                      Bs. {parseFloat(order.precio_final || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <Text style={styles.sectionTitle}>Productos</Text>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemDetailRow}>
                <Image
                  source={{ uri: item.image || 'https://via.placeholder.com/60' }}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>{item.quantity} x Bs {item.price.toFixed(2)}</Text>
                </View>
                <Text style={styles.itemTotal}>Bs {(item.quantity * item.price).toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>Bs {(order.total - order.shipping.cost).toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Envío</Text>
                <Text style={styles.summaryValue}>Bs {order.shipping.cost.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>
                  Bs {parseFloat(order.precio_final || order.total).toFixed(2)}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Información de envío</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="car-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.infoText}>{order.shipping.method}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.infoText}>{order.shipping.address}</Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="document-text-outline" size={18} color="#3B82F6" />
                <Text style={styles.actionButtonText}>Ver factura</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={18} color="#3B82F6" />
                <Text style={styles.actionButtonText}>Soporte</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </View>
    );
  }

  // Cuántos pedidos necesitan acción del consumidor
  const pendientesConfirmar = orders.filter(o => o.status === 'esperando_confirmacion').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Pedidos</Text>
          <Text style={styles.headerSubtitle}>
            {pendientesConfirmar > 0
              ? `⚠️ ${pendientesConfirmar} pedido(s) esperan tu confirmación`
              : 'Historial y seguimiento de tus compras'}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar pedidos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="filter" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {statusFilter !== 'todos' && (
        <View style={styles.activeFilter}>
          <Text style={styles.activeFilterText}>
            Filtro: {statusOptions.find((s) => s.value === statusFilter)?.label}
          </Text>
          <TouchableOpacity onPress={() => setStatusFilter('todos')}>
            <Ionicons name="close" size={18} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.ordersList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No se encontraron pedidos</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || statusFilter !== 'todos'
                ? 'Intenta con otros filtros'
                : 'Aún no has realizado ningún pedido'}
            </Text>
            {(searchQuery || statusFilter !== 'todos') && (
              <TouchableOpacity style={styles.clearFiltersButton}
                onPress={() => { setSearchQuery(''); setStatusFilter('todos'); }}>
                <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={showFilterModal} transparent animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por estado</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {statusOptions.map((option) => (
              <TouchableOpacity key={option.value}
                style={[styles.filterOption, statusFilter === option.value && styles.filterOptionActive]}
                onPress={() => { setStatusFilter(option.value); setShowFilterModal(false); }}>
                <Text style={[styles.filterOptionText, statusFilter === option.value && styles.filterOptionTextActive]}>
                  {option.label}
                </Text>
                {statusFilter === option.value && <Ionicons name="checkmark" size={20} color="#3B82F6" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Modal calificación repartidor */}
      <Modal visible={!!ratingModal} transparent animationType="slide" onRequestClose={() => setRatingModal(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 }}>
              Califica al repartidor
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
              ¿Cómo fue la entrega de tu pedido?
            </Text>
            {/* Estrellas */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRatingEstrellas(n)}>
                  <Ionicons
                    name={n <= ratingEstrellas ? 'star' : 'star-outline'}
                    size={36}
                    color={n <= ratingEstrellas ? '#eab308' : colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {/* Comentario */}
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, backgroundColor: colors.background, minHeight: 80, textAlignVertical: 'top', fontSize: 14, marginBottom: 16 }}
              placeholder="Comentario opcional..."
              placeholderTextColor={colors.textSecondary}
              value={ratingComentario}
              onChangeText={setRatingComentario}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                onPress={() => setRatingModal(null)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#eab308', alignItems: 'center' }}
                onPress={handleEnviarCalificacion}
                disabled={ratingLoading}
              >
                {ratingLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '700' }}>Enviar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const makeStyles = (colors, isDarkMode) => StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText:      { marginTop: 12, fontSize: 16, color: colors.textSecondary },
  header:           { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle:      { fontSize: 24, fontWeight: 'bold', color: colors.text },
  headerSubtitle:   { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

  searchContainer:      { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 12 },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  searchInput:          { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 15, color: colors.text },
  filterButton:         { width: 48, height: 48, backgroundColor: colors.surface, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },

  activeFilter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDarkMode ? 'rgba(59,130,246,0.15)' : '#EFF6FF', marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 8 },
  activeFilterText: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },

  ordersList: { flex: 1, paddingHorizontal: 16 },
  orderCard:  { backgroundColor: colors.surface, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, overflow: 'hidden' },
  // ✅ Card urgente destacada
  orderCardUrgente: { borderWidth: 2, borderColor: '#F97316', shadowColor: '#F97316', shadowOpacity: 0.2, elevation: 6 },

  orderHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  orderHeaderLeft:   { flexDirection: 'row', alignItems: 'center' },
  statusIconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  orderId:           { fontSize: 15, fontWeight: '600', color: colors.text },
  orderDate:         { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  orderHeaderRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText:        { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

  // ✅ Card confirmar precio (fallback entries — rendered via cardStyles in CardConfirmarPrecio)
  confirmCard:    { borderRadius: 12, borderWidth: 2, padding: 14, gap: 10, backgroundColor: colors.surface },
  confirmHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmTitle:   { fontSize: 15, fontWeight: '700' },
  pesoResumen:    { gap: 6 },
  pesoRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  pesoLabel:      { fontSize: 13, color: colors.textSecondary },
  pesoVal:        { fontSize: 13, fontWeight: '600', color: colors.text },
  pesoTotalRow:   { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  pesoTotalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  pesoTotalVal:   { fontSize: 20, fontWeight: '800', color: '#16A34A' },
  timerBarWrap:   { marginBottom: 6 },
  timerBarTrack:  { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  timerBarFill:   { height: 6, borderRadius: 3 },
  countdownBox:   { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },
  countdownText:  { fontSize: 13, fontWeight: '600', flex: 1 },
  confirmButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rechazarBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EF4444' },
  rechazarText:   { color: '#EF4444', fontWeight: '600' },
  aceptarBtn:     { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: '#22C55E' },
  aceptarText:    { color: '#fff', fontWeight: '700' },

  calificarButton:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginHorizontal: 12, marginBottom: 6, borderRadius: 10, backgroundColor: '#fef9c3', borderWidth: 1, borderColor: '#fde047' },
  calificarButtonText: { color: '#854d0e', fontWeight: '600', fontSize: 13 },
  trackingButton:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', marginHorizontal: 14, marginBottom: 10, paddingVertical: 10, borderRadius: 10, gap: 6 },
  trackingButtonText:  { color: '#fff', fontSize: 14, fontWeight: '600' },

  itemsPreview:    { paddingHorizontal: 14, paddingBottom: 10 },
  itemPreviewRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemPreviewText: { fontSize: 13, color: colors.textSecondary, flex: 1, marginRight: 8 },
  itemPreviewPrice:{ fontSize: 13, color: colors.textSecondary },
  moreItems:       { fontSize: 12, color: '#3B82F6', marginTop: 4 },

  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.card, backgroundColor: colors.card },
  totalLabel:  { fontSize: 14, fontWeight: '600', color: colors.text },
  totalValue:  { fontSize: 16, fontWeight: 'bold', color: colors.text },

  expandedSection: { paddingHorizontal: 14, paddingBottom: 14 },
  divider:         { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  sectionTitle:    { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12, marginTop: 8 },

  // ✅ Peso expandido
  pesoExpandido:     { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, marginBottom: 14, gap: 6 },
  pesoExpandidoRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  pesoExpandidoLabel:{ fontSize: 13, color: colors.text },
  pesoExpandidoVal:  { fontSize: 13, color: colors.text },

  itemDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemImage:     { width: 50, height: 50, borderRadius: 8, backgroundColor: colors.card },
  itemInfo:      { flex: 1, marginLeft: 12 },
  itemName:      { fontSize: 14, fontWeight: '500', color: colors.text },
  itemQuantity:  { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  itemTotal:     { fontSize: 14, fontWeight: '600', color: colors.text },

  summarySection:    { backgroundColor: colors.background, borderRadius: 10, padding: 14, marginTop: 8 },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel:      { fontSize: 14, color: colors.textSecondary },
  summaryValue:      { fontSize: 14, color: colors.text },
  summaryTotal:      { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  summaryTotalValue: { fontSize: 16, fontWeight: 'bold', color: colors.text },

  infoCard: { backgroundColor: colors.background, borderRadius: 10, padding: 14 },
  infoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 14, color: colors.text, marginLeft: 10, flex: 1 },

  actionsContainer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionButton:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: isDarkMode ? 'rgba(59,130,246,0.15)' : '#EFF6FF', paddingVertical: 12, borderRadius: 10, gap: 6 },
  actionButtonText: { fontSize: 14, fontWeight: '500', color: '#3B82F6' },

  emptyContainer:    { alignItems: 'center', paddingVertical: 48 },
  emptyTitle:        { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
  emptySubtitle:     { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  clearFiltersButton:{ backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  clearFiltersText:  { color: '#fff', fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:   { fontSize: 18, fontWeight: '600', color: colors.text },
  filterOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.card },
  filterOptionActive:    { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.15)' : '#EFF6FF' },
  filterOptionText:      { fontSize: 15, color: colors.text },
  filterOptionTextActive:{ color: '#3B82F6', fontWeight: '500' },
});

export default MisPedidosScreen;