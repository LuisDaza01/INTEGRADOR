// src/modules/repartidor/repartidor.controller.js
const repartidorService = require('./repartidor.service');
const { emitUbicacionConductor } = require('../../socket/chat.socket');

class RepartidorController {

  // POST /api/repartidor/push-token
  guardarPushToken = async (req, res, next) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: 'Token requerido' });
      const result = await repartidorService.guardarPushToken(req.user.id, token);
      res.json(result);
    } catch (error) { next(error); }
  };

  // GET /api/repartidor/pedidos-disponibles
  getPedidosDisponibles = async (req, res, next) => {
    try {
      const pedidos = await repartidorService.getPedidosDisponibles(req.user.id);
      res.json(pedidos);
    } catch (error) { next(error); }
  };

  // POST /api/repartidor/pedidos/:id/recoger
  confirmarRecogida = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { codigo_retiro } = req.body;
      if (!codigo_retiro) return res.status(400).json({ error: 'El código de retiro es requerido' });
      const result = await repartidorService.confirmarRecogida(parseInt(id), codigo_retiro, req.user);
      res.json(result);
    } catch (error) { next(error); }
  };

  // POST /api/repartidor/pedidos/:id/entregar
  confirmarEntrega = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await repartidorService.confirmarEntrega(parseInt(id), req.user.id);
      res.json(result);
    } catch (error) { next(error); }
  };

  // GET /api/repartidor/mis-pedidos
  getMisPedidos = async (req, res, next) => {
    try {
      const pedidos = await repartidorService.getMisPedidos(req.user.id);
      res.json(pedidos);
    } catch (error) { next(error); }
  };

  // GET /api/pedidos/:id/tracking (consumidor)
  getTracking = async (req, res, next) => {
    try {
      const { id } = req.params;
      const pedido = await repartidorService.getTracking(parseInt(id), req.user.id);
      res.json(pedido);
    } catch (error) { next(error); }
  };

  // POST /api/repartidor/pedidos/:id/ubicacion
  actualizarUbicacion = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { lat, lng } = req.body;
      if (!lat || !lng) return res.status(400).json({ error: 'lat y lng son requeridos' });
      await repartidorService.actualizarUbicacion(parseInt(id), lat, lng);
      emitUbicacionConductor(parseInt(id), lat, lng);
      res.json({ success: true });
    } catch (error) { next(error); }
  };

  // POST /api/repartidor/pedidos/:id/calificar  (consumidor)
  calificar = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { estrellas, comentario } = req.body;
      const result = await repartidorService.calificarRepartidor(parseInt(id), req.user.id, parseInt(estrellas), comentario);
      res.json(result);
    } catch (error) { next(error); }
  };

  // GET /api/repartidor/calificaciones  (el propio repartidor ve su promedio)
  misCalificaciones = async (req, res, next) => {
    try {
      const result = await repartidorService.getCalificacionesRepartidor(req.user.id);
      res.json(result);
    } catch (error) { next(error); }
  };
}

module.exports = new RepartidorController();