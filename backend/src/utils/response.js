// ============================================
// src/utils/response.js - RESPUESTAS ESTANDARIZADAS
// ============================================
// Este archivo centraliza el formato de las respuestas HTTP
// Asegura que todas las respuestas tengan la misma estructura
// Facilita el consumo de la API desde el frontend

// ============================================
// FORMATO DE RESPUESTA ESTÁNDAR
// ============================================

/**
 * Estructura estándar de respuesta exitosa:
 * {
 *   success: true,
 *   message: "Mensaje descriptivo",
 *   data: {...},
 *   pagination: {...}, // Opcional
 *   timestamp: "2024-01-15T10:30:00.000Z"
 * }
 * 
 * Estructura estándar de respuesta de error:
 * {
 *   success: false,
 *   message: "Mensaje del error",
 *   errors: [...], // Opcional, para errores de validación
 *   timestamp: "2024-01-15T10:30:00.000Z"
 * }
 */

// ============================================
// RESPUESTAS EXITOSAS
// ============================================

/**
 * Respuesta exitosa genérica
 * 
 * @param {Response} res - Response de Express
 * @param {*} data - Datos a retornar
 * @param {string} message - Mensaje descriptivo
 * @param {number} statusCode - Código HTTP (default: 200)
 * @returns {Response}
 * 
 * @example
 * return successResponse(res, productos, 'Productos obtenidos exitosamente');
 * return successResponse(res, producto, 'Producto creado', 201);
 */
const successResponse = (res, data = null, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Respuesta exitosa con paginación
 * 
 * @param {Response} res - Response de Express
 * @param {Array} data - Datos a retornar
 * @param {Object} pagination - Información de paginación
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * const pagination = {
 *   page: 1,
 *   limit: 10,
 *   total: 100,
 *   totalPages: 10,
 *   hasNextPage: true,
 *   hasPrevPage: false
 * };
 * return paginatedResponse(res, productos, pagination, 'Productos obtenidos');
 */
const paginatedResponse = (res, data = [], pagination = {}, message = 'Datos obtenidos exitosamente') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      totalPages: pagination.totalPages || 0,
      hasNextPage: pagination.hasNextPage || false,
      hasPrevPage: pagination.hasPrevPage || false
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Respuesta de creación exitosa (201)
 * 
 * @param {Response} res - Response de Express
 * @param {*} data - Recurso creado
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * return createdResponse(res, producto, 'Producto creado exitosamente');
 */
const createdResponse = (res, data, message = 'Recurso creado exitosamente') => {
  return successResponse(res, data, message, 201);
};

/**
 * Respuesta de actualización exitosa (200)
 * 
 * @param {Response} res - Response de Express
 * @param {*} data - Recurso actualizado
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * return updatedResponse(res, producto, 'Producto actualizado exitosamente');
 */
const updatedResponse = (res, data, message = 'Recurso actualizado exitosamente') => {
  return successResponse(res, data, message, 200);
};

/**
 * Respuesta de eliminación exitosa (200)
 * 
 * @param {Response} res - Response de Express
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * return deletedResponse(res, 'Producto eliminado exitosamente');
 */
const deletedResponse = (res, message = 'Recurso eliminado exitosamente') => {
  return res.status(200).json({
    success: true,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Respuesta sin contenido (204)
 * Útil para DELETE cuando no se retorna nada
 * 
 * @param {Response} res - Response de Express
 * @returns {Response}
 * 
 * @example
 * return noContentResponse(res);
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

// ============================================
// RESPUESTAS DE ERROR
// ============================================

/**
 * Respuesta de error genérica
 * 
 * @param {Response} res - Response de Express
 * @param {string} message - Mensaje del error
 * @param {number} statusCode - Código HTTP (default: 400)
 * @param {Array} errors - Errores de validación (opcional)
 * @returns {Response}
 * 
 * @example
 * return errorResponse(res, 'Producto no encontrado', 404);
 * 
 * return errorResponse(res, 'Errores de validación', 422, [
 *   { field: 'email', message: 'Email inválido' }
 * ]);
 */
const errorResponse = (res, message = 'Error en la operación', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  
  // Si hay errores de validación, incluirlos
  if (errors && errors.length > 0) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Respuesta de error de validación (422)
 * 
 * @param {Response} res - Response de Express
 * @param {Array} errors - Lista de errores de validación
 * @param {string} message - Mensaje general
 * @returns {Response}
 * 
 * @example
 * const errors = [
 *   { field: 'nombre', message: 'El nombre es requerido' },
 *   { field: 'precio', message: 'El precio debe ser positivo' }
 * ];
 * return validationErrorResponse(res, errors);
 */
const validationErrorResponse = (res, errors = [], message = 'Error de validación') => {
  return errorResponse(res, message, 422, errors);
};

/**
 * Respuesta de recurso no encontrado (404)
 * 
 * @param {Response} res - Response de Express
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * return notFoundResponse(res, 'Producto no encontrado');
 */
const notFoundResponse = (res, message = 'Recurso no encontrado') => {
  return errorResponse(res, message, 404);
};

/**
 * Respuesta de error de autenticación (401)
 * 
 * @param {Response} res - Response de Express
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * return unauthorizedResponse(res, 'Token expirado');
 */
const unauthorizedResponse = (res, message = 'No autorizado') => {
  return errorResponse(res, message, 401);
};

/**
 * Respuesta de permisos insuficientes (403)
 * 
 * @param {Response} res - Response de Express
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * return forbiddenResponse(res, 'No tienes permisos para esta acción');
 */
const forbiddenResponse = (res, message = 'Acceso denegado') => {
  return errorResponse(res, message, 403);
};

/**
 * Respuesta de conflicto (409)
 * 
 * @param {Response} res - Response de Express
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * return conflictResponse(res, 'El email ya está registrado');
 */
const conflictResponse = (res, message = 'Conflicto con el estado actual') => {
  return errorResponse(res, message, 409);
};

/**
 * Respuesta de error interno del servidor (500)
 * 
 * @param {Response} res - Response de Express
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * return serverErrorResponse(res, 'Error al procesar la petición');
 */
const serverErrorResponse = (res, message = 'Error interno del servidor') => {
  return errorResponse(res, message, 500);
};

/**
 * Respuesta de demasiadas peticiones (429)
 * 
 * @param {Response} res - Response de Express
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * return tooManyRequestsResponse(res, 'Demasiados intentos de login');
 */
const tooManyRequestsResponse = (res, message = 'Demasiadas peticiones') => {
  return errorResponse(res, message, 429);
};

// ============================================
// RESPUESTAS ESPECIALIZADAS
// ============================================

/**
 * Respuesta de lista vacía
 * No es un error, pero la lista está vacía
 * 
 * @param {Response} res - Response de Express
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * return emptyListResponse(res, 'No se encontraron productos');
 */
const emptyListResponse = (res, message = 'No hay datos disponibles') => {
  return successResponse(res, [], message, 200);
};

/**
 * Respuesta de operación pendiente
 * Para operaciones asíncronas
 * 
 * @param {Response} res - Response de Express
 * @param {*} data - Datos de la operación
 * @param {string} message - Mensaje descriptivo
 * @returns {Response}
 * 
 * @example
 * return pendingResponse(res, { taskId: '123' }, 'Procesando pedido');
 */
const pendingResponse = (res, data = null, message = 'Operación en proceso') => {
  return res.status(202).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Respuesta de redirección
 * 
 * @param {Response} res - Response de Express
 * @param {string} url - URL de redirección
 * @param {boolean} permanent - Si es redirección permanente (301 vs 302)
 * @returns {Response}
 * 
 * @example
 * return redirectResponse(res, 'https://example.com/new-url');
 * return redirectResponse(res, '/api/productos/123', true); // 301
 */
const redirectResponse = (res, url, permanent = false) => {
  const statusCode = permanent ? 301 : 302;
  return res.redirect(statusCode, url);
};

// ============================================
// HELPERS
// ============================================

/**
 * Construir objeto de respuesta sin enviarlo
 * Útil para testing o cuando necesitas el objeto antes de enviarlo
 * 
 * @param {*} data - Datos
 * @param {string} message - Mensaje
 * @param {boolean} success - Si es exitoso
 * @param {Object} pagination - Paginación (opcional)
 * @returns {Object}
 * 
 * @example
 * const responseObj = buildResponse(productos, 'Éxito', true);
 * // Hacer algo con responseObj
 * res.json(responseObj);
 */
const buildResponse = (data, message, success = true, pagination = null) => {
  const response = {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return response;
};

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  // Respuestas exitosas
  successResponse,
  paginatedResponse,
  createdResponse,
  updatedResponse,
  deletedResponse,
  noContentResponse,
  emptyListResponse,
  pendingResponse,
  
  // Respuestas de error
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  serverErrorResponse,
  tooManyRequestsResponse,
  
  // Otras
  redirectResponse,
  
  // Helpers
  buildResponse
};