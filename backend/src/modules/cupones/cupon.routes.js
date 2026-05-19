// src/modules/cupones/cupon.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./cupon.controller');
const { isAuthenticated, hasRole } = require('../../middlewares/auth.middleware');
const { createLimiter } = require('../../middlewares/rateLimiter.middleware');

// POST /api/cupones/validar — any authenticated user checks a coupon
router.post('/validar', isAuthenticated, createLimiter, ctrl.validar);

// GET /api/cupones — solo productor y admin
router.get('/', isAuthenticated, hasRole('productor', 'admin'), ctrl.listar);

// POST /api/cupones — solo admin crea cupones
router.post('/', isAuthenticated, hasRole('admin'), createLimiter, ctrl.crear);

// DELETE /api/cupones/:id — solo admin elimina
router.delete('/:id', isAuthenticated, hasRole('admin'), ctrl.eliminar);

// POST /api/cupones/:id/usar — increment usage (internal)
router.post('/:id/usar', isAuthenticated, ctrl.usar);

module.exports = router;
