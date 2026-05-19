// carrito.validator.js - Validaciones para Carrito
const { body, param } = require('express-validator');

const carritoValidator = {
  /**
   * Validación para agregar producto
   */
  agregarProducto: [
    body('producto_id')
      .notEmpty()
      .withMessage('El ID del producto es obligatorio')
      .isInt({ min: 1 })
      .withMessage('El ID del producto debe ser un número válido'),
    
    body('cantidad')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('La cantidad debe estar entre 1 y 100')
  ],

  /**
   * Validación para actualizar cantidad
   */
  actualizarCantidad: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID del item inválido'),
    
    body('cantidad')
      .notEmpty()
      .withMessage('La cantidad es obligatoria')
      .isInt({ min: 1, max: 100 })
      .withMessage('La cantidad debe estar entre 1 y 100')
  ],

  /**
   * Validación para eliminar producto
   */
  eliminarProducto: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID del item inválido')
  ],

  /**
   * Validación para migrar carrito
   */
  migrarCarrito: [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Debe incluir al menos un item'),
    
    body('items.*.producto_id')
      .isInt({ min: 1 })
      .withMessage('ID de producto inválido'),
    
    body('items.*.cantidad')
      .isInt({ min: 1 })
      .withMessage('La cantidad debe ser al menos 1')
  ]
};

module.exports = carritoValidator;