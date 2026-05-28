const dispositivoService = require('./dispositivo.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { successResponse, createdResponse, deletedResponse } = require('../../utils/response');

const listar = asyncHandler(async (req, res) => {
  const items = await dispositivoService.listar();
  successResponse(res, items);
});

const crear = asyncHandler(async (req, res) => {
  const disp = await dispositivoService.crear(req.body);
  createdResponse(res, disp, 'Dispositivo creado');
});

const actualizar = asyncHandler(async (req, res) => {
  const disp = await dispositivoService.actualizar(req.params.id, req.body);
  successResponse(res, disp, 'Dispositivo actualizado');
});

const liberar = asyncHandler(async (req, res) => {
  const disp = await dispositivoService.liberar(req.params.id);
  successResponse(res, disp, 'Dispositivo liberado');
});

const eliminar = asyncHandler(async (req, res) => {
  await dispositivoService.eliminar(req.params.id);
  deletedResponse(res, 'Dispositivo eliminado');
});

module.exports = { listar, crear, actualizar, liberar, eliminar };
