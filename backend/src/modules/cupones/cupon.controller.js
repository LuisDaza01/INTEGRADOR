// src/modules/cupones/cupon.controller.js
const repo = require('./cupon.repository');
const { successResponse, errorResponse, createdResponse } = require('../../utils/response');

// POST /api/cupones/validar  { codigo, subtotal }
const validar = async (req, res) => {
  try {
    const { codigo, subtotal = 0 } = req.body;
    if (!codigo) return errorResponse(res, 'Código requerido', 400);

    const cupon = await repo.findByCodigo(codigo);
    if (!cupon || !cupon.activo) return errorResponse(res, 'Cupón no válido o inactivo', 404);
    if (cupon.fecha_expiracion && new Date() > new Date(cupon.fecha_expiracion))
      return errorResponse(res, 'El cupón ha expirado', 400);
    if (cupon.usos_maximos !== null && cupon.usos_actuales >= cupon.usos_maximos)
      return errorResponse(res, 'El cupón ha alcanzado su límite de usos', 400);
    if (parseFloat(subtotal) < parseFloat(cupon.monto_minimo))
      return errorResponse(res, `Compra mínima de Bs ${cupon.monto_minimo} requerida`, 400);

    const descuento = cupon.tipo === 'porcentaje'
      ? (parseFloat(subtotal) * parseFloat(cupon.valor)) / 100
      : Math.min(parseFloat(cupon.valor), parseFloat(subtotal));

    return successResponse(res, {
      cupon: {
        id: cupon.id, codigo: cupon.codigo, tipo: cupon.tipo,
        valor: cupon.valor, descripcion: cupon.descripcion,
      },
      descuento: parseFloat(descuento.toFixed(2)),
      total:     parseFloat((parseFloat(subtotal) - descuento).toFixed(2)),
    }, 'Cupón válido');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/cupones
const listar = async (req, res) => {
  try {
    const cupones = await repo.findAll();
    return successResponse(res, { cupones }, 'Cupones obtenidos');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// POST /api/cupones
const crear = async (req, res) => {
  try {
    const cupon = await repo.create(req.body);
    return createdResponse(res, { cupon }, 'Cupón creado');
  } catch (err) {
    if (err.message?.includes('unique') || err.code === '23505')
      return errorResponse(res, 'Ya existe un cupón con ese código', 409);
    return errorResponse(res, err.message, 500);
  }
};

// DELETE /api/cupones/:id
const eliminar = async (req, res) => {
  try {
    await repo.remove(req.params.id);
    return successResponse(res, null, 'Cupón eliminado');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// POST /api/cupones/:id/usar  (internal — increment usage after order is placed)
const usar = async (req, res) => {
  try {
    await repo.incrementUso(req.params.id);
    return successResponse(res, null, 'Uso registrado');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { validar, listar, crear, eliminar, usar };
