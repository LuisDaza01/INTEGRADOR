// src/modules/disponibilidad/disponibilidad.controller.js
const service = require('./disponibilidad.service');
const { successResponse, errorResponse, createdResponse } = require('../../utils/response');

// GET /api/productores/:id/calendario?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
const calendarioPublico = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return errorResponse(res, 'productorId inválido', 400);
    const dias = await service.calendarioPublico(id, req.query.desde, req.query.hasta);
    return successResponse(res, dias, 'Calendario obtenido');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

// ── Endpoints del productor autenticado (req.user.id) ────────────

// GET /api/disponibilidad/dias
const misDias = async (req, res) => {
  try {
    const dias = await service.listarDiasProductor(req.user.id);
    return successResponse(res, dias, 'Días obtenidos');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// PUT /api/disponibilidad/dias  body: { dia, hora_inicio, hora_fin, venta_directa, venta_cocinado }
const guardarDia = async (req, res) => {
  try {
    const dia = await service.configurarDia({
      productor_id: req.user.id,
      ...req.body,
    });
    return createdResponse(res, dia, 'Día configurado');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

// DELETE /api/disponibilidad/dias/:dia
const borrarDia = async (req, res) => {
  try {
    await service.desactivarDia(req.user.id, req.params.dia);
    return successResponse(res, null, 'Día desactivado');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

// GET /api/disponibilidad/excepciones?desde=&hasta=
const misExcepciones = async (req, res) => {
  try {
    // Reusamos el repo directamente para listar
    const repo = require('./disponibilidad.repository');
    const desde = req.query.desde || new Date().toISOString().slice(0,10);
    const hasta = req.query.hasta || desde;
    const data = await repo.findExcepciones(req.user.id, desde, hasta);
    return successResponse(res, data, 'Excepciones obtenidas');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// PUT /api/disponibilidad/excepciones  body: { fecha, tipo, capacidad_max?, motivo? }
const guardarExcepcion = async (req, res) => {
  try {
    const exc = await service.configurarExcepcion({
      productor_id: req.user.id,
      ...req.body,
    });
    return createdResponse(res, exc, 'Excepción configurada');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

// PUT /api/disponibilidad/excepciones/bulk
// body: { desde, hasta, tipo: 'bloqueado'|'disponible'|'limpiar', capacidad_max?, motivo? }
const guardarExcepcionesBulk = async (req, res) => {
  try {
    const data = await service.configurarExcepcionesBulk({
      productor_id: req.user.id,
      ...req.body,
    });
    return createdResponse(res, data, 'Rango aplicado');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

// DELETE /api/disponibilidad/excepciones/:fecha
const borrarExcepcion = async (req, res) => {
  try {
    await service.borrarExcepcion(req.user.id, req.params.fecha);
    return successResponse(res, null, 'Excepción eliminada');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  calendarioPublico,
  misDias, guardarDia, borrarDia,
  misExcepciones, guardarExcepcion, borrarExcepcion, guardarExcepcionesBulk,
};
