// src/modules/productos/producto.routes.js
const express = require('express');
const router = express.Router();
const productoController = require('./producto.controller');
const { validateProducto, validateId, validateQuery, validateSearch } = require('./producto.validator');
const { isAuthenticated, optionalAuth, isProductor, isAdmin } = require('../../middlewares/auth.middleware');
const { validateRequest } = require('../../middlewares/error.middleware');
const { searchLimiter, createLimiter } = require('../../middlewares/rateLimiter.middleware');
const upload = require('../../middlewares/upload.middleware');

// ============================================
// RUTAS PÚBLICAS
// ============================================

router.get('/', validateQuery, validateRequest, productoController.getAll);
router.get('/destacados', validateQuery, validateRequest, productoController.getDestacados);
router.get('/buscar', searchLimiter, validateSearch, validateRequest, productoController.search);
router.get('/:id', validateId, validateRequest, productoController.getById);

// ============================================
// RUTAS PROTEGIDAS - PRODUCTOR
// ============================================

router.get('/productor/mis-productos', isAuthenticated, isProductor, validateQuery, validateRequest, productoController.getMisProductos);

// Acepta tanto 'imagen' (1 archivo, legado) como 'imagenes' (hasta 6, galería)
const uploadProductoImgs = upload.fields([
  { name: 'imagen',   maxCount: 1 },
  { name: 'imagenes', maxCount: 6 },
]);

router.post('/', isAuthenticated, isProductor, createLimiter, uploadProductoImgs, validateProducto, validateRequest, productoController.create);

// PUT - productor dueño O admin
router.put(
  '/:id',
  isAuthenticated,
  (req, res, next) => {
    if (req.user?.rol === 'admin') return next();
    return isProductor(req, res, next);
  },
  uploadProductoImgs,
  validateId,
  validateProducto,
  validateRequest,
  productoController.update
);

// DELETE - productor dueño O admin
router.delete(
  '/:id',
  isAuthenticated,
  (req, res, next) => {
    if (req.user?.rol === 'admin') return next();
    return isProductor(req, res, next);
  },
  validateId,
  validateRequest,
  productoController.delete
);

router.patch('/:id/disponibilidad', isAuthenticated, isProductor, validateId, validateRequest, productoController.toggleDisponibilidad);

// PATCH actualizar solo el precio (productor dueño)
router.patch('/:id/precio', isAuthenticated, isProductor, validateId, validateRequest, productoController.updatePrecio);

// PATCH destacar - solo admin
router.patch('/:id/destacar', isAuthenticated, isAdmin, validateId, validateRequest, productoController.toggleDestacado);

module.exports = router;