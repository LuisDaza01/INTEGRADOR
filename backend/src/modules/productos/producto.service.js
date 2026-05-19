// ============================================
// src/modules/productos/producto.service.js - LÓGICA DE NEGOCIO
// ============================================
// Este archivo contiene la lógica de negocio del módulo
// Valida reglas de negocio, coordina operaciones, llama al repository

const productoRepository = require('./producto.repository');
const {
  NotFoundError,
  ValidationError,
  BusinessError,
  ForbiddenError
} = require('../../utils/errors');
const { ERROR_MESSAGES } = require('../../constants/messages');
const logger = require('../../utils/logger');
const { sendPushNotification } = require('../../utils/pushNotification');
const db = require('../../config/database');

const STOCK_BAJO_UMBRAL = 5;

// ============================================
// CONSULTAS (READ)
// ============================================

/**
 * Obtener todos los productos con filtros y paginación
 * 
 * @param {number} page - Página actual
 * @param {number} limit - Items por página
 * @param {Object} filters - Filtros de búsqueda
 * @returns {Promise<Object>} { data, pagination }
 */
const findAll = async (page, limit, filters = {}) => {
  logger.debug('Service: Buscando productos con filtros', {
    page,
    limit,
    filters
  });
  
  // Validar filtros numéricos
  if (filters.precio_min && isNaN(parseFloat(filters.precio_min))) {
    throw new ValidationError('precio_min debe ser un número');
  }
  
  if (filters.precio_max && isNaN(parseFloat(filters.precio_max))) {
    throw new ValidationError('precio_max debe ser un número');
  }
  
  if (filters.precio_min && filters.precio_max) {
    if (parseFloat(filters.precio_min) > parseFloat(filters.precio_max)) {
      throw new ValidationError('precio_min no puede ser mayor que precio_max');
    }
  }
  
  // Llamar al repository
  const result = await productoRepository.findAll(page, limit, filters);
  
  return result;
};

/**
 * Obtener productos destacados
 * 
 * @param {number} limit - Cantidad de productos
 * @returns {Promise<Array>} Lista de productos destacados
 */
const findDestacados = async (limit = 10) => {
  logger.debug('Service: Buscando productos destacados', { limit });
  
  if (limit > 50) {
    limit = 50; // Máximo 50 destacados
  }
  
  const productos = await productoRepository.findDestacados(limit);
  
  return productos;
};

/**
 * Buscar productos por término
 * 
 * @param {string} searchTerm - Término de búsqueda
 * @param {number} page - Página actual
 * @param {number} limit - Items por página
 * @returns {Promise<Object>} { data, pagination }
 */
const search = async (searchTerm, page, limit) => {
  logger.debug('Service: Buscando productos', {
    searchTerm,
    page,
    limit
  });
  
  // Validar término de búsqueda
  if (!searchTerm || searchTerm.trim().length === 0) {
    throw new ValidationError('El término de búsqueda es requerido');
  }
  
  if (searchTerm.trim().length < 2) {
    throw new ValidationError('El término de búsqueda debe tener al menos 2 caracteres');
  }
  
  const result = await productoRepository.search(searchTerm, page, limit);
  
  return result;
};

/**
 * Obtener producto por ID
 * 
 * @param {number} id - ID del producto
 * @returns {Promise<Object>} Producto encontrado
 * @throws {NotFoundError} Si el producto no existe
 */
const findById = async (id) => {
  logger.debug('Service: Buscando producto por ID', { id });
  
  const producto = await productoRepository.findById(id);
  
  if (!producto) {
    throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }
  
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
  logger.debug('Service: Buscando productos del productor', {
    productorId,
    page,
    limit
  });
  
  const result = await productoRepository.findByProductor(
    productorId,
    page,
    limit,
    filters
  );
  
  return result;
};

// ============================================
// OPERACIONES (CREATE, UPDATE, DELETE)
// ============================================

/**
 * Crear un nuevo producto
 * 
 * @param {Object} productData - Datos del producto
 * @returns {Promise<Object>} Producto creado
 * @throws {ValidationError} Si los datos son inválidos
 */
const create = async (productData) => {
  logger.debug('Service: Creando producto', {
    nombre: productData.nombre,
    productorId: productData.productor_id
  });
  
  // ===== Validaciones de negocio =====
  
  // Verificar que la categoría existe
  const categoriaExists = await productoRepository.categoriaExists(
    productData.categoria_id
  );
  
  if (!categoriaExists) {
    throw new ValidationError('La categoría especificada no existe');
  }
  
  // Validar precio
  if (productData.precio <= 0) {
    throw new ValidationError('El precio debe ser mayor a 0');
  }
  
  // Validar stock
  if (productData.stock < 0) {
    throw new ValidationError('El stock no puede ser negativo');
  }
  
  // Valores por defecto
  const finalData = {
    ...productData,
    disponible: productData.disponible !== undefined 
      ? productData.disponible 
      : true,
    destacado: false  // Solo admins pueden destacar
  };
  
  // Crear producto
  const producto = await productoRepository.create(finalData);
  
  // Si hay características, agregarlas
  if (productData.caracteristicas && productData.caracteristicas.length > 0) {
    await productoRepository.addCaracteristicas(
      producto.id,
      productData.caracteristicas
    );
  }
  
  // Obtener producto completo con relaciones
  const productoCompleto = await productoRepository.findById(producto.id);
  
  return productoCompleto;
};

/**
 * Actualizar un producto existente
 * 
 * @param {number} id - ID del producto
 * @param {Object} updateData - Datos a actualizar
 * @param {number} productorId - ID del productor autenticado
 * @param {boolean} isAdmin - Si es administrador
 * @returns {Promise<Object>} Producto actualizado
 * @throws {NotFoundError} Si el producto no existe
 * @throws {ForbiddenError} Si no es el dueño
 * @throws {ValidationError} Si los datos son inválidos
 */
const update = async (id, updateData, productorId, isAdmin = false) => {
  logger.debug('Service: Actualizando producto', {
    productId: id,
    productorId,
    isAdmin
  });
  
  // Verificar que el producto existe
  const producto = await productoRepository.findById(id);
  
  if (!producto) {
    throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }
  
  // Verificar ownership (solo el dueño o admin puede actualizar)
  if (!isAdmin && producto.productor_id !== productorId) {
    throw new ForbiddenError('No tienes permisos para actualizar este producto');
  }
  
  // Validaciones de negocio
  if (updateData.categoria_id) {
    const categoriaExists = await productoRepository.categoriaExists(
      updateData.categoria_id
    );
    
    if (!categoriaExists) {
      throw new ValidationError('La categoría especificada no existe');
    }
  }
  
  if (updateData.precio !== undefined && updateData.precio <= 0) {
    throw new ValidationError('El precio debe ser mayor a 0');
  }
  
  if (updateData.stock !== undefined && updateData.stock < 0) {
    throw new ValidationError('El stock no puede ser negativo');
  }
  
  // Solo admins pueden cambiar el campo destacado
  if (!isAdmin && updateData.destacado !== undefined) {
    delete updateData.destacado;
  }
  
  // Actualizar producto
  const productoActualizado = await productoRepository.update(id, updateData);
  
  // Si hay características, reemplazarlas
  if (updateData.caracteristicas) {
    await productoRepository.deleteCaracteristicas(id);
    
    if (updateData.caracteristicas.length > 0) {
      await productoRepository.addCaracteristicas(
        id,
        updateData.caracteristicas
      );
    }
  }
  
  // Obtener producto completo actualizado
  const productoCompleto = await productoRepository.findById(id);
  
  return productoCompleto;
};

/**
 * Eliminar un producto
 * 
 * @param {number} id - ID del producto
 * @param {number} productorId - ID del productor autenticado
 * @param {boolean} isAdmin - Si es administrador
 * @throws {NotFoundError} Si el producto no existe
 * @throws {ForbiddenError} Si no es el dueño
 * @throws {BusinessError} Si tiene pedidos activos
 */
const deleteProducto = async (id, productorId, isAdmin = false) => {
  logger.debug('Service: Eliminando producto', {
    productId: id,
    productorId,
    isAdmin
  });
  
  // Verificar que el producto existe
  const producto = await productoRepository.findById(id);
  
  if (!producto) {
    throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }
  
  // Verificar ownership
  if (!isAdmin && producto.productor_id !== productorId) {
    throw new ForbiddenError('No tienes permisos para eliminar este producto');
  }
  
  // Verificar que no tenga pedidos activos
  const hasActivePedidos = await productoRepository.hasActivePedidos(id);
  
  if (hasActivePedidos) {
    throw new BusinessError(
      'No se puede eliminar el producto porque tiene pedidos activos'
    );
  }
  
  // Eliminar características primero
  await productoRepository.deleteCaracteristicas(id);
  
  // Eliminar producto
  await productoRepository.delete(id);
};

/**
 * Cambiar disponibilidad de un producto
 * 
 * @param {number} id - ID del producto
 * @param {boolean} disponible - Nueva disponibilidad
 * @param {number} productorId - ID del productor autenticado
 * @param {boolean} isAdmin - Si es administrador
 * @returns {Promise<Object>} Producto actualizado
 */
const toggleDisponibilidad = async (id, disponible, productorId, isAdmin = false) => {
  logger.debug('Service: Cambiando disponibilidad', {
    productId: id,
    disponible
  });
  
  // Verificar que el producto existe
  const producto = await productoRepository.findById(id);
  
  if (!producto) {
    throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }
  
  // Verificar ownership
  if (!isAdmin && producto.productor_id !== productorId) {
    throw new ForbiddenError('No tienes permisos para modificar este producto');
  }
  
  // Actualizar disponibilidad
  await productoRepository.update(id, { disponible });
  
  // Obtener producto actualizado
  const productoActualizado = await productoRepository.findById(id);
  
  return productoActualizado;
};

/**
 * Actualiza solo el precio por kg de un producto. Solo el productor dueño.
 */
const updatePrecio = async (id, precio, productorId) => {
  const producto = await productoRepository.findById(id);
  if (!producto) throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  if (producto.productor_id !== productorId) {
    throw new ForbiddenError('No tienes permisos para modificar este producto');
  }
  await productoRepository.update(id, { precio });
  return await productoRepository.findById(id);
};

/**
 * Marcar/desmarcar producto como destacado
 * Solo admins pueden usar esta función
 *
 * @param {number} id - ID del producto
 * @param {boolean} destacado - Nuevo estado
 * @returns {Promise<Object>} Producto actualizado
 */
const toggleDestacado = async (id, destacado) => {
  logger.debug('Service: Cambiando estado destacado', {
    productId: id,
    destacado
  });
  
  // Verificar que el producto existe
  const producto = await productoRepository.findById(id);
  
  if (!producto) {
    throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }
  
  // Actualizar estado destacado
  await productoRepository.update(id, { destacado });
  
  // Obtener producto actualizado
  const productoActualizado = await productoRepository.findById(id);
  
  return productoActualizado;
};

/**
 * Actualizar stock de un producto
 * Usado internamente cuando se crea un pedido
 * 
 * @param {number} id - ID del producto
 * @param {number} cantidad - Cantidad a descontar
 * @throws {NotFoundError} Si el producto no existe
 * @throws {BusinessError} Si no hay stock suficiente
 */
const updateStock = async (id, cantidad) => {
  logger.debug('Service: Actualizando stock', {
    productId: id,
    cantidad
  });
  
  const producto = await productoRepository.findById(id);
  
  if (!producto) {
    throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }
  
  const nuevoStock = producto.stock - cantidad;
  
  if (nuevoStock < 0) {
    throw new BusinessError(ERROR_MESSAGES.INSUFFICIENT_STOCK);
  }
  
  await productoRepository.update(id, { stock: nuevoStock });

  if (nuevoStock === 0) {
    await productoRepository.update(id, { disponible: false });
  }

  // Notify producer if stock just crossed the low threshold
  if (nuevoStock <= STOCK_BAJO_UMBRAL) {
    try {
      const rows = await db.query(
        `SELECT u.expo_push_token, pr.nombre AS producto_nombre
         FROM productos pr
         JOIN usuarios u ON u.id = pr.productor_id
         WHERE pr.id = $1`,
        [id]
      );
      const row = rows[0];
      if (row?.expo_push_token) {
        const msg = nuevoStock === 0
          ? `"${row.producto_nombre}" se agotó.`
          : `"${row.producto_nombre}" tiene solo ${nuevoStock} unidad${nuevoStock === 1 ? '' : 'es'} restante${nuevoStock === 1 ? '' : 's'}.`;
        sendPushNotification(row.expo_push_token, {
          title: nuevoStock === 0 ? '❌ Producto agotado' : '⚠️ Stock bajo',
          body:  msg,
          data:  { type: 'stock_bajo', productoId: id, stock: nuevoStock },
        });
      }
    } catch (_) { /* notificaciones opcionales */ }
  }
};

// ============================================
// EXPORTAR SERVICIOS
// ============================================

module.exports = {
  // Consultas
  findAll,
  findDestacados,
  search,
  findById,
  findByProductor,
  
  // Operaciones
  create,
  update,
  delete: deleteProducto,
  toggleDisponibilidad,
  updatePrecio,
  toggleDestacado,
  updateStock
};