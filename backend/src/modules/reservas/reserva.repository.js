// src/modules/reservas/reserva.repository.js
const db = require('../../config/database');

const ESTADOS = ['pendiente', 'aceptada', 'rechazada', 'expirada', 'cancelada'];
// Tiempo por defecto que tiene el productor para aceptar/rechazar
const HORAS_VIGENCIA_DEFAULT = 24;

// Código de reserva tipo BoA: NP- + 5 caracteres (sin 0/O/1/I para evitar confusión)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generarCodigoReserva = () => {
  let s = '';
  for (let i = 0; i < 5; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `NP-${s}`;
};

class ReservaRepository {

  async create({
    consumidor_id, productor_id, producto_id, cantidad,
    fecha_reserva, hora_reserva, es_cocinado, notas,
    precio_estimado, expires_at, codigo,
  }) {
    const rows = await db.query(
      `INSERT INTO reservas (
         consumidor_id, productor_id, producto_id, cantidad,
         fecha_reserva, hora_reserva, es_cocinado, notas,
         precio_estimado, expires_at, codigo, estado
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pendiente')
       RETURNING *`,
      [consumidor_id, productor_id, producto_id || null, cantidad,
       fecha_reserva, hora_reserva || null, !!es_cocinado, notas || null,
       precio_estimado || null, expires_at, codigo || null]
    );
    return rows[0];
  }

  // Genera un código único (reintenta ante colisión)
  async generarCodigoUnico(tx = null) {
    const q = tx || db;
    let codigo = generarCodigoReserva();
    for (let i = 0; i < 6; i++) {
      const exists = await q.query(`SELECT id FROM reservas WHERE codigo = $1`, [codigo]);
      if (exists.length === 0) return codigo;
      codigo = generarCodigoReserva();
    }
    return codigo;
  }

  // Crea una reserva multi-ítem (cabecera + reserva_items) en una transacción
  async createConItems({
    consumidor_id, productor_id, fecha_reserva, hora_reserva,
    es_cocinado, notas, precio_estimado, expires_at, items,
  }) {
    return db.transaction(async (tx) => {
      const codigo = await this.generarCodigoUnico(tx);
      const resRows = await tx.query(
        `INSERT INTO reservas (
           consumidor_id, productor_id, producto_id, cantidad,
           fecha_reserva, hora_reserva, es_cocinado, notas,
           precio_estimado, expires_at, codigo, estado
         ) VALUES ($1,$2,NULL,NULL,$3,$4,$5,$6,$7,$8,$9,'pendiente')
         RETURNING *`,
        [consumidor_id, productor_id, fecha_reserva, hora_reserva || null,
         !!es_cocinado, notas || null, precio_estimado || null, expires_at, codigo]
      );
      const reserva = resRows[0];
      for (const it of items) {
        await tx.query(
          `INSERT INTO reserva_items
             (reserva_id, producto_id, modo, cantidad, peso_solicitado_kg, precio_estimado)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [reserva.id, it.producto_id, it.modo || 'cantidad',
           it.cantidad || 0, it.peso_solicitado_kg || null, it.precio_estimado || null]
        );
      }
      return reserva;
    });
  }

  // Ítems de una reserva (con datos del producto)
  async getItems(reservaId) {
    return db.query(
      `SELECT ri.*, p.nombre AS producto_nombre, p.imagen AS producto_imagen, p.precio AS producto_precio
       FROM reserva_items ri
       JOIN productos p ON p.id = ri.producto_id
       WHERE ri.reserva_id = $1
       ORDER BY ri.id`,
      [reservaId]
    );
  }

  // Ítems de varias reservas (batch, evita N+1)
  async getItemsForReservas(ids) {
    if (!ids || ids.length === 0) return [];
    return db.query(
      `SELECT ri.*, p.nombre AS producto_nombre, p.imagen AS producto_imagen, p.precio AS producto_precio
       FROM reserva_items ri
       JOIN productos p ON p.id = ri.producto_id
       WHERE ri.reserva_id = ANY($1::int[])
       ORDER BY ri.id`,
      [ids]
    );
  }

  async findById(id) {
    const rows = await db.query(
      `SELECT r.*,
              p.nombre AS producto_nombre, p.precio AS producto_precio, p.imagen AS producto_imagen,
              uc.nombre AS consumidor_nombre, uc.telefono AS consumidor_telefono,
              up.nombre AS productor_nombre,
              ped.id    AS pedido_id,
              ped.estado AS pedido_estado,
              ped.codigo_retiro AS pedido_codigo_retiro,
              ped.total AS pedido_total
       FROM reservas r
       LEFT JOIN productos p  ON p.id  = r.producto_id
       JOIN usuarios uc       ON uc.id = r.consumidor_id
       JOIN usuarios up       ON up.id = r.productor_id
       LEFT JOIN pedidos ped  ON ped.reserva_id = r.id
       WHERE r.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByConsumidor(consumidorId, { estado = null, limit = 50 } = {}) {
    const params = [consumidorId];
    let where = 'r.consumidor_id = $1';
    if (estado) { params.push(estado); where += ` AND r.estado = $${params.length}`; }
    params.push(limit);
    return db.query(
      `SELECT r.*,
              p.nombre AS producto_nombre, p.imagen AS producto_imagen, p.precio AS producto_precio,
              up.nombre AS productor_nombre,
              ped.id    AS pedido_id,
              ped.estado AS pedido_estado,
              ped.codigo_retiro AS pedido_codigo_retiro,
              ped.total AS pedido_total
       FROM reservas r
       LEFT JOIN productos p ON p.id = r.producto_id
       JOIN usuarios up      ON up.id = r.productor_id
       LEFT JOIN pedidos ped ON ped.reserva_id = r.id
       WHERE ${where}
       ORDER BY r.fecha_creacion DESC
       LIMIT $${params.length}`,
      params
    );
  }

  async findByProductor(productorId, { estado = null, limit = 50 } = {}) {
    const params = [productorId];
    let where = 'r.productor_id = $1';
    if (estado) { params.push(estado); where += ` AND r.estado = $${params.length}`; }
    params.push(limit);
    return db.query(
      `SELECT r.*,
              p.nombre AS producto_nombre, p.imagen AS producto_imagen, p.precio AS producto_precio,
              uc.nombre AS consumidor_nombre, uc.telefono AS consumidor_telefono,
              ped.id    AS pedido_id,
              ped.estado AS pedido_estado,
              ped.codigo_retiro AS pedido_codigo_retiro
       FROM reservas r
       LEFT JOIN productos p ON p.id = r.producto_id
       JOIN usuarios uc      ON uc.id = r.consumidor_id
       LEFT JOIN pedidos ped ON ped.reserva_id = r.id
       WHERE ${where}
       ORDER BY r.fecha_creacion DESC
       LIMIT $${params.length}`,
      params
    );
  }

  // Transición de estado con lock + validación de owner
  async transicionar({ id, productor_id, nuevoEstado, motivo_rechazo, tx }) {
    const run = async (tx) => {
      const lock = await tx.query(
        `SELECT id, productor_id, estado, expires_at
         FROM reservas WHERE id = $1 FOR UPDATE`,
        [id]
      );
      if (lock.length === 0) return null;
      const r = lock[0];
      if (r.productor_id !== productor_id) return { error: 'no_owner' };
      if (r.estado !== 'pendiente')         return { error: 'estado_invalido', estado: r.estado };

      const sets = [];
      const params = [];
      let i = 1;
      sets.push(`estado = $${i++}`); params.push(nuevoEstado);
      if (nuevoEstado === 'aceptada') { sets.push(`fecha_aceptacion = NOW()`); }
      if (nuevoEstado === 'rechazada') {
        sets.push(`fecha_rechazo = NOW()`);
        sets.push(`motivo_rechazo = $${i++}`); params.push(motivo_rechazo || null);
      }
      params.push(id);

      const rows = await tx.query(
        `UPDATE reservas SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
        params
      );
      return { ok: true, reserva: rows[0] };
    };
    return tx ? run(tx) : db.transaction(run);
  }

  async cancelarPorConsumidor(id, consumidorId) {
    return db.transaction(async (tx) => {
      const lock = await tx.query(
        `SELECT id, consumidor_id, estado FROM reservas WHERE id = $1 FOR UPDATE`,
        [id]
      );
      if (lock.length === 0) return null;
      if (lock[0].consumidor_id !== consumidorId) return { error: 'no_owner' };
      // Sólo se puede cancelar mientras está pendiente. Una vez aceptada, ya existe
      // un pedido vinculado (pedidos.reserva_id) y el consumidor debe cancelarlo
      // desde el flujo del pedido, no desde la reserva.
      if (lock[0].estado !== 'pendiente') {
        return { error: 'estado_invalido', estado: lock[0].estado };
      }
      const rows = await tx.query(
        `UPDATE reservas SET estado = 'cancelada' WHERE id = $1 RETURNING *`,
        [id]
      );
      return { ok: true, reserva: rows[0] };
    });
  }

  // Auto-expirar reservas pendientes vencidas
  async expirarVencidas() {
    return db.query(`
      UPDATE reservas
      SET estado = 'expirada'
      WHERE estado = 'pendiente'
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
      RETURNING id, productor_id, consumidor_id
    `);
  }
}

module.exports = new ReservaRepository();
module.exports.ESTADOS = ESTADOS;
module.exports.HORAS_VIGENCIA_DEFAULT = HORAS_VIGENCIA_DEFAULT;
module.exports.generarCodigoReserva = generarCodigoReserva;
