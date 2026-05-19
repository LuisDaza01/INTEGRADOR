// src/modules/cupones/cupon.repository.js
const db = require('../../config/database');

// Ensure the table exists (idempotent)
const ensureTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS cupones (
      id               SERIAL PRIMARY KEY,
      codigo           VARCHAR(50) UNIQUE NOT NULL,
      tipo             VARCHAR(20) NOT NULL CHECK (tipo IN ('porcentaje', 'monto')),
      valor            NUMERIC(10,2) NOT NULL,
      monto_minimo     NUMERIC(10,2) DEFAULT 0,
      usos_maximos     INT DEFAULT NULL,
      usos_actuales    INT DEFAULT 0,
      activo           BOOLEAN DEFAULT TRUE,
      fecha_expiracion TIMESTAMP DEFAULT NULL,
      descripcion      TEXT,
      created_at       TIMESTAMP DEFAULT NOW()
    )
  `);
};

const findByCodigo = async (codigo) => {
  await ensureTable();
  const rows = await db.query(
    `SELECT * FROM cupones WHERE codigo = $1`,
    [codigo.toUpperCase().trim()]
  );
  return rows[0] || null;
};

const create = async ({ codigo, tipo, valor, monto_minimo = 0, usos_maximos = null, fecha_expiracion = null, descripcion = '' }) => {
  await ensureTable();
  const rows = await db.query(
    `INSERT INTO cupones (codigo, tipo, valor, monto_minimo, usos_maximos, fecha_expiracion, descripcion)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [codigo.toUpperCase().trim(), tipo, valor, monto_minimo, usos_maximos, fecha_expiracion, descripcion]
  );
  return rows[0];
};

const findAll = async () => {
  await ensureTable();
  return db.query(`SELECT * FROM cupones ORDER BY created_at DESC`);
};

const incrementUso = async (id) => {
  await db.query(`UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1`, [id]);
};

const remove = async (id) => {
  await db.query(`DELETE FROM cupones WHERE id = $1`, [id]);
};

const deactivate = async (id) => {
  await db.query(`UPDATE cupones SET activo = FALSE WHERE id = $1`, [id]);
};

module.exports = { findByCodigo, create, findAll, incrementUso, remove, deactivate };
