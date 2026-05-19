// src/hooks/usePedidosMonitor.js
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { AppState, Platform } from 'react-native';
import { orderService } from '../api/services';

const POLLING_INTERVAL = 15000;
const ESTADOS_ACTIVOS = ['confirmado', 'preparando', 'listo_para_recoger', 'en_camino'];

export const usePedidosMonitor = (enabled = true) => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [nuevoPedido, setNuevoPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const intervalRef = useRef(null);
  const previousPedidosRef = useRef([]);
  const previousCountRef = useRef(0);
  const appState = useRef(AppState.currentState);
  const isFirstLoad = useRef(true);

  const sendPedidoNotification = async (pedido) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🛒 ¡Nuevo Pedido!',
          body: `${pedido.cliente?.nombre || 'Cliente'} - Bs. ${pedido.total?.toFixed(2) || '0.00'}`,
          data: { type: 'new_order', pedidoId: pedido.id, screen: 'Orders' },
          sound: true,
          priority: 'high',
          ...(Platform.OS === 'android' && { channelId: 'orders' }),
        },
        trigger: null,
      });
    } catch (error) {
      if (__DEV__) console.warn('Error enviando notificación:', error?.message);
    }
  };

  const fetchPedidos = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await orderService.getRecibidos();

      if (response.success && Array.isArray(response.data)) {
        const pedidosData = response.data.map((p) => ({
          id: p.id,
          numero: `PED-${p.id}`,
          fecha: p.fecha_pedido
            ? new Date(p.fecha_pedido).toLocaleDateString('es-ES')
            : 'Sin fecha',
          fechaRaw: p.fecha_pedido,
          estado: p.estado || 'pendiente',
          total: Number(p.total) || 0,
          // ✅ Agregar código de retiro
          codigo_retiro: p.codigo_retiro || null,
          cliente: {
            id: p.consumidor_id || null,
            nombre: p.consumidor || 'Cliente',
            telefono: p.telefono || null,
            direccion: p.direccion || 'No especificada',
          },
          metodoEnvio: p.metodo_envio || 'Entrega a domicilio',
          notas: p.notas || null,
          items: Array.isArray(p.items) ? p.items : [],
        }));

        pedidosData.sort((a, b) => new Date(b.fechaRaw) - new Date(a.fechaRaw));

        const nuevosPendientes = pedidosData.filter(p => p.estado === 'pendiente');
        const pendientesAnteriores = previousPedidosRef.current.filter(p => p.estado === 'pendiente');

        if (!isFirstLoad.current) {
          const pedidosNuevos = nuevosPendientes.filter(
            nuevo => !pendientesAnteriores.some(anterior => anterior.id === nuevo.id)
          );
          for (const pedido of pedidosNuevos) {
            setNuevoPedido(pedido);
            await sendPedidoNotification(pedido);
          }
          if (pedidosNuevos.length > 1) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '📦 Múltiples Pedidos Nuevos',
                body: `Tienes ${pedidosNuevos.length} pedidos nuevos pendientes`,
                data: { type: 'multiple_orders', screen: 'Orders' },
                sound: true,
              },
              trigger: null,
            });
          }
        }

        previousPedidosRef.current = pedidosData;
        previousCountRef.current = nuevosPendientes.length;
        isFirstLoad.current = false;

        setPedidos(pedidosData);
        setPedidosPendientes(nuevosPendientes);
        setLastUpdate(new Date());
      }
    } catch (error) {
      if (__DEV__) console.warn('Error cargando pedidos:', error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchPedidos(true);
  }, [fetchPedidos]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    fetchPedidos(true);
    intervalRef.current = setInterval(() => fetchPedidos(false), POLLING_INTERVAL);
  }, [fetchPedidos]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const [isForeground, setIsForeground] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = nextAppState;
      if (nextAppState === 'active') {
        setIsForeground(true);
        if (wasBackground) fetchPedidos(false);
      } else {
        setIsForeground(false);
      }
    });
    return () => subscription.remove();
  }, [fetchPedidos]);

  useEffect(() => {
    if (enabled && isForeground) startPolling();
    else stopPolling();
    return () => stopPolling();
  }, [enabled, isForeground, startPolling, stopPolling]);

  const stats = {
    total:            pedidos.length,
    pendientes:       pedidos.filter(p => p.estado === 'pendiente').length,
    confirmados:      pedidos.filter(p => p.estado === 'confirmado').length,
    preparando:       pedidos.filter(p => p.estado === 'preparando').length,
    listoParaRecoger: pedidos.filter(p => p.estado === 'listo_para_recoger').length,
    enCamino:         pedidos.filter(p => p.estado === 'en_camino').length,
    entregados:       pedidos.filter(p => p.estado === 'entregado').length,
    cancelados:       pedidos.filter(p => p.estado === 'cancelado').length,
    activos:          pedidos.filter(p => ESTADOS_ACTIVOS.includes(p.estado)).length,
  };

  return { pedidos, pedidosPendientes, nuevoPedido, loading, lastUpdate, stats, refresh, startPolling, stopPolling };
};

export default usePedidosMonitor;
