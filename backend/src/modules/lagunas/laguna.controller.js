const lagunaService = require('./laguna.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { successResponse, createdResponse, deletedResponse } = require('../../utils/response');
const logger = require('../../utils/logger');

// GET /api/lagunas
const getMisLagunas = asyncHandler(async (req, res) => {
  const lagunas = await lagunaService.getMisLagunas(req.user.id);
  successResponse(res, lagunas);
});

// GET /api/lagunas/:id
const getLagunaDetalle = asyncHandler(async (req, res) => {
  const laguna = await lagunaService.getLagunaDetalle(req.params.id, req.user.id);
  successResponse(res, laguna);
});

// POST /api/lagunas
const crearLaguna = asyncHandler(async (req, res) => {
  const laguna = await lagunaService.crearLaguna(req.body, req.user.id);
  logger.logEvent?.('laguna_creada', { lagunaId: laguna.id, productorId: req.user.id });
  createdResponse(res, laguna, 'Laguna creada exitosamente');
});

// PUT /api/lagunas/:id
const actualizarLaguna = asyncHandler(async (req, res) => {
  const laguna = await lagunaService.actualizarLaguna(req.params.id, req.body, req.user.id);
  successResponse(res, laguna, 'Laguna actualizada');
});

// DELETE /api/lagunas/:id
const eliminarLaguna = asyncHandler(async (req, res) => {
  await lagunaService.eliminarLaguna(req.params.id, req.user.id);
  deletedResponse(res, 'Laguna eliminada');
});

// POST /api/lagunas/:id/siembras
const iniciarSiembra = asyncHandler(async (req, res) => {
  const siembra = await lagunaService.iniciarSiembra(req.params.id, req.body, req.user.id);
  logger.logEvent?.('siembra_iniciada', { siembraId: siembra.id, lagunaId: req.params.id });
  createdResponse(res, siembra, 'Siembra iniciada exitosamente');
});

// POST /api/lagunas/:id/cosechar
const cosechar = asyncHandler(async (req, res) => {
  const result = await lagunaService.cosechar(req.params.id, req.body, req.user.id);
  successResponse(res, result, result.message);
});

// POST /api/lagunas/:id/movimientos
const registrarMovimiento = asyncHandler(async (req, res) => {
  const mov = await lagunaService.registrarMovimiento(req.params.id, req.body, req.user.id);
  createdResponse(res, mov, 'Movimiento registrado');
});

// GET /api/lagunas/:id/movimientos
const getMovimientos = asyncHandler(async (req, res) => {
  const limit  = parseInt(req.query.limit)  || 30;
  const offset = parseInt(req.query.offset) || 0;
  const movs = await lagunaService.getMovimientos(req.params.id, req.user.id, limit, offset);
  successResponse(res, movs);
});

// GET /api/lagunas/:id/historial
const getHistorial = asyncHandler(async (req, res) => {
  const historial = await lagunaService.getHistorial(req.params.id, req.user.id);
  successResponse(res, historial);
});

// PUT /api/lagunas/:id/dispositivo — vincula o cambia el código del sensor IoT
const vincularDispositivo = asyncHandler(async (req, res) => {
  const { codigo } = req.body;
  const laguna = await lagunaService.vincularDispositivo(req.params.id, codigo, req.user.id);
  successResponse(res, laguna, 'Dispositivo vinculado correctamente');
});

// GET /api/lagunas/especies
const getEspecies = asyncHandler(async (req, res) => {
  const especies = await lagunaService.getEspecies(req.user.id);
  successResponse(res, especies);
});

// POST /api/lagunas/especies
const crearEspecie = asyncHandler(async (req, res) => {
  const especie = await lagunaService.crearEspecie(req.body, req.user.id);
  createdResponse(res, especie, 'Especie creada');
});

// GET /api/lagunas/alimento/tipos
const getTiposAlimento = asyncHandler(async (req, res) => {
  const tipos = await lagunaService.getTiposAlimento();
  successResponse(res, tipos);
});

// GET /api/lagunas/alimento/stock
const getStockAlimento = asyncHandler(async (req, res) => {
  const stock = await lagunaService.getStockAlimento(req.user.id);
  successResponse(res, stock);
});

// POST /api/lagunas/alimento/compra
const registrarCompraAlimento = asyncHandler(async (req, res) => {
  const result = await lagunaService.registrarCompraAlimento(req.user.id, req.body);
  createdResponse(res, result, 'Compra de alimento registrada');
});

module.exports = {
  getMisLagunas,
  getLagunaDetalle,
  crearLaguna,
  actualizarLaguna,
  eliminarLaguna,
  iniciarSiembra,
  cosechar,
  registrarMovimiento,
  getMovimientos,
  getHistorial,
  getEspecies,
  crearEspecie,
  getTiposAlimento,
  getStockAlimento,
  registrarCompraAlimento,
  vincularDispositivo,
};
