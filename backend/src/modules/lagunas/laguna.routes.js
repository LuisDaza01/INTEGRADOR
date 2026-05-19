const express = require('express');
const router  = express.Router();
const ctrl    = require('./laguna.controller');
const { isAuthenticated, isProductor } = require('../../middlewares/auth.middleware');

// Todas las rutas requieren auth de productor
router.use(isAuthenticated, isProductor);

// ── Especies ───────────────────────────────────────
router.get ('/especies',         ctrl.getEspecies);
router.post('/especies',         ctrl.crearEspecie);

// ── Tipos y stock de alimento ──────────────────────
router.get ('/alimento/tipos',   ctrl.getTiposAlimento);
router.get ('/alimento/stock',   ctrl.getStockAlimento);
router.post('/alimento/compra',  ctrl.registrarCompraAlimento);

// ── Lagunas CRUD ───────────────────────────────────
router.get ('/',      ctrl.getMisLagunas);
router.post('/',      ctrl.crearLaguna);
router.get ('/:id',   ctrl.getLagunaDetalle);
router.put ('/:id',   ctrl.actualizarLaguna);
router.delete('/:id', ctrl.eliminarLaguna);

// ── Dispositivo IoT ────────────────────────────────
router.put ('/:id/dispositivo', ctrl.vincularDispositivo);

// ── Siembras ───────────────────────────────────────
router.post('/:id/siembras',  ctrl.iniciarSiembra);
router.post('/:id/cosechar',  ctrl.cosechar);

// ── Movimientos ────────────────────────────────────
router.post('/:id/movimientos', ctrl.registrarMovimiento);
router.get ('/:id/movimientos', ctrl.getMovimientos);

// ── Historial de siembras ──────────────────────────
router.get ('/:id/historial',   ctrl.getHistorial);

module.exports = router;
