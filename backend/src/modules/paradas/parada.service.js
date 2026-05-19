// src/modules/paradas/parada.service.js
const paradaRepository = require('./parada.repository');
const { AppError } = require('../../utils/errors');

class ParadaService {
  async getAll() {
    return await paradaRepository.findAll();
  }

  async getById(id) {
    const parada = await paradaRepository.findById(id);
    if (!parada) throw new AppError('Parada no encontrada', 404);
    return parada;
  }

  async create(nombre, descripcion, lat, lng) {
    if (!nombre || !lat || !lng) throw new AppError('nombre, lat y lng son requeridos', 400);
    return await paradaRepository.create(nombre, descripcion, lat, lng);
  }

  async update(id, nombre, descripcion, lat, lng, activa) {
    const parada = await paradaRepository.findById(id);
    if (!parada) throw new AppError('Parada no encontrada', 404);
    return await paradaRepository.update(id, nombre, descripcion, lat, lng, activa ?? parada.activa);
  }

  async delete(id) {
    const parada = await paradaRepository.findById(id);
    if (!parada) throw new AppError('Parada no encontrada', 404);
    await paradaRepository.delete(id);
  }
}

module.exports = new ParadaService();
