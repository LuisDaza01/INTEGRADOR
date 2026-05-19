// src/modules/repartidor/repartidor.service.js
const repartidorRepository = require('./repartidor.repository');
const { notificarEnCamino, notificarEntregado } = require('../../services/pushNotifications');
const { AppError } = require('../../utils/errors');

class RepartidorService {

  async guardarPushToken(usuarioId, token) {
    await repartidorRepository.savePushToken(usuarioId, token);
    return { success: true };
  }

  async getPedidosDisponibles(repartidorId) {
    return await repartidorRepository.findPedidosDisponibles(repartidorId);
  }

  async confirmarRecogida(pedidoId, codigoIngresado, repartidor) {
    const pedido = await repartidorRepository.findPedidoConConsumidor(pedidoId);
    if (!pedido) throw new AppError('Pedido no encontrado', 404);

    const codigoLimpio = codigoIngresado.toUpperCase().trim();
    if (pedido.codigo_retiro !== codigoLimpio)
      throw new AppError('Código de retiro incorrecto ❌', 400);

    if (pedido.repartidor_id && pedido.repartidor_id !== repartidor.id)
      throw new AppError('Este pedido ya fue tomado por otro conductor', 409);

    await repartidorRepository.asignarRepartidor(pedidoId, repartidor.id);

    notificarEnCamino(pedido.consumidor_push_token, pedidoId, repartidor.nombre)
      .catch(err => console.error('Push error:', err.message));

    return {
      success: true,
      message: '¡Código correcto! El consumidor fue notificado.',
      consumidor: pedido.consumidor_nombre,
    };
  }

  async confirmarEntrega(pedidoId, repartidorId) {
    const datos = await repartidorRepository.findPushTokenConsumidor(pedidoId);
    if (!datos) throw new AppError('Pedido no encontrado', 404);
    if (datos.repartidor_id !== repartidorId)
      throw new AppError('No eres el conductor asignado a este pedido', 403);

    await repartidorRepository.marcarEntregado(pedidoId);

    notificarEntregado(datos.expo_push_token, pedidoId)
      .catch(err => console.error('Push error:', err.message));

    return { success: true, message: 'Pedido marcado como entregado ✅' };
  }

  async getMisPedidos(repartidorId) {
    return await repartidorRepository.findMisPedidos(repartidorId);
  }

  async getTracking(pedidoId, consumidorId) {
    const pedido = await repartidorRepository.findTracking(pedidoId, consumidorId);
    if (!pedido) throw new AppError('Pedido no encontrado', 404);
    return pedido;
  }

  async actualizarUbicacion(pedidoId, lat, lng) {
    await repartidorRepository.actualizarUbicacion(pedidoId, lat, lng);
  }

  async calificarRepartidor(pedidoId, consumidorId, estrellas, comentario) {
    if (!estrellas || estrellas < 1 || estrellas > 5)
      throw new AppError('Las estrellas deben ser entre 1 y 5', 400);
    const result = await repartidorRepository.calificar(pedidoId, consumidorId, estrellas, comentario);
    if (!result)
      throw new AppError('No se pudo calificar. El pedido debe estar entregado, pertenecer al consumidor y no haber sido calificado antes.', 400);
    return { success: true };
  }

  async getCalificacionesRepartidor(repartidorId) {
    return await repartidorRepository.getCalificacionesRepartidor(repartidorId);
  }
}

module.exports = new RepartidorService();