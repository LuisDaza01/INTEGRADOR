const db = require('../../config/database');

class DispositivoRepository {
  async findAll() {
    return db.query(
      `SELECT d.id, d.codigo, d.notas, d.activo,
              d.asignado_a_laguna_id, d.fecha_asignacion, d.fecha_creacion,
              l.nombre        AS laguna_nombre,
              u.id            AS productor_id,
              u.nombre        AS productor_nombre,
              u.email         AS productor_email
       FROM dispositivos d
       LEFT JOIN lagunas  l ON l.id = d.asignado_a_laguna_id
       LEFT JOIN usuarios u ON u.id = l.productor_id
       ORDER BY d.fecha_creacion DESC`
    );
  }

  async findById(id) {
    const rows = await db.query(`SELECT * FROM dispositivos WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  async findByCodigo(codigo) {
    const rows = await db.query(`SELECT * FROM dispositivos WHERE codigo = $1`, [codigo]);
    return rows[0] || null;
  }

  async create({ codigo, notas }) {
    const rows = await db.query(
      `INSERT INTO dispositivos (codigo, notas)
       VALUES ($1, $2)
       RETURNING *`,
      [codigo, notas || null]
    );
    return rows[0];
  }

  async update(id, { notas, activo }) {
    const rows = await db.query(
      `UPDATE dispositivos
       SET notas  = COALESCE($2, notas),
           activo = COALESCE($3, activo)
       WHERE id = $1
       RETURNING *`,
      [id, notas ?? null, activo ?? null]
    );
    return rows[0] || null;
  }

  async marcarAsignado(id, lagunaId) {
    const rows = await db.query(
      `UPDATE dispositivos
       SET asignado_a_laguna_id = $2,
           fecha_asignacion     = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, lagunaId]
    );
    return rows[0] || null;
  }

  async liberar(id) {
    const rows = await db.query(
      `UPDATE dispositivos
       SET asignado_a_laguna_id = NULL,
           fecha_asignacion     = NULL
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return rows[0] || null;
  }

  async delete(id) {
    const rows = await db.query(
      `DELETE FROM dispositivos WHERE id = $1 RETURNING id`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = new DispositivoRepository();
