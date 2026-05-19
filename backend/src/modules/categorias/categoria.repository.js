// categoria.repository.js - Capa de acceso a datos para Categorías
const db = require("../../config/database");

class CategoriaRepository {
  async findAll() {
    const query = `
      SELECT id, nombre, descripcion, icono
      FROM categorias
      ORDER BY nombre
    `;
    return await db.query(query);
  }

  async findById(categoriaId) {
    const query = `
      SELECT id, nombre, descripcion, icono
      FROM categorias
      WHERE id = $1
    `;
    const result = await db.query(query, [categoriaId]);
    return result[0] || null;
  }

  async findByNombre(nombre) {
    const query = `
      SELECT id, nombre, descripcion, icono
      FROM categorias
      WHERE LOWER(nombre) = LOWER($1)
    `;
    const result = await db.query(query, [nombre]);
    return result[0] || null;
  }

  async create(categoriaData) {
    const query = `
      INSERT INTO categorias (nombre, descripcion, icono)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [
      categoriaData.nombre,
      categoriaData.descripcion || null,
      categoriaData.icono || null,
    ]);
    return result[0];
  }

  async update(categoriaId, categoriaData) {
    const query = `
      UPDATE categorias
      SET nombre = $1, descripcion = $2, icono = $3
      WHERE id = $4
      RETURNING *
    `;
    const result = await db.query(query, [
      categoriaData.nombre,
      categoriaData.descripcion || null,
      categoriaData.icono || null,
      categoriaId,
    ]);
    return result[0] || null;
  }

  async delete(categoriaId) {
    const query = `
      DELETE FROM categorias WHERE id = $1 RETURNING *
    `;
    const result = await db.query(query, [categoriaId]);
    return result[0] || null;
  }

  async contarProductos(categoriaId) {
    const query = `
      SELECT COUNT(*) as total
      FROM productos
      WHERE categoria_id = $1 AND disponible = TRUE
    `;
    const result = await db.query(query, [categoriaId]);
    return parseInt(result[0].total);
  }

  async findAllWithCount() {
    const query = `
      SELECT 
        c.id, c.nombre, c.descripcion, c.icono,
        COUNT(p.id) as total_productos
      FROM categorias c
      LEFT JOIN productos p ON c.id = p.categoria_id AND p.disponible = TRUE
      GROUP BY c.id
      ORDER BY c.nombre
    `;
    return await db.query(query);
  }
}

module.exports = new CategoriaRepository();