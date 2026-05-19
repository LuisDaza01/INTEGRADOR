// ============================================================
// src/modules/productos/trazabilidad.routes.js
// Ruta pública de trazabilidad — no requiere autenticación
// ============================================================
const express = require('express');
const router = express.Router();
const trazabilidadController = require('./trazabilidad.controller');

// GET /api/productos/:id/trazabilidad — público, para el QR
router.get('/:id/trazabilidad', trazabilidadController.getTrazabilidad);

module.exports = router;