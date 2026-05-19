// src/modules/inventario/inventario.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('./inventario.controller');
const { isAuthenticated, hasRole } = require('../../middlewares/auth.middleware');

// Todas las rutas requieren productor autenticado
router.use(isAuthenticated, hasRole('productor'));

router.get('/stock',                       ctrl.stockProductor);
router.get('/historial',                   ctrl.historialProductor);
router.get('/productos/:id/historial',     ctrl.historialProducto);
router.post('/movimientos',                ctrl.registrar);

module.exports = router;
