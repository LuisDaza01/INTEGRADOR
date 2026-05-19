// src/modules/inventario/inventario.controller.js
const service = require('./inventario.service');
const { successResponse, errorResponse, createdResponse } = require('../../utils/response');

// POST /api/inventario/movimientos
// body: { producto_id, tipo, cantidad, descripcion? }
const registrar = async (req, res) => {
  try {
    const { producto_id, tipo, cantidad, descripcion } = req.body;
    if (!producto_id || !tipo || cantidad == null) {
      return errorResponse(res, 'producto_id, tipo y cantidad son requeridos', 400);
    }
    const resultado = await service.registrarManual({
      productor_id: req.user.id,
      producto_id:  parseInt(producto_id, 10),
      tipo,
      cantidad:     parseFloat(cantidad),
      descripcion,
    });
    return createdResponse(res, resultado, 'Movimiento registrado');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

// GET /api/inventario/productos/:id/historial
const historialProducto = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit, 10)  || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const movs   = await service.historialPorProducto(parseInt(req.params.id, 10), { limit, offset });
    return successResponse(res, movs, 'Historial obtenido');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/inventario/historial — del productor autenticado
const historialProductor = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit, 10)  || 100;
    const offset = parseInt(req.query.offset, 10) || 0;
    const tipo   = req.query.tipo || null;
    const movs = await service.historialPorProductor(req.user.id, { limit, offset, tipo });
    return successResponse(res, movs, 'Historial obtenido');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/inventario/stock — resumen del productor autenticado
const stockProductor = async (req, res) => {
  try {
    const data = await service.resumenProductor(req.user.id);
    return successResponse(res, data, 'Stock obtenido');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { registrar, historialProducto, historialProductor, stockProductor };
