// categoria.validator.js - Validaciones para Categorías
const { body, param, query } = require('express-validator');

const categoriaValidator = {
  /**
   * Validación para crear categoría
   */
  crearCategoria: [
    body('nombre')
      .notEmpty()
      .withMessage('El nombre es obligatorio')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('descripcion')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres'),
    
    body('imagen')
      .optional()
      .trim()
      .isURL()
      .withMessage('La URL de la imagen no es válida'),
    
    body('activo')
      .optional()
      .isBoolean()
      .withMessage('activo debe ser verdadero o falso')
  ],

  /**
   * Validación para actualizar categoría
   */
  actualizarCategoria: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID de categoría inválido'),
    
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('descripcion')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres'),
    
    body('imagen')
      .optional()
      .trim()
      .isURL()
      .withMessage('La URL de la imagen no es válida'),
    
    body('activo')
      .optional()
      .isBoolean()
      .withMessage('activo debe ser verdadero o falso')
  ],

  /**
   * Validación para obtener por ID
   */
  obtenerPorId: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID de categoría inválido')
  ],

  /**
   * Validación para eliminar
   */
  eliminarCategoria: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID de categoría inválido')
  ],

  /**
   * Validación para query params
   */
  obtenerCategorias: [
    query('incluir_conteo')
      .optional()
      .isBoolean()
      .withMessage('incluir_conteo debe ser verdadero o falso')
  ]
};

module.exports = categoriaValidator;