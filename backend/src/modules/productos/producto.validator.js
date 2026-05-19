// ============================================
// src/modules/productos/producto.validator.js - VALIDACIONES
// ============================================
// Este archivo define las validaciones de entrada para el módulo de productos
// Usa express-validator para validar y sanitizar datos

const { body, param, query } = require('express-validator');
const { VALIDATION_MESSAGES } = require('../../constants/messages');

// ============================================
// VALIDACIÓN DE CREACIÓN/ACTUALIZACIÓN
// ============================================

/**
 * Validación para crear o actualizar un producto
 * 
 * Uso:
 * router.post('/', validateProducto, validateRequest, controller);
 */
const validateProducto = [
  // Nombre
  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage(VALIDATION_MESSAGES.REQUIRED('nombre'))
    .isLength({ min: 3, max: 255 })
    .withMessage('El nombre debe tener entre 3 y 255 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.]+$/)
    .withMessage('El nombre solo puede contener letras, números, espacios, guiones y puntos'),
  
  // Descripción
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  
  // Precio
  body('precio')
    .optional()
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('El precio debe ser un número entre 0.01 y 999,999.99')
    .toFloat(),
  
  // Stock
  body('stock')
    .optional()
    .isInt({ min: 0, max: 999999 })
    .withMessage('El stock debe ser un número entero entre 0 y 999,999')
    .toInt(),
  
  // Categoría ID
  body('categoria_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de categoría debe ser un número entero positivo')
    .toInt(),
  
  // Imagen URL
  body('imagen_url')
    .optional()
    .trim()
    .isURL()
    .withMessage('La URL de la imagen debe ser válida')
    .isLength({ max: 500 })
    .withMessage('La URL no puede exceder 500 caracteres'),
  
  // Disponible
  body('disponible')
    .optional()
    .isBoolean()
    .withMessage('El campo disponible debe ser true o false')
    .toBoolean(),
  
  // Destacado
  body('destacado')
    .optional()
    .isBoolean()
    .withMessage('El campo destacado debe ser true o false')
    .toBoolean(),
  
  // Características (array de objetos)
  body('caracteristicas')
    .optional()
    .isArray()
    .withMessage('Las características deben ser un array'),
  
  body('caracteristicas.*.clave')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La clave de la característica es requerida')
    .isLength({ min: 2, max: 100 })
    .withMessage('La clave debe tener entre 2 y 100 caracteres'),
  
  body('caracteristicas.*.valor')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El valor de la característica es requerido')
    .isLength({ min: 1, max: 255 })
    .withMessage('El valor debe tener entre 1 y 255 caracteres')
];

// ============================================
// VALIDACIÓN DE ID EN PARÁMETROS
// ============================================

/**
 * Validación para rutas con :id
 * 
 * Uso:
 * router.get('/:id', validateId, validateRequest, controller);
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo')
    .toInt()
];

// ============================================
// VALIDACIÓN DE QUERY PARAMS
// ============================================

/**
 * Validación para parámetros de consulta (paginación, filtros, ordenamiento)
 * 
 * Uso:
 * router.get('/', validateQuery, validateRequest, controller);
 */
const validateQuery = [
  // Paginación
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100')
    .toInt(),
  
  // Filtros
  query('categoria_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de categoría debe ser un número entero positivo')
    .toInt(),
  
  query('productor_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de productor debe ser un número entero positivo')
    .toInt(),
  
  query('precio_min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio mínimo debe ser un número positivo')
    .toFloat(),
  
  query('precio_max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio máximo debe ser un número positivo')
    .toFloat(),
  
  query('disponible')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('El campo disponible debe ser "true" o "false"'),
  
  query('destacado')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('El campo destacado debe ser "true" o "false"'),
  
  // Ordenamiento
  query('order')
    .optional()
    .isIn([
      'nombre_asc',
      'nombre_desc',
      'precio_asc',
      'precio_desc',
      'fecha_desc',
      'fecha_asc'
    ])
    .withMessage('El orden debe ser uno de: nombre_asc, nombre_desc, precio_asc, precio_desc, fecha_desc, fecha_asc')
];

// ============================================
// VALIDACIÓN DE BÚSQUEDA
// ============================================

/**
 * Validación para búsqueda de productos
 * 
 * Uso:
 * router.get('/buscar', validateSearch, validateRequest, controller);
 */
const validateSearch = [
  // Término de búsqueda
  query('q')
    .trim()
    .notEmpty()
    .withMessage('El término de búsqueda es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.]+$/)
    .withMessage('El término de búsqueda contiene caracteres no permitidos'),
  
  // Paginación
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100')
    .toInt()
];

// ============================================
// VALIDACIÓN DE DISPONIBILIDAD
// ============================================

/**
 * Validación para cambiar disponibilidad
 * 
 * Uso:
 * router.patch('/:id/disponibilidad', validateDisponibilidad, validateRequest, controller);
 */
const validateDisponibilidad = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo')
    .toInt(),
  
  body('disponible')
    .notEmpty()
    .withMessage('El campo disponible es requerido')
    .isBoolean()
    .withMessage('El campo disponible debe ser true o false')
    .toBoolean()
];

// ============================================
// VALIDACIÓN DE DESTACADO
// ============================================

/**
 * Validación para marcar/desmarcar como destacado
 * 
 * Uso:
 * router.patch('/:id/destacar', validateDestacado, validateRequest, controller);
 */
const validateDestacado = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo')
    .toInt(),
  
  body('destacado')
    .notEmpty()
    .withMessage('El campo destacado es requerido')
    .isBoolean()
    .withMessage('El campo destacado debe ser true o false')
    .toBoolean()
];

// ============================================
// SANITIZACIÓN PERSONALIZADA
// ============================================

/**
 * Sanitizador personalizado para limpiar strings
 * Remueve espacios extra y caracteres problemáticos
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  
  return value
    .trim()
    .replace(/\s+/g, ' ')  // Reemplazar múltiples espacios por uno solo
    .replace(/[<>]/g, '');  // Remover < y > para prevenir XSS básico
};

/**
 * Validador personalizado para verificar que un array no esté vacío
 */
const isNonEmptyArray = (value) => {
  return Array.isArray(value) && value.length > 0;
};

// ============================================
// VALIDACIONES CONDICIONALES
// ============================================

/**
 * Validación para creación (campos requeridos)
 * 
 * Uso:
 * router.post('/', validateProductoCreation, validateRequest, controller);
 */
const validateProductoCreation = [
  // En creación, estos campos son obligatorios
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 255 })
    .withMessage('El nombre debe tener entre 3 y 255 caracteres')
    .customSanitizer(sanitizeString),
  
  body('precio')
    .notEmpty()
    .withMessage('El precio es requerido')
    .isFloat({ min: 0.01 })
    .withMessage('El precio debe ser mayor a 0')
    .toFloat(),
  
  body('stock')
    .notEmpty()
    .withMessage('El stock es requerido')
    .isInt({ min: 0 })
    .withMessage('El stock debe ser 0 o mayor')
    .toInt(),
  
  body('categoria_id')
    .notEmpty()
    .withMessage('La categoría es requerida')
    .isInt({ min: 1 })
    .withMessage('La categoría debe ser válida')
    .toInt(),
  
  // Campos opcionales
  ...validateProducto.filter(v => 
    !['nombre', 'precio', 'stock', 'categoria_id'].includes(v.builder?.fields?.[0])
  )
];

/**
 * Validación para actualización (todos los campos opcionales)
 * 
 * Uso:
 * router.put('/:id', validateProductoUpdate, validateRequest, controller);
 */
const validateProductoUpdate = [
  ...validateId,
  ...validateProducto
];

// ============================================
// EXPORTAR VALIDADORES
// ============================================

module.exports = {
  // Validaciones principales
  validateProducto,
  validateProductoCreation,
  validateProductoUpdate,
  
  // Validaciones de parámetros
  validateId,
  validateQuery,
  validateSearch,
  
  // Validaciones específicas
  validateDisponibilidad,
  validateDestacado,
  
  // Helpers personalizados
  sanitizeString,
  isNonEmptyArray
};