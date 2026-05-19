// ============================================
// src/utils/errors.js - ERRORES PERSONALIZADOS
// ============================================
// Este archivo define clases de error customizadas para diferentes situaciones
// Extienden la clase Error nativa de JavaScript
// Facilitan el manejo de errores en toda la aplicación

const { ERROR_MESSAGES } = require('../constants/messages');

// ============================================
// CLASE BASE: AppError
// ============================================

/**
 * Error base de la aplicación
 * Todos los demás errores extienden de esta clase
 * 
 * @class AppError
 * @extends Error
 */
class AppError extends Error {
  /**
   * @param {string} message - Mensaje del error
   * @param {number} statusCode - Código HTTP del error
   * @param {boolean} isOperational - Si es un error operacional (esperado)
   */
  constructor(message, statusCode, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================
// ERRORES HTTP 4XX (Errores del Cliente)
// ============================================

/**
 * 400 - Bad Request
 * Petición mal formada o datos inválidos
 * 
 * @class BadRequestError
 * @extends AppError
 * 
 * @example
 * throw new BadRequestError('El formato de fecha es inválido');
 */
class BadRequestError extends AppError {
  constructor(message = ERROR_MESSAGES.BAD_REQUEST) {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

/**
 * 401 - Unauthorized
 * Usuario no autenticado o token inválido
 * 
 * @class UnauthorizedError
 * @extends AppError
 * 
 * @example
 * throw new UnauthorizedError('Token expirado');
 * throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_EXPIRED);
 */
class UnauthorizedError extends AppError {
  constructor(message = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 - Forbidden
 * Usuario autenticado pero sin permisos suficientes
 * 
 * @class ForbiddenError
 * @extends AppError
 * 
 * @example
 * throw new ForbiddenError('No tienes permisos para eliminar este producto');
 * throw new ForbiddenError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
 */
class ForbiddenError extends AppError {
  constructor(message = ERROR_MESSAGES.FORBIDDEN) {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * 404 - Not Found
 * Recurso no encontrado
 * 
 * @class NotFoundError
 * @extends AppError
 * 
 * @example
 * throw new NotFoundError('Producto no encontrado');
 * throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
 */
class NotFoundError extends AppError {
  constructor(message = ERROR_MESSAGES.NOT_FOUND) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 409 - Conflict
 * Conflicto con el estado actual del recurso
 * Ejemplo: Intentar crear un usuario con email que ya existe
 * 
 * @class ConflictError
 * @extends AppError
 * 
 * @example
 * throw new ConflictError('El email ya está registrado');
 * throw new ConflictError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
 */
class ConflictError extends AppError {
  constructor(message = ERROR_MESSAGES.CONFLICT) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * 422 - Unprocessable Entity
 * Errores de validación de datos
 * 
 * @class ValidationError
 * @extends AppError
 * 
 * @example
 * const error = new ValidationError('Errores de validación');
 * error.errors = [
 *   { field: 'email', message: 'Email inválido' },
 *   { field: 'password', message: 'Contraseña muy corta' }
 * ];
 * throw error;
 */
class ValidationError extends AppError {
  constructor(message = ERROR_MESSAGES.VALIDATION_ERROR) {
    super(message, 422);
    this.name = 'ValidationError';
    this.errors = []; // Array de errores de validación
  }
  
  /**
   * Añadir un error de validación
   * @param {string} field - Campo que falló la validación
   * @param {string} message - Mensaje del error
   * @param {*} value - Valor que causó el error (opcional)
   */
  addError(field, message, value = undefined) {
    this.errors.push({ field, message, value });
  }
  
  /**
   * Verificar si hay errores
   * @returns {boolean}
   */
  hasErrors() {
    return this.errors.length > 0;
  }
}

/**
 * 429 - Too Many Requests
 * Demasiadas peticiones (rate limiting)
 * 
 * @class TooManyRequestsError
 * @extends AppError
 * 
 * @example
 * throw new TooManyRequestsError('Demasiadas peticiones. Intenta en 15 minutos');
 */
class TooManyRequestsError extends AppError {
  constructor(message = ERROR_MESSAGES.TOO_MANY_REQUESTS) {
    super(message, 429);
    this.name = 'TooManyRequestsError';
  }
}

// ============================================
// ERRORES HTTP 5XX (Errores del Servidor)
// ============================================

/**
 * 500 - Internal Server Error
 * Error interno del servidor
 * 
 * @class InternalServerError
 * @extends AppError
 * 
 * @example
 * throw new InternalServerError('Error al conectar con el servicio de pagos');
 */
class InternalServerError extends AppError {
  constructor(message = ERROR_MESSAGES.INTERNAL_ERROR) {
    super(message, 500, false); // false = no es operacional
    this.name = 'InternalServerError';
  }
}

/**
 * 503 - Service Unavailable
 * Servicio temporalmente no disponible
 * 
 * @class ServiceUnavailableError
 * @extends AppError
 * 
 * @example
 * throw new ServiceUnavailableError('Base de datos no disponible');
 */
class ServiceUnavailableError extends AppError {
  constructor(message = ERROR_MESSAGES.SERVICE_UNAVAILABLE) {
    super(message, 503);
    this.name = 'ServiceUnavailableError';
  }
}

// ============================================
// ERRORES DE DOMINIO ESPECÍFICOS
// ============================================

/**
 * Error de negocio
 * Violación de reglas de negocio
 * 
 * @class BusinessError
 * @extends AppError
 * 
 * @example
 * // No se puede cancelar pedido entregado
 * throw new BusinessError('No se puede cancelar un pedido ya entregado');
 * 
 * // Stock insuficiente
 * throw new BusinessError(ERROR_MESSAGES.INSUFFICIENT_STOCK);
 */
class BusinessError extends AppError {
  constructor(message, statusCode = 400) {
    super(message, statusCode);
    this.name = 'BusinessError';
  }
}

/**
 * Error de base de datos
 * Errores específicos de operaciones de BD
 * 
 * @class DatabaseError
 * @extends AppError
 * 
 * @example
 * throw new DatabaseError('Error al ejecutar query: ' + error.message);
 */
class DatabaseError extends AppError {
  constructor(message = ERROR_MESSAGES.DATABASE_ERROR) {
    super(message, 500, false); // No operacional
    this.name = 'DatabaseError';
  }
}

/**
 * Error de autenticación
 * Credenciales inválidas
 * 
 * @class AuthenticationError
 * @extends UnauthorizedError
 * 
 * @example
 * throw new AuthenticationError('Email o contraseña incorrectos');
 * throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
 */
class AuthenticationError extends UnauthorizedError {
  constructor(message = ERROR_MESSAGES.INVALID_CREDENTIALS) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error de autorización
 * Permisos insuficientes
 * 
 * @class AuthorizationError
 * @extends ForbiddenError
 * 
 * @example
 * throw new AuthorizationError('Solo administradores pueden eliminar usuarios');
 * throw new AuthorizationError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
 */
class AuthorizationError extends ForbiddenError {
  constructor(message = ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Verificar si un error es operacional
 * Los errores operacionales son esperados y manejables
 * Los errores de programación son bugs que deben corregirse
 * 
 * @param {Error} error - Error a verificar
 * @returns {boolean}
 * 
 * @example
 * if (isOperationalError(error)) {
 *   // Manejar normalmente
 *   logger.warn('Error operacional', error);
 * } else {
 *   // Error de programación, requiere atención
 *   logger.error('Error de programación', error);
 *   // Considerar crashear y reiniciar
 * }
 */
const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Crear un error de validación con múltiples campos
 * 
 * @param {Array<Object>} errors - Lista de errores
 * @returns {ValidationError}
 * 
 * @example
 * const errors = [
 *   { field: 'email', message: 'Email inválido' },
 *   { field: 'password', message: 'Contraseña muy corta' }
 * ];
 * throw createValidationError(errors);
 */
const createValidationError = (errors = []) => {
  const error = new ValidationError();
  
  errors.forEach(err => {
    error.addError(err.field, err.message, err.value);
  });
  
  return error;
};

/**
 * Wrapper para convertir errores de terceros a AppError
 * 
 * @param {Error} error - Error original
 * @param {string} context - Contexto del error
 * @returns {AppError}
 * 
 * @example
 * try {
 *   await externalAPI.call();
 * } catch (error) {
 *   throw wrapError(error, 'Error al llamar API externa');
 * }
 */
const wrapError = (error, context = '') => {
  if (error instanceof AppError) {
    return error;
  }
  
  const message = context 
    ? `${context}: ${error.message}`
    : error.message;
    
  return new InternalServerError(message);
};

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  // Clase base
  AppError,
  
  // Errores HTTP 4XX
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  
  // Errores HTTP 5XX
  InternalServerError,
  ServiceUnavailableError,
  
  // Errores de dominio
  BusinessError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  
  // Helpers
  isOperationalError,
  createValidationError,
  wrapError
};