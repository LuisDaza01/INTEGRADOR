// categoria.routes.js - Rutas para Categorías
const express = require('express');
const router = express.Router();
const categoriaController = require('./categoria.controller');
const categoriaValidator = require('./categoria.validator');
const { isAuthenticated, hasRole } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');

// ============================================================================
// RUTAS PÚBLICAS
// ============================================================================

/**
 * @route   GET /api/categorias
 * @desc    Obtener todas las categorías
 * @access  Public
 */
router.get(
  '/',
  categoriaValidator.obtenerCategorias,
  validate,
  categoriaController.obtenerCategorias
);

/**
 * @route   GET /api/categorias/:id
 * @desc    Obtener una categoría por ID
 * @access  Public
 */
router.get(
  '/:id',
  categoriaValidator.obtenerPorId,
  validate,
  categoriaController.obtenerCategoriaPorId
);

// ============================================================================
// RUTAS PROTEGIDAS - Admin
// ============================================================================

/**
 * @route   POST /api/categorias
 * @desc    Crear nueva categoría
 * @access  Private (Admin)
 */
router.post(
  '/',
  isAuthenticated,
  hasRole('admin'),  // ✅ CORREGIDO: era hasRole(['admin'])
  categoriaValidator.crearCategoria,
  validate,
  categoriaController.crearCategoria
);

/**
 * @route   PUT /api/categorias/:id
 * @desc    Actualizar categoría
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  isAuthenticated,
  hasRole('admin'),  // ✅ CORREGIDO
  categoriaValidator.actualizarCategoria,
  validate,
  categoriaController.actualizarCategoria
);

/**
 * @route   DELETE /api/categorias/:id
 * @desc    Eliminar categoría
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  isAuthenticated,
  hasRole('admin'),  // ✅ CORREGIDO
  categoriaValidator.eliminarCategoria,
  validate,
  categoriaController.eliminarCategoria
);

module.exports = router;