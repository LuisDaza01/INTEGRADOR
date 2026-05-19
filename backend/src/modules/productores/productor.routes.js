// productor.routes.js - Rutas para Productores
const express = require('express');
const router = express.Router();
const productorController = require('./productor.controller');
const productorValidator = require('./productor.validator');
const disponibilidadController = require('../disponibilidad/disponibilidad.controller');
const { isAuthenticated, hasRole } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const upload = require('../../middlewares/upload.middleware');

// GET /api/productores/:id/calendario?desde=&hasta=
router.get('/:id/calendario', disponibilidadController.calendarioPublico);

// ============================================================================
// RUTAS PÚBLICAS
// ============================================================================

/**
 * @route   GET /api/productores
 * @desc    Obtener todos los productores públicos
 * @access  Public
 */
router.get(
  '/',
  productorController.obtenerProductores
);

/**
 * @route   GET /api/productores/buscar
 * @desc    Buscar productores por nombre, empresa o ubicación
 * @access  Public
 */
router.get(
  '/buscar',
  productorValidator.buscar,
  validate,
  productorController.buscarProductores
);

// ============================================================================
// RUTAS PROTEGIDAS - Requieren autenticación
// ============================================================================
// ⚠️ IMPORTANTE: Estas rutas deben ir ANTES de las rutas con parámetros (:id)
// porque Express matchea rutas en orden. Si /:id va primero, capturará /perfil

/**
 * @route   GET /api/productor/perfil
 * @desc    Obtener perfil del productor autenticado
 * @access  Private (Productor)
 */
router.get(
  '/perfil',
  isAuthenticated,
  hasRole('productor'),
  productorController.obtenerPerfil
);

/**
 * @route   PUT /api/productor/perfil
 * @desc    Actualizar perfil del productor autenticado
 * @access  Private (Productor)
 */
router.put(
  '/perfil',
  isAuthenticated,
  hasRole('productor'),
  productorValidator.actualizarPerfil,
  validate,
  productorController.actualizarPerfil
);

// ============================================================================
// GALERÍA DEL CRIADERO
// ============================================================================

// POST /api/productor/galeria — subir foto o video a Cloudinary
router.post(
  '/galeria',
  isAuthenticated,
  hasRole('productor'),
  upload.single('media'),
  productorController.subirMedia
);

// DELETE /api/productor/galeria/:index — eliminar item por índice
router.delete(
  '/galeria/:index',
  isAuthenticated,
  hasRole('productor'),
  productorController.eliminarMedia
);

// POST /api/productor/perfil/qr — subir QR de pago
router.post(
  '/perfil/qr',
  isAuthenticated,
  hasRole('productor'),
  upload.single('qr'),
  productorController.subirQRPago
);

// POST /api/productor/foto-perfil — subir foto de perfil
router.post(
  '/foto-perfil',
  isAuthenticated,
  hasRole('productor'),
  upload.single('foto'),
  productorController.subirFotoPerfil
);

// POST /api/productor/foto-portada — subir foto de portada (banner)
router.post(
  '/foto-portada',
  isAuthenticated,
  hasRole('productor'),
  upload.single('foto'),
  productorController.subirFotoPortada
);

// ============================================================================
// RUTAS PÚBLICAS CON PARÁMETROS
// ============================================================================
// ⚠️ IMPORTANTE: Estas rutas van DESPUÉS de las rutas específicas (/perfil)

/**
 * @route   GET /api/productores/:id
 * @desc    Obtener un productor por ID
 * @access  Public
 */
router.get(
  '/:id',
  productorValidator.obtenerPorId,
  validate,
  productorController.obtenerProductorPorId
);

/**
 * @route   GET /api/productores/:id/productos
 * @desc    Obtener productos de un productor
 * @access  Public
 */
router.get(
  '/:id/productos',
  productorValidator.obtenerPorId,
  validate,
  productorController.obtenerProductos
);

/**
 * @route   PUT /api/productores/:id
 * @desc    Actualizar productor por ID (solo el propio productor o admin)
 * @access  Private
 */
router.put(
  '/:id',
  isAuthenticated,
  (req, res, next) => {
    const esAdmin    = req.user.rol === 'admin';
    const esPropietario = req.user.id === parseInt(req.params.id);
    if (esAdmin || esPropietario) return next();
    return res.status(403).json({ success: false, message: 'No tienes permiso para modificar este perfil.' });
  },
  productorValidator.obtenerPorId,
  productorValidator.actualizarPerfil,
  validate,
  productorController.actualizarProductorPorId
);

module.exports = router;