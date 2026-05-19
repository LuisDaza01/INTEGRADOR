// src/modules/pedidos/pedido.routes.js
const express    = require('express');
const router     = express.Router();
const pedidoController  = require('./pedido.controller');
const pedidoValidator   = require('./pedido.validator');
const { isAuthenticated, hasRole } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const repartidorController = require('../repartidor/repartidor.controller');
const upload = require('../../middlewares/upload.middleware');

// ── GET /api/pedidos ──────────────────────────────────────────
router.get('/',          isAuthenticated, pedidoController.obtenerPedidos);
router.get('/recientes', isAuthenticated, pedidoController.obtenerPedidosRecientes);
router.get('/recibidos', isAuthenticated, hasRole('productor'), pedidoController.obtenerPedidosRecibidos);
router.get('/historial', isAuthenticated, hasRole('consumidor'), pedidoValidator.obtenerHistorial, validate, pedidoController.obtenerHistorial);
router.get('/stats/consumidor', isAuthenticated, pedidoController.statsConsumidor);
router.get('/admin/todos', isAuthenticated, hasRole('admin'), pedidoController.obtenerTodosPedidos);

// ── Tracking (antes de /:id para que Express no lo confunda) ──
router.get('/:id/tracking', isAuthenticated, repartidorController.getTracking);

// ── GET /api/pedidos/:id ──────────────────────────────────────
router.get('/:id', isAuthenticated, pedidoValidator.obtenerPorId, validate, pedidoController.obtenerPedidoPorId);

// ── POST /api/pedidos ─────────────────────────────────────────
router.post('/', isAuthenticated, pedidoValidator.crearPedido, validate, pedidoController.crearPedido);

// ── PUT /api/pedidos/:id/estado ───────────────────────────────
router.put(
  '/:id/estado',
  isAuthenticated,
  hasRole('productor'),
  pedidoValidator.actualizarEstado,
  validate,
  pedidoController.actualizarEstado
);

// ═══════════════════════════════════════════════════════════════
// ✅ NUEVO: Productor registra peso POR ITEM del pedido
// PUT /api/pedidos/:id/pesar-items
// Body: { items: [{ detalle_id, cantidad_pescados, peso_real_kg }, ...] }
// ═══════════════════════════════════════════════════════════════
router.put(
  '/:id/pesar-items',
  isAuthenticated,
  hasRole('productor'),
  pedidoValidator.registrarPesoItems,
  validate,
  pedidoController.registrarPesoItems
);

// ── PUT /api/pedidos/:id/pesar (LEGADO) ───────────────────────
// Mantiene compatibilidad con el flujo de peso global
router.put(
  '/:id/pesar',
  isAuthenticated,
  hasRole('productor'),
  pedidoValidator.registrarPeso,
  validate,
  pedidoController.registrarPeso
);

// ── POST /api/pedidos/:id/comprobante ─────────────────────────
// Consumidor sube foto del comprobante de pago QR
router.post(
  '/:id/comprobante',
  isAuthenticated,
  hasRole('consumidor'),
  upload.single('comprobante'),
  pedidoController.subirComprobante
);

// ── POST /api/pedidos/:id/confirmar-precio ────────────────────
router.post(
  '/:id/confirmar-precio',
  isAuthenticated,
  hasRole('consumidor'),
  pedidoController.confirmarPrecio
);

// ── POST /api/pedidos/:id/rechazar-precio ─────────────────────
router.post(
  '/:id/rechazar-precio',
  isAuthenticated,
  hasRole('consumidor'),
  pedidoController.rechazarPrecio
);

module.exports = router;