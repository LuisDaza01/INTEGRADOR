const db = require('../../config/database');

class NotificacionRepository {
  constructor() {
    this._init().catch(err =>
      console.error('[notificacion.repository] init error:', err.message)
    );
  }

  async _init() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id         SERIAL PRIMARY KEY,
        usuario_id INT  NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        titulo     VARCHAR(120) NOT NULL,
        mensaje    TEXT NOT NULL,
        tipo       VARCHAR(30) DEFAULT 'sistema',
        leida      BOOLEAN DEFAULT FALSE,
        data       JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    // Add created_at if table existed before this column was introduced
    await db.query(`
      ALTER TABLE notificaciones
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notif_usuario
        ON notificaciones(usuario_id, created_at DESC)
    `);
  }

  async crear({ usuario_id, titulo, mensaje, tipo = 'sistema', data = {} }) {
    const rows = await db.query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, usuario_id, titulo, mensaje, tipo, leida, data, created_at`,
      [usuario_id, titulo, mensaje, tipo, JSON.stringify(data)]
    );
    return rows[0];
  }

  async findByUsuario(usuarioId, limit = 30) {
    return await db.query(
      `SELECT id, usuario_id, titulo, mensaje, tipo, leida, data, created_at
       FROM notificaciones
       WHERE usuario_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [usuarioId, limit]
    );
  }

  async contarNoLeidas(usuarioId) {
    const rows = await db.query(
      `SELECT COUNT(*)::int AS total FROM notificaciones
       WHERE usuario_id = $1 AND leida = FALSE`,
      [usuarioId]
    );
    return rows[0]?.total ?? 0;
  }

  async marcarLeida(id, usuarioId) {
    const rows = await db.query(
      `UPDATE notificaciones SET leida = TRUE
       WHERE id = $1 AND usuario_id = $2
       RETURNING id, usuario_id, titulo, mensaje, tipo, leida, data, created_at`,
      [id, usuarioId]
    );
    return rows[0] ?? null;
  }

  async marcarTodasLeidas(usuarioId) {
    await db.query(
      `UPDATE notificaciones SET leida = TRUE
       WHERE usuario_id = $1 AND leida = FALSE`,
      [usuarioId]
    );
  }
}

module.exports = new NotificacionRepository();
