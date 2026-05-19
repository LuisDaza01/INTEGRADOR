// src/modules/paradas/parada.repository.js
const db = require('../../config/database');

class ParadaRepository {
  async findAll() {
    return await db.query(
      `SELECT id, nombre, descripcion, lat, lng, activa
       FROM paradas
       WHERE activa = true
       ORDER BY id ASC`
    );
  }

  async findById(id) {
    const result = await db.query(
      `SELECT id, nombre, descripcion, lat, lng, activa
       FROM paradas WHERE id = $1`,
      [id]
    );
    return result[0] || null;
  }

  async create(nombre, descripcion, lat, lng) {
    const result = await db.query(
      `INSERT INTO paradas (nombre, descripcion, lat, lng)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nombre, descripcion, lat, lng]
    );
    return result[0];
  }

  async update(id, nombre, descripcion, lat, lng, activa) {
    const result = await db.query(
      `UPDATE paradas
       SET nombre = $1, descripcion = $2, lat = $3, lng = $4, activa = $5
       WHERE id = $6
       RETURNING *`,
      [nombre, descripcion, lat, lng, activa, id]
    );
    return result[0] || null;
  }

  async delete(id) {
    await db.query(
      `UPDATE paradas SET activa = false WHERE id = $1`,
      [id]
    );
  }
}

module.exports = new ParadaRepository();
