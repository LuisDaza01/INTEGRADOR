// ============================================
// src/modules/productos/producto.repository.js - ACCESO A DATOS
// ============================================
// Este archivo maneja TODAS las queries SQL del módulo de productos
// Es la ÚNICA capa que accede directamente a la base de datos

const db = require('../../config/database');
const { paginate } = require('../../utils/pagination');
const logger = require('../../utils/logger');

// ============================================
// QUERIES DE CONSULTA (SELECT)
// ============================================

/**
 * Obtener todos los productos con filtros y paginación
 * 
 * @param {number} page - Página actual
 * @param {number} limit - Items por página
 * @param {Object} filters - Filtros
 * @returns {Promise<Object>} { data, pagination }
 */
const findAll = async (page, limit, filters = {}) => {
  // Construir WHERE clause dinámicamente
  const conditions = ['p.deleted_at IS NULL'];  // Soft delete
  const params = [];
  let paramCount = 1;
  
  // Filtro por categoría
  if (filters.categoria_id) {
    conditions.push(`p.categoria_id = $${paramCount}`);
    params.push(parseInt(filters.categoria_id, 10));
    paramCount++;
  }
  
  // Filtro por productor
  if (filters.productor_id) {
    conditions.push(`p.productor_id = $${paramCount}`);
    params.push(parseInt(filters.productor_id, 10));
    paramCount++;
  }
  
  // Filtro por precio mínimo
  if (filters.precio_min) {
    conditions.push(`p.precio >= $${paramCount}`);
    params.push(parseFloat(filters.precio_min));
    paramCount++;
  }
  
  // Filtro por precio máximo
  if (filters.precio_max) {
    conditions.push(`p.precio <= $${paramCount}`);
    params.push(parseFloat(filters.precio_max));
    paramCount++;
  }
  
  // Búsqueda por texto
  if (filters.q) {
    conditions.push(`(p.nombre ILIKE $${paramCount} OR p.descripcion ILIKE $${paramCount})`);
    params.push(`%${filters.q}%`);
    paramCount++;
  }

  // Filtro por disponibilidad
  if (filters.disponible !== undefined) {
    conditions.push(`p.disponible = $${paramCount}`);
    params.push(filters.disponible === 'true' || filters.disponible === true);
    paramCount++;
  }
  
  // Filtro por destacado
  if (filters.destacado !== undefined) {
    conditions.push(`p.destacado = $${paramCount}`);
    params.push(filters.destacado === 'true' || filters.destacado === true);
    paramCount++;
  }
  
  const whereClause = conditions.join(' AND ');
  
  // Ordenamiento
  let orderClause = 'p.created_at DESC';  // Por defecto
  
  if (filters.order) {
    const orderMap = {
      nombre_asc: 'p.nombre ASC',
      nombre_desc: 'p.nombre DESC',
      precio_asc: 'p.precio ASC',
      precio_desc: 'p.precio DESC',
      fecha_desc: 'p.created_at DESC',
      fecha_asc: 'p.created_at ASC'
    };
    
    orderClause = orderMap[filters.order] || orderClause;
  }
  
  // Query de datos
  const dataQuery = `
    SELECT
      p.id,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.disponible,
      p.destacado,
      p.imagen,
      p.imagenes,
      p.created_at,
      p.updated_at,
      p.categoria_id,
      c.nombre as categoria_nombre,
      p.productor_id,
      u.nombre_empresa as productor_nombre,
      u.email as productor_email,
      COALESCE(op.promedio, 0) as promedio_valoracion,
      COALESCE(op.total, 0)    as total_valoraciones
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN usuarios u ON p.productor_id = u.id AND u.rol_id = 2
    LEFT JOIN (
      SELECT producto_id, AVG(calificacion)::numeric(3,2) as promedio, COUNT(*) as total
      FROM opiniones GROUP BY producto_id
    ) op ON op.producto_id = p.id
    WHERE ${whereClause}
    ORDER BY ${orderClause}
  `;
  
  // Query de conteo
  const countQuery = `
    SELECT COUNT(*) as total
    FROM productos p
    WHERE ${whereClause}
  `;
  
  // Usar helper de paginación
  const result = await paginate(
    (limit, offset) => db.query(`${dataQuery} LIMIT $${paramCount} OFFSET $${paramCount + 1}`, [...params, limit, offset]),
    () => db.query(countQuery, params),
    { page, limit }
  );
  
  return result;
};

/**
 * Obtener productos destacados
 * 
 * @param {number} limit - Cantidad de productos
 * @returns {Promise<Array>} Lista de productos
 */
const findDestacados = async (limit) => {
  const query = `
    SELECT 
      p.id,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.disponible,
      p.destacado,
      p.imagen,
      p.created_at,
      p.categoria_id,
      c.nombre as categoria_nombre,
      p.productor_id,
      u.nombre_empresa as productor_nombre,
      u.nombre as productor,
      u.foto_perfil as productor_imagen,
      u.ubicacion as productor_ubicacion,
      u.rating as productor_rating,
      0 as promedio_valoracion,
      0 as total_valoraciones
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN usuarios u ON p.productor_id = u.id
    WHERE p.destacado = true 
      AND p.disponible = true
      AND p.deleted_at IS NULL
      AND u.rol_id = 2
    ORDER BY p.created_at DESC
    LIMIT $1
  `;
  
  const productos = await db.query(query, [limit]);
  
  return productos;
};

/**
 * Buscar productos por nombre o descripción
 * 
 * @param {string} searchTerm - Término de búsqueda
 * @param {number} page - Página actual
 * @param {number} limit - Items por página
 * @returns {Promise<Object>} { data, pagination }
 */
const search = async (searchTerm, page, limit) => {
  const searchPattern = `%${searchTerm}%`;
  
  const dataQuery = `
    SELECT 
      p.id,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.disponible,
      p.destacado,
      p.imagen,
      p.created_at,
      p.categoria_id,
      c.nombre as categoria_nombre,
      p.productor_id,
      u.nombre_empresa as productor_nombre,
      0 as promedio_valoracion,
      0 as total_valoraciones
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN usuarios u ON p.productor_id = u.id AND u.rol_id = 2
    WHERE p.deleted_at IS NULL
      AND (
        p.nombre ILIKE $1
        OR p.descripcion ILIKE $1
      )
    ORDER BY p.created_at DESC
  `;
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM productos p
    WHERE p.deleted_at IS NULL
      AND (
        p.nombre ILIKE $1
        OR p.descripcion ILIKE $1
      )
  `;
  
  const result = await paginate(
    (limit, offset) => db.query(`${dataQuery} LIMIT $2 OFFSET $3`, [searchPattern, limit, offset]),
    () => db.query(countQuery, [searchPattern]),
    { page, limit }
  );
  
  return result;
};

/**
 * Obtener producto por ID con todas sus relaciones
 * 
 * @param {number} id - ID del producto
 * @returns {Promise<Object|null>} Producto o null
 */
const findById = async (id) => {
  const query = `
    SELECT
      p.id,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.disponible,
      p.destacado,
      p.imagen,
      p.imagenes,
      p.created_at,
      p.updated_at,
      p.categoria_id,
      c.nombre as categoria_nombre,
      p.productor_id,
      u.nombre_empresa as productor_nombre,
      u.descripcion as productor_descripcion,
      u.email as productor_email,
      u.telefono as productor_telefono,
      COALESCE(op.promedio, 0) as promedio_valoracion,
      COALESCE(op.total, 0)    as total_valoraciones
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN usuarios u ON p.productor_id = u.id AND u.rol_id = 2
    LEFT JOIN (
      SELECT producto_id, AVG(calificacion)::numeric(3,2) as promedio, COUNT(*) as total
      FROM opiniones GROUP BY producto_id
    ) op ON op.producto_id = p.id
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `;
  
  const result = await db.query(query, [id]);
  
  if (result.length === 0) {
    return null;
  }
  
  const producto = result[0];
  
  // Obtener características
  producto.caracteristicas = await getCaracteristicas(id);
  
  // Valoraciones temporalmente deshabilitadas (tabla no existe aún)
  producto.valoraciones = [];
  
  return producto;
};

/**
 * Obtener productos de un productor específico
 * 
 * @param {number} productorId - ID del productor
 * @param {number} page - Página actual
 * @param {number} limit - Items por página
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Object>} { data, pagination }
 */
const findByProductor = async (productorId, page, limit, filters = {}) => {
  const conditions = [
    'p.productor_id = $1',
    'p.deleted_at IS NULL'
  ];
  const params = [productorId];
  let paramCount = 2;
  
  if (filters.disponible !== undefined) {
    conditions.push(`p.disponible = $${paramCount}`);
    params.push(filters.disponible === 'true' || filters.disponible === true);
    paramCount++;
  }
  
  const whereClause = conditions.join(' AND ');

  const dataQuery = `
    SELECT
      p.id,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.disponible,
      p.destacado,
      p.imagen,
      p.imagenes,
      p.created_at,
      p.updated_at,
      p.categoria_id,
      c.nombre as categoria_nombre,
      COALESCE(op.promedio, 0)      as promedio_valoracion,
      COALESCE(op.total, 0)         as total_valoraciones,
      COALESCE(ventas.unidades, 0)  as total_vendido
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN (
      SELECT producto_id, AVG(calificacion)::numeric(3,2) as promedio, COUNT(*) as total
      FROM opiniones GROUP BY producto_id
    ) op ON op.producto_id = p.id
    LEFT JOIN (
      SELECT dp.producto_id, SUM(dp.cantidad) as unidades
      FROM detalles_pedido dp
      JOIN pedidos pe ON pe.id = dp.pedido_id AND pe.estado != 'cancelado'
      GROUP BY dp.producto_id
    ) ventas ON ventas.producto_id = p.id
    WHERE ${whereClause}
    ORDER BY p.created_at DESC
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM productos p
    WHERE ${whereClause}
  `;

  const result = await paginate(
    (limit, offset) => db.query(`${dataQuery} LIMIT $${paramCount} OFFSET $${paramCount + 1}`, [...params, limit, offset]),
    () => db.query(countQuery, params),
    { page, limit }
  );

  return result;
};

// ============================================
// QUERIES DE MODIFICACIÓN (INSERT, UPDATE, DELETE)
// ============================================

/**
 * Crear un nuevo producto
 * 
 * @param {Object} productData - Datos del producto
 * @returns {Promise<Object>} Producto creado
 */
const create = async (productData) => {
  const query = `
    INSERT INTO productos (
      nombre,
      descripcion,
      precio,
      stock,
      categoria_id,
      productor_id,
      imagen,
      imagenes,
      disponible,
      destacado
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const imagenes = Array.isArray(productData.imagenes) ? productData.imagenes : [];

  const params = [
    productData.nombre,
    productData.descripcion || null,
    productData.precio,
    productData.stock,
    productData.categoria_id,
    productData.productor_id,
    productData.imagen || imagenes[0] || null,
    JSON.stringify(imagenes),
    productData.disponible !== undefined ? productData.disponible : true,
    productData.destacado || false
  ];

  const result = await db.query(query, params);

  return result[0];
};

/**
 * Actualizar un producto existente
 * 
 * @param {number} id - ID del producto
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Producto actualizado
 */
const update = async (id, updateData) => {
  // Construir SET clause dinámicamente
  const fields = [];
  const params = [];
  let paramCount = 1;
  
  const allowedFields = [
    'nombre',
    'descripcion',
    'precio',
    'stock',
    'categoria_id',
    'imagen',
    'disponible',
    'destacado'
  ];

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      fields.push(`${field} = $${paramCount}`);
      params.push(updateData[field]);
      paramCount++;
    }
  });

  // imagenes (JSONB) — se serializa aparte
  if (updateData.imagenes !== undefined) {
    const imgs = Array.isArray(updateData.imagenes) ? updateData.imagenes : [];
    fields.push(`imagenes = $${paramCount}`);
    params.push(JSON.stringify(imgs));
    paramCount++;
  }
  
  if (fields.length === 0) {
    // No hay nada que actualizar
    return findById(id);
  }
  
  // Añadir updated_at
  fields.push(`updated_at = NOW()`);
  
  // Añadir ID
  params.push(id);
  
  const query = `
    UPDATE productos
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  
  const result = await db.query(query, params);
  
  return result[0];
};

/**
 * Eliminar un producto (soft delete)
 * 
 * @param {number} id - ID del producto
 * @returns {Promise<void>}
 */
const deleteProducto = async (id) => {
  const query = `
    UPDATE productos
    SET deleted_at = NOW()
    WHERE id = $1
  `;
  
  await db.query(query, [id]);
};

// ============================================
// CARACTERÍSTICAS DEL PRODUCTO
// ============================================

/**
 * Obtener características de un producto
 * 
 * @param {number} productoId - ID del producto
 * @returns {Promise<Array>} Lista de características
 */
const getCaracteristicas = async (productoId) => {
  const query = `
    SELECT id, caracteristica
    FROM caracteristicas_producto
    WHERE producto_id = $1
    ORDER BY id
  `;
  
  const caracteristicas = await db.query(query, [productoId]);
  
  return caracteristicas;
};

/**
 * Añadir características a un producto
 * 
 * @param {number} productoId - ID del producto
 * @param {Array} caracteristicas - Array de strings o { caracteristica: "texto" }
 * @returns {Promise<void>}
 */
const addCaracteristicas = async (productoId, caracteristicas) => {
  if (!caracteristicas || caracteristicas.length === 0) {
    return;
  }
  
  // Insertar múltiples características en una sola query
  const values = caracteristicas.map((_, index) => {
    const base = index * 2;
    return `($${base + 1}, $${base + 2})`;
  }).join(', ');
  
  const params = [];
  caracteristicas.forEach(c => {
    // Aceptar tanto string como objeto con propiedad 'caracteristica'
    const caracteristicaTexto = typeof c === 'string' ? c : c.caracteristica;
    params.push(productoId, caracteristicaTexto);
  });
  
  const query = `
    INSERT INTO caracteristicas_producto (producto_id, caracteristica)
    VALUES ${values}
  `;
  
  await db.query(query, params);
};

/**
 * Eliminar todas las características de un producto
 * 
 * @param {number} productoId - ID del producto
 * @returns {Promise<void>}
 */
const deleteCaracteristicas = async (productoId) => {
  const query = `
    DELETE FROM caracteristicas_producto
    WHERE producto_id = $1
  `;
  
  await db.query(query, [productoId]);
};

// ============================================
// VALORACIONES (DESHABILITADAS TEMPORALMENTE)
// ============================================

/**
 * Obtener valoraciones de un producto
 * NOTA: Función deshabilitada - la tabla valoraciones aún no existe
 * 
 * @param {number} productoId - ID del producto
 * @param {number} limit - Cantidad de valoraciones
 * @returns {Promise<Array>} Lista vacía
 */
const getValoraciones = async (productoId, limit = 10) => {
  // Retornar array vacío hasta que se implemente la tabla valoraciones
  return [];
  
  /* CÓDIGO ORIGINAL - Descomentar cuando exista la tabla valoraciones
  const query = `
    SELECT 
      v.id,
      v.calificacion,
      v.comentario,
      v.created_at,
      u.nombre as usuario_nombre,
      u.email as usuario_email
    FROM valoraciones v
    JOIN usuarios u ON v.usuario_id = u.id
    WHERE v.producto_id = $1
    ORDER BY v.created_at DESC
    LIMIT $2
  `;
  
  const valoraciones = await db.query(query, [productoId, limit]);
  
  return valoraciones;
  */
};

// ============================================
// VALIDACIONES Y VERIFICACIONES
// ============================================

/**
 * Verificar si una categoría existe
 * 
 * @param {number} categoriaId - ID de la categoría
 * @returns {Promise<boolean>}
 */
const categoriaExists = async (categoriaId) => {
  const query = 'SELECT id FROM categorias WHERE id = $1';
  const result = await db.query(query, [categoriaId]);
  
  return result.length > 0;
};

/**
 * Verificar si el producto tiene pedidos activos
 * 
 * @param {number} productoId - ID del producto
 * @returns {Promise<boolean>}
 */
const hasActivePedidos = async (productoId) => {
  const query = `
    SELECT COUNT(*) as count
    FROM detalles_pedido pi
    JOIN pedidos p ON pi.pedido_id = p.id
    WHERE pi.producto_id = $1
      AND p.estado NOT IN ('entregado', 'cancelado')
  `;
  
  const result = await db.query(query, [productoId]);
  
  return parseInt(result[0].count, 10) > 0;
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================


/**
 * Marcar/desmarcar producto como destacado
 */
const toggleDestacado = async (productoId, destacado) => {
  const { query } = require('../../config/database');
  const result = await query(
    `UPDATE productos SET destacado = $1 WHERE id = $2 RETURNING *`,
    [destacado, productoId]
  );
  return result[0] || null;
};

module.exports = {
  // Consultas
  findAll,
  findDestacados,
  search,
  findById,
  findByProductor,
  
  // Modificaciones
  create,
  update,
  delete: deleteProducto,
  
  // Características
  getCaracteristicas,
  addCaracteristicas,
  deleteCaracteristicas,
  
  // Valoraciones
  getValoraciones,
  
  // Validaciones
  categoriaExists,
  hasActivePedidos,
  toggleDestacado
};