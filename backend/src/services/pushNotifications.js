// backend/src/services/pushNotifications.js
// Lazy + safe loader: si expo-server-sdk falla al cargar (p.ej. runtime sin global `File`
// en Node < 20), el resto del backend sigue corriendo y solo se desactiva el push.
let Expo = null;
let sdkLoadFailed = false;

const getExpo = () => {
  if (sdkLoadFailed) return null;
  if (Expo) return new Expo();
  try {
    // require síncrono envuelto: un fallo aquí NO escapa a unhandledRejection
    Expo = require('expo-server-sdk').Expo;
    return new Expo();
  } catch (err) {
    sdkLoadFailed = true;
    console.error('❌ No se pudo cargar expo-server-sdk — push notifications desactivadas:', err.message);
    return null;
  }
};

// ✅ Enviar notificación genérica
// data.channelId (opcional) sobrescribe el canal Android: 'alerts' | 'orders' | 'default'.
// Alertas críticas (sensores) deben usar 'alerts' (MAX importance + bypass DND).
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken) {
    console.log('⚠️ Push token ausente');
    return;
  }
  try {
    const expo = getExpo();
    if (!expo) return; // SDK no disponible → silenciar sin romper el flujo
    if (!Expo.isExpoPushToken(pushToken)) {
      console.log('⚠️ Push token inválido:', pushToken);
      return;
    }
    const channelId = data.channelId || 'orders';
    const message = {
      to: pushToken, sound: 'default',
      title, body, data, priority: 'high', channelId,
    };
    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      console.log('📬 Push enviado:', tickets);
    }
  } catch (error) {
    console.error('❌ Error enviando push:', error.message);
  }
};

// ── Notificaciones específicas ────────────────────────────────

const notificarEnCamino = async (pushToken, pedidoId, nombreConductor, eta) => {
  let mensaje = `${nombreConductor || 'El conductor'} está llevando tu pedido #${pedidoId}`;
  if (eta instanceof Date && !Number.isNaN(eta.getTime())) {
    const hora = eta.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    mensaje = `${nombreConductor || 'El conductor'} ya salió con tu pedido — llega aprox. a las ${hora}`;
  }
  await sendPushNotification(
    pushToken,
    '🚐 Tu pedido está en camino',
    mensaje,
    { type: 'en_camino', pedidoId, eta: eta instanceof Date ? eta.toISOString() : null, screen: 'TrackingPedido' }
  );
};

const notificarEntregado = async (pushToken, pedidoId) => {
  await sendPushNotification(
    pushToken,
    '✅ ¡Pedido entregado!',
    `Tu pedido #${pedidoId} fue entregado exitosamente`,
    { type: 'entregado', pedidoId, screen: 'MisPedidos' }
  );
};

const notificarNuevoPedido = async (pushToken, pedidoId, clienteNombre, total) => {
  await sendPushNotification(
    pushToken,
    '🛒 ¡Nuevo Pedido!',
    `${clienteNombre} realizó un pedido de Bs. ${total}`,
    { type: 'nuevo_pedido', pedidoId, screen: 'Orders' }
  );
};

const notificarConfirmado = async (pushToken, pedidoId) => {
  await sendPushNotification(
    pushToken,
    '✅ Pedido confirmado',
    `Tu pedido #${pedidoId} fue confirmado por el productor`,
    { type: 'confirmado', pedidoId, screen: 'MisPedidos' }
  );
};

// ✅ NUEVO: Notificar al consumidor que el productor pesó su pedido
const notificarPesado = async (pushToken, pedidoId, cantidadPescados, pesoKg, precioFinal, minutosConfirmacion) => {
  await sendPushNotification(
    pushToken,
    '⚖️ ¡Tu pedido fue pesado!',
    `${cantidadPescados} pescado(s) → ${pesoKg} kg → Bs. ${precioFinal}. Tienes ${minutosConfirmacion} min para confirmar.`,
    {
      type: 'pesado',
      pedidoId,
      cantidadPescados,
      pesoKg,
      precioFinal,
      screen: 'MisPedidos',
    }
  );
};

// ✅ NUEVO: Notificar al consumidor que su confirmación expiró
const notificarPrecioExpirado = async (pushToken, pedidoId) => {
  await sendPushNotification(
    pushToken,
    '⏰ Pedido cancelado por tiempo',
    `Tu pedido #${pedidoId} fue cancelado porque no confirmaste el precio a tiempo.`,
    { type: 'expirado', pedidoId, screen: 'MisPedidos' }
  );
};

// ── Reservas ──────────────────────────────────────────────────

const notificarNuevaReserva = async (pushToken, reservaId, consumidorNombre, cantidad, productoNombre, fechaReserva) => {
  await sendPushNotification(
    pushToken,
    '📅 Nueva reserva',
    `${consumidorNombre} reservó ${cantidad} × ${productoNombre || 'producto'} para el ${fechaReserva}`,
    { type: 'reserva_nueva', reservaId, screen: 'ReservasProductor' }
  );
};

const notificarReservaAceptada = async (pushToken, reservaId, productorNombre, fechaReserva) => {
  await sendPushNotification(
    pushToken,
    '✅ Reserva aceptada',
    `${productorNombre || 'El productor'} confirmó tu reserva para el ${fechaReserva}`,
    { type: 'reserva_aceptada', reservaId, screen: 'MisReservas' }
  );
};

const notificarReservaRechazada = async (pushToken, reservaId, motivo) => {
  await sendPushNotification(
    pushToken,
    '❌ Reserva rechazada',
    motivo
      ? `Tu reserva fue rechazada: ${motivo}`
      : 'Tu reserva fue rechazada por el productor.',
    { type: 'reserva_rechazada', reservaId, screen: 'MisReservas' }
  );
};

const notificarReservaExpirada = async (pushToken, reservaId) => {
  await sendPushNotification(
    pushToken,
    '⏰ Reserva expirada',
    'El productor no respondió a tiempo y tu reserva expiró.',
    { type: 'reserva_expirada', reservaId, screen: 'MisReservas' }
  );
};

module.exports = {
  sendPushNotification,
  notificarEnCamino,
  notificarEntregado,
  notificarNuevoPedido,
  notificarConfirmado,
  notificarPesado,
  notificarPrecioExpirado,
  notificarNuevaReserva,
  notificarReservaAceptada,
  notificarReservaRechazada,
  notificarReservaExpirada,
};