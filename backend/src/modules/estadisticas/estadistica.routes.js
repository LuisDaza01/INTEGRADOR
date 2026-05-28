// estadistica.routes.js - Rutas para Estadísticas
const express = require('express');
const router = express.Router();
const estadisticaController = require('./estadistica.controller');
const { isAuthenticated, hasRole } = require('../../middlewares/auth.middleware');

// Rutas para productor
router.get('/productor',  isAuthenticated, hasRole('productor'), estadisticaController.obtenerEstadisticasProductor);
router.get('/ventas',     isAuthenticated, hasRole('productor'), estadisticaController.obtenerEstadisticasVentas);
router.get('/productos',  isAuthenticated, hasRole('productor'), estadisticaController.obtenerEstadisticasProductos);
router.get('/prediccion', isAuthenticated, hasRole('productor'), estadisticaController.obtenerPrediccionVentas);
router.get('/marketing',  isAuthenticated, hasRole('productor'), estadisticaController.obtenerMarketingAnalytics);
router.get('/excel',      isAuthenticated, hasRole('productor'), estadisticaController.exportarExcel);

// Resumen mensual IA (Claude)
router.get ('/resumen-mensual',         isAuthenticated, hasRole('productor'), estadisticaController.obtenerResumenMensual);
router.post('/resumen-mensual/generar', isAuthenticated, hasRole('productor'), estadisticaController.regenerarResumenMensual);

// Rutas admin
router.get('/admin/productores',      isAuthenticated, hasRole('admin'), estadisticaController.obtenerVentasPorProductor);
router.get('/admin/resumen',          isAuthenticated, hasRole('admin'), estadisticaController.obtenerResumenGlobal);
router.get('/admin/ventas-mensuales', isAuthenticated, hasRole('admin'), estadisticaController.obtenerVentasMensualesAdmin);
router.get('/admin/pedidos-estado',   isAuthenticated, hasRole('admin'), estadisticaController.obtenerPedidosPorEstadoAdmin);
router.get('/admin/top-productos',    isAuthenticated, hasRole('admin'), estadisticaController.obtenerTopProductosAdmin);

module.exports = router;
