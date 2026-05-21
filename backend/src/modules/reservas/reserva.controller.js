// src/modules/reservas/reserva.controller.js
const service = require('./reserva.service');
const { successResponse, errorResponse, createdResponse } = require('../../utils/response');

// POST /api/reservas
const crear = async (req, res) => {
  try {
    if (req.user.rol !== 'consumidor') {
      return errorResponse(res, 'Solo consumidores pueden crear reservas', 403);
    }
    const reserva = await service.crear({
      consumidor_id: req.user.id,
      productor_id:  req.body.productor_id,
      producto_id:   req.body.producto_id,
      cantidad:      req.body.cantidad,
      items:         req.body.items,        // [{ producto_id, modo, cantidad, peso_solicitado_kg }]
      fecha_reserva: req.body.fecha_reserva,
      hora_reserva:  req.body.hora_reserva,
      es_cocinado:   req.body.es_cocinado,
      notas:         req.body.notas,
    });
    return createdResponse(res, reserva, 'Reserva creada');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

// GET /api/reservas  (lista las del usuario según su rol)
const listar = async (req, res) => {
  try {
    const data = req.query.estado
      ? await service.listarPorEstado(req.user, req.query.estado)
      : await service.listarMisReservas(req.user);
    return successResponse(res, data, 'Reservas obtenidas');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/reservas/:id
const detalle = async (req, res) => {
  try {
    const r = await service.detalle(parseInt(req.params.id, 10), req.user);
    return successResponse(res, r, 'Reserva obtenida');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

// PATCH /api/reservas/:id/aceptar
const aceptar = async (req, res) => {
  try {
    const r = await service.aceptar(parseInt(req.params.id, 10), req.user.id);
    return successResponse(res, r, 'Reserva aceptada');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

// PATCH /api/reservas/:id/rechazar  body: { motivo? }
const rechazar = async (req, res) => {
  try {
    const r = await service.rechazar(parseInt(req.params.id, 10), req.user.id, req.body.motivo);
    return successResponse(res, r, 'Reserva rechazada');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

// PATCH /api/reservas/:id/cancelar  (solo consumidor dueño)
const cancelar = async (req, res) => {
  try {
    const r = await service.cancelar(parseInt(req.params.id, 10), req.user.id);
    return successResponse(res, r, 'Reserva cancelada');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

module.exports = { crear, listar, detalle, aceptar, rechazar, cancelar };
