// src/modules/paradas/parada.controller.js
const paradaService = require('./parada.service');

class ParadaController {
  // GET /api/paradas
  getAll = async (req, res, next) => {
    try {
      const paradas = await paradaService.getAll();
      res.json({ success: true, data: paradas });
    } catch (error) { next(error); }
  };

  // GET /api/paradas/:id
  getById = async (req, res, next) => {
    try {
      const parada = await paradaService.getById(parseInt(req.params.id));
      res.json({ success: true, data: parada });
    } catch (error) { next(error); }
  };

  // POST /api/paradas (solo admin)
  create = async (req, res, next) => {
    try {
      const { nombre, descripcion, lat, lng } = req.body;
      const parada = await paradaService.create(nombre, descripcion, lat, lng);
      res.status(201).json({ success: true, data: parada });
    } catch (error) { next(error); }
  };

  // PUT /api/paradas/:id (solo admin)
  update = async (req, res, next) => {
    try {
      const { nombre, descripcion, lat, lng, activa } = req.body;
      const parada = await paradaService.update(parseInt(req.params.id), nombre, descripcion, lat, lng, activa);
      res.json({ success: true, data: parada });
    } catch (error) { next(error); }
  };

  // DELETE /api/paradas/:id (solo admin)
  delete = async (req, res, next) => {
    try {
      await paradaService.delete(parseInt(req.params.id));
      res.json({ success: true, message: 'Parada desactivada' });
    } catch (error) { next(error); }
  };
}

module.exports = new ParadaController();
