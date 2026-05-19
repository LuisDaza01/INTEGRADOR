// ============================================
// src/middlewares/error.middleware.js - MANEJO DE ERRORES
// ============================================
// Este middleware centraliza el manejo de TODOS los errores de la aplicación
// Convierte errores en respuestas JSON consistentes
// Loggea errores apropiadamente

const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');
const { AppError } = require('../utils/errors');
const config = require('../config/environment');
const { ERROR_MESSAGES } = require('../constants/messages');

// ============================================
// MIDDLEWARE: asyncHandler
// ============================================

/**
 * Wrapper para funciones async que automáticamente captura errores
 * Evita tener que usar try-catch en cada controlador
 * 
 * @param {Function} fn - Función async del controlador
 * @returns {Function} Función wrapped
 * 
 * Uso:
 * const controller = asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * });
 * 
 * @example
 * // Sin asyncHandler (tedioso)
 * const getProducts = async (req, res, next) => {
 *   try {
 *     const products = await productService.findAll();
 *     res.json(products);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 * 
 * // Con asyncHandler (limpio)
 * const getProducts = asyncHandler(async (req, res) => {
 *   const products = await productService.findAll();
 *   res.json(products);
 * });
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// MIDDLEWARE: validateRequest
// ============================================

/**
 * Valida el resultado de express-validator
 * Si hay errores de validación, los formatea y lanza un error
 * 
 * Debe usarse DESPUÉS de las validaciones de express-validator
 * 
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {Function} next - Siguiente middleware
 * 
 * Uso:
 * router.post('/productos',
 *   [
 *     body('nombre').notEmpty(),
 *     body('precio').isNumeric()
 *   ],
 *   validateRequest,  // ← Aquí
 *   controller
 * );
 */
const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Formatear errores de validación
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    logger.warn('Error de validación en request', {
      url: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
      ip: req.ip
    });
    
    // Crear error de validación
    const ValidationError = require('../utils/errors').ValidationError;
    const error = new ValidationError(ERROR_MESSAGES.VALIDATION_ERROR);
    error.errors = formattedErrors;
    
    return next(error);
  }
  
  next();
};

// ============================================
// MIDDLEWARE: notFoundHandler
// ============================================

/**
 * Maneja rutas que no existen (404)
 * Debe ir DESPUÉS de todas las rutas válidas
 * y ANTES del errorHandler
 * 
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
const notFoundHandler = (req, res, next) => {
  logger.warn('Ruta no encontrada', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  const NotFoundError = require('../utils/errors').NotFoundError;
  const error = new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  
  next(error);
};

// ============================================
// MIDDLEWARE: errorHandler
// ============================================

/**
 * Error handler global
 * Captura TODOS los errores de la aplicación
 * Convierte errores en respuestas JSON consistentes
 * 
 * Este middleware debe ser el ÚLTIMO middleware en app.js
 * 
 * @param {Error} err - Error capturado
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
const errorHandler = (err, req, res, next) => {
  // ===== PASO 1: Determinar si es un error operacional o de programación =====
  
  let error = err;
  
  // Si no es instancia de AppError, convertirlo
  if (!(err instanceof AppError)) {
    error = convertError(err);
  }
  
  // ===== PASO 2: Loggear el error apropiadamente =====
  
  const logData = {
    message: error.message,
    statusCode: error.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user.id : null,
    userAgent: req.get('user-agent')
  };
  
  // Errores de programación (500) se loggean como error
  // Errores operacionales (400, 401, 404, etc) se loggean como warn
  if (error.statusCode >= 500) {
    logger.error('Error del servidor', {
      ...logData,
      stack: error.stack,
      isOperational: error.isOperational
    });
  } else {
    logger.warn('Error operacional', logData);
  }
  
  // ===== PASO 3: Preparar respuesta para el cliente =====
  
  const responseData = {
    message: error.message,
    statusCode: error.statusCode
  };
  
  // Incluir errores de validación si existen
  if (error.errors && error.errors.length > 0) {
    responseData.errors = error.errors;
  }
  
  // En desarrollo, incluir stack trace
  if (config.app.env === 'development') {
    responseData.stack = error.stack;
  }
  
  // ===== PASO 4: Enviar respuesta al cliente =====
  
  return errorResponse(res, responseData.message, error.statusCode, responseData.errors);
};

// ============================================
// FUNCIÓN HELPER: convertError
// ============================================

/**
 * Convierte errores nativos o de terceros a AppError
 * Esto asegura que todos los errores tengan el mismo formato
 * 
 * @param {Error} err - Error original
 * @returns {AppError} Error convertido
 */
const convertError = (err) => {
  const {
    AppError,
    ValidationError,
    UnauthorizedError,
    NotFoundError,
    InternalServerError,
    BadRequestError
  } = require('../utils/errors');
  
  // ===== Error de PostgreSQL =====
  if (err.code && err.code.startsWith('2')) {
    // Códigos 2XXXX son errores de PostgreSQL
    
    // 23505 = Unique violation (duplicate key)
    if (err.code === '23505') {
      return new ValidationError('Ya existe un registro con esos datos únicos');
    }
    
    // 23503 = Foreign key violation
    if (err.code === '23503') {
      return new ValidationError('No se puede eliminar porque está relacionado con otros datos');
    }
    
    // 23502 = Not null violation
    if (err.code === '23502') {
      return new ValidationError('Falta un campo obligatorio');
    }
    
    // Otros errores de BD
    return new InternalServerError('Error de base de datos');
  }
  
  // ===== Error de JWT =====
  if (err.name === 'JsonWebTokenError') {
    return new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
  }
  
  if (err.name === 'TokenExpiredError') {
    return new UnauthorizedError(ERROR_MESSAGES.TOKEN_EXPIRED);
  }
  
  // ===== Error de validación de express-validator =====
  if (err.name === 'ValidationError') {
    return new ValidationError(err.message);
  }
  
  // ===== Error de sintaxis JSON =====
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return new BadRequestError('JSON inválido en el body de la petición');
  }
  
  // ===== Error de Multer (upload de archivos) =====
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new ValidationError(ERROR_MESSAGES.FILE_TOO_LARGE);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return new ValidationError('Tipo de archivo no permitido');
    }
    return new ValidationError(`Error al subir archivo: ${err.message}`);
  }
  
  // ===== Error genérico =====
  // Si no coincide con ninguno de los anteriores
  return new InternalServerError(
    config.app.env === 'production' 
      ? ERROR_MESSAGES.INTERNAL_ERROR 
      : err.message
  );
};

// ============================================
// EXPORTAR MIDDLEWARES
// ============================================

module.exports = {
  asyncHandler,
  validateRequest,
  notFoundHandler,
  errorHandler
};