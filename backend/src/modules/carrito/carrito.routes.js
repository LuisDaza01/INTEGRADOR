// carrito.routes.js - Rutas para Carrito
const express = require('express');
const router = express.Router();
const carritoController = require('./carrito.controller');
const carritoValidator = require('./carrito.validator');
const { isAuthenticated } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');

// ============================================================================
// RUTAS PROTEGIDAS - Requieren autenticación
// ============================================================================

/**
 * @route   GET /api/carrito
 * @desc    Obtener carrito del usuario
 * @access  Private
 */
router.get(
  '/',
  isAuthenticated,
  carritoController.obtenerCarrito
);

/**
 * @route   POST /api/carrito
 * @desc    Agregar producto al carrito
 * @access  Private
 */
router.post(
  '/',
  isAuthenticated,
  carritoValidator.agregarProducto,
  validate,
  carritoController.agregarProducto
);

/**
 * @route   POST /api/carrito/migrar
 * @desc    Migrar carrito anónimo (cuando el usuario inicia sesión)
 * @access  Private
 */
router.post(
  '/migrar',
  isAuthenticated,
  carritoValidator.migrarCarrito,
  validate,
  carritoController.migrarCarrito
);

/**
 * @route   DELETE /api/carrito/limpiar
 * @desc    Limpiar todo el carrito
 * @access  Private
 */
router.delete(
  '/limpiar',
  isAuthenticated,
  carritoController.limpiarCarrito
);

/**
 * @route   PUT /api/carrito/:id
 * @desc    Actualizar cantidad de un item
 * @access  Private
 */
router.put(
  '/:id',
  isAuthenticated,
  carritoValidator.actualizarCantidad,
  validate,
  carritoController.actualizarCantidad
);

/**
 * @route   DELETE /api/carrito/:id
 * @desc    Eliminar producto del carrito
 * @access  Private
 */
router.delete(
  '/:id',
  isAuthenticated,
  carritoValidator.eliminarProducto,
  validate,
  carritoController.eliminarProducto
);

module.exports = router;