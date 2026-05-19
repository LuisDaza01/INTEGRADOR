// usuario.repository.js
const { query } = require('../../config/database');

const findById = async (id) => {
  const result = await query(
    `SELECT id, rol_id, nombre, email, telefono, direccion, foto_perfil,
            nombre_empresa, descripcion, ubicacion, activo
     FROM usuarios WHERE id = $1`,
    [id]
  );
  return result[0] || null;
};

const update = async (id, data) => {
  const result = await query(
    `UPDATE usuarios SET
      nombre = COALESCE($1, nombre),
      telefono = COALESCE($2, telefono),
      direccion = COALESCE($3, direccion),
      updated_at = NOW()
     WHERE id = $4 RETURNING id, nombre, email, telefono, direccion`,
    [data.nombre, data.telefono, data.direccion, id]
  );
  return result[0] || null;
};

const findAll = async () => {
  return await query(
    `SELECT id, rol_id, nombre, email, telefono, nombre_empresa, activo, fecha_registro
     FROM usuarios
     ORDER BY rol_id ASC, nombre ASC`
  );
};

const setActivo = async (id, activo) => {
  const result = await query(
    `UPDATE usuarios SET activo = $1, updated_at = NOW()
     WHERE id = $2 RETURNING id, nombre, email, activo`,
    [activo, id]
  );
  return result[0] || null;
};

const adminUpdate = async (id, data) => {
  const bcrypt = require('bcryptjs');
  let passwordUpdate = '';
  const params = [data.nombre, data.email, data.telefono || null, parseInt(data.rol_id), id];

  if (data.password) {
    const hash = await bcrypt.hash(data.password, 10);
    passwordUpdate = ', password = $6';
    params.splice(4, 0, hash);
  }

  const result = await query(
    `UPDATE usuarios SET nombre=$1, email=$2, telefono=$3, rol_id=$4${passwordUpdate}, updated_at=NOW()
     WHERE id=$${params.length} RETURNING id, nombre, email, rol_id, telefono`,
    params
  );
  return result[0] || null;
};

const deleteById = async (id) => {
  // 1. Eliminar detalles de pedidos donde el usuario es consumidor
  const pedidosConsumidor = await query('SELECT id FROM pedidos WHERE consumidor_id = $1', [id]);
  for (const p of pedidosConsumidor) {
    await query('DELETE FROM detalles_pedido WHERE pedido_id = $1', [p.id]);
  }
  // 2. Eliminar pedidos donde es consumidor
  await query('DELETE FROM pedidos WHERE consumidor_id = $1', [id]);

  // 3. Eliminar detalles de pedidos que referencian productos de este productor
  const productos = await query('SELECT id FROM productos WHERE productor_id = $1', [id]);
  for (const prod of productos) {
    await query('DELETE FROM detalles_pedido WHERE producto_id = $1', [prod.id]);
  }

  // 4. Eliminar pedidos que usan métodos de pago del usuario (ya sin detalles)
  const metodosPago = await query('SELECT id FROM metodos_pago WHERE usuario_id = $1', [id]);
  for (const mp of metodosPago) {
    await query('DELETE FROM pedidos WHERE metodo_pago_id = $1', [mp.id]);
  }

  // 5. Eliminar pedidos que usan direcciones del usuario
  const direcciones = await query('SELECT id FROM direcciones WHERE usuario_id = $1', [id]);
  for (const dir of direcciones) {
    await query('DELETE FROM pedidos WHERE direccion_id = $1', [dir.id]);
  }

  // 6. Ahora sí eliminar métodos de pago y direcciones
  await query('DELETE FROM metodos_pago WHERE usuario_id = $1', [id]);
  await query('DELETE FROM direcciones WHERE usuario_id = $1', [id]);

  // 7. Eliminar carrito
  await query('DELETE FROM carrito_items WHERE usuario_id = $1', [id]);

  // 8. Eliminar productos del productor
  await query('DELETE FROM productos WHERE productor_id = $1', [id]);

  // 9. Finalmente eliminar el usuario
  await query('DELETE FROM usuarios WHERE id = $1', [id]);
};

const findPasswordById = async (id) => {
  const result = await query(
    `SELECT password FROM usuarios WHERE id = $1`,
    [id]
  );
  return result[0] || null;
};

const updatePassword = async (id, hashedPassword) => {
  await query(
    `UPDATE usuarios SET password = $1, updated_at = NOW() WHERE id = $2`,
    [hashedPassword, id]
  );
};

const updatePushToken = async (id, token) => {
  await query(
    `UPDATE usuarios SET expo_push_token = $1, updated_at = NOW() WHERE id = $2`,
    [token, id]
  );
};

const updateFotoPerfil = async (id, url) => {
  const result = await query(
    `UPDATE usuarios SET foto_perfil = $1, updated_at = NOW() WHERE id = $2 RETURNING foto_perfil`,
    [url, id]
  );
  return result[0] || null;
};

module.exports = { findById, update, findAll, setActivo, adminUpdate, deleteById, findPasswordById, updatePassword, updatePushToken, updateFotoPerfil };