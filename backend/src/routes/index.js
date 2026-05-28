// ============================================
// src/routes/index.js - ROUTER PRINCIPAL
// ============================================

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// ============================================
// IMPORTAR ROUTERS DE MÓDULOS
// ============================================

const authRouter = require('../modules/auth/auth.routes');
const productosRouter = require('../modules/productos/producto.routes');
const pedidosRouter = require('../modules/pedidos/pedido.routes');
const carritoRouter = require('../modules/carrito/carrito.routes');
const productoresRouter = require('../modules/productores/productor.routes');
const estadisticasRouter = require('../modules/estadisticas/estadistica.routes');
const categoriasRouter = require('../modules/categorias/categoria.routes');
const usuariosRouter = require('../modules/usuarios/usuario.routes');
const repartidorRouter = require('../modules/repartidor/repartidor.routes');
const paradasRouter = require('../modules/paradas/parada.routes');
const opinionesRouter = require('../modules/opiniones/opinion.routes');
const mensajesRouter  = require('../modules/mensajes/mensaje.routes');
const cuponesRouter    = require('../modules/cupones/cupon.routes');
const asistenteRouter       = require('../modules/asistente/asistente.routes');
const notificacionesRouter  = require('../modules/notificaciones/notificacion.routes');
const lagunasRouter         = require('../modules/lagunas/laguna.routes');
const pescadoRouter         = require('../modules/pescado/pescado.routes');
const inventarioRouter      = require('../modules/inventario/inventario.routes');
const disponibilidadRouter  = require('../modules/disponibilidad/disponibilidad.routes');
const reservasRouter        = require('../modules/reservas/reserva.routes');
const dispositivosRouter    = require('../modules/dispositivos/dispositivo.routes');

// ============================================
// RUTA RAÍZ DE LA API
// ============================================

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenido a NaturaPiscis API',
    version: '2.0.0',
    arquitectura: 'Clean Architecture - Modular',
    modulosImplementados: [
      'auth', 'productos', 'pedidos', 'carrito', 'productores',
      'estadisticas', 'categorias', 'usuarios', 'repartidor', 'paradas',
    ],
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/registro',
        verify: 'GET /api/auth/verificar',
        logout: 'POST /api/auth/logout',
      },
      productos: {
        listar: 'GET /api/productos',
        destacados: 'GET /api/productos/destacados',
        buscar: 'GET /api/productos/buscar?q=',
        detalle: 'GET /api/productos/:id',
        crear: 'POST /api/productos (requiere auth productor)',
        actualizar: 'PUT /api/productos/:id (requiere auth productor)',
        eliminar: 'DELETE /api/productos/:id (requiere auth productor)',
      },
      pedidos: {
        listar: 'GET /api/pedidos (requiere auth)',
        recientes: 'GET /api/pedidos/recientes (requiere auth)',
        recibidos: 'GET /api/pedidos/recibidos (requiere auth productor)',
        historial: 'GET /api/pedidos/historial (requiere auth)',
        detalle: 'GET /api/pedidos/:id (requiere auth)',
        tracking: 'GET /api/pedidos/:id/tracking (requiere auth consumidor)',
        crear: 'POST /api/pedidos (requiere auth consumidor)',
        actualizarEstado: 'PUT /api/pedidos/:id/estado (requiere auth productor)',
      },
      carrito: {
        ver: 'GET /api/carrito (requiere auth)',
        agregar: 'POST /api/carrito (requiere auth)',
        actualizar: 'PUT /api/carrito/:id (requiere auth)',
        eliminar: 'DELETE /api/carrito/:id (requiere auth)',
        limpiar: 'DELETE /api/carrito/limpiar (requiere auth)',
        migrar: 'POST /api/carrito/migrar (requiere auth)',
      },
      productores: {
        listar: 'GET /api/productores',
        buscar: 'GET /api/productores/buscar?q=',
        detalle: 'GET /api/productores/:id',
        productos: 'GET /api/productores/:id/productos',
        actualizar: 'PUT /api/productores/:id',
        perfil: 'GET /api/productor/perfil (requiere auth productor)',
        actualizarPerfil: 'PUT /api/productor/perfil (requiere auth productor)',
      },
      estadisticas: {
        productor: 'GET /api/estadisticas/productor (requiere auth productor)',
        ventas: 'GET /api/estadisticas/ventas (requiere auth productor)',
        productos: 'GET /api/estadisticas/productos (requiere auth productor)',
      },
      categorias: {
        listar: 'GET /api/categorias',
        detalle: 'GET /api/categorias/:id',
        crear: 'POST /api/categorias (requiere auth admin)',
        actualizar: 'PUT /api/categorias/:id (requiere auth admin)',
        eliminar: 'DELETE /api/categorias/:id (requiere auth admin)',
      },
      usuarios: {
        perfil: 'GET /api/usuarios/perfil (requiere auth)',
        actualizar: 'PUT /api/usuarios/perfil (requiere auth)',
      },
      repartidor: {
        pushToken: 'POST /api/repartidor/push-token (requiere auth)',
        disponibles: 'GET /api/repartidor/pedidos-disponibles (requiere auth repartidor)',
        recoger: 'POST /api/repartidor/pedidos/:id/recoger (requiere auth repartidor)',
        entregar: 'POST /api/repartidor/pedidos/:id/entregar (requiere auth repartidor)',
        misPedidos: 'GET /api/repartidor/mis-pedidos (requiere auth repartidor)',
      },
      paradas: {
        listar: 'GET /api/paradas',
        detalle: 'GET /api/paradas/:id',
        crear: 'POST /api/paradas (requiere auth admin)',
        actualizar: 'PUT /api/paradas/:id (requiere auth admin)',
        eliminar: 'DELETE /api/paradas/:id (requiere auth admin)',
      },
    },
    documentation: 'https://docs.naturapiscis.com',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// MONTAR ROUTERS DE MÓDULOS
// ============================================

router.use('/auth', authRouter);
logger.info('✅ Módulo de autenticación cargado en /api/auth');

router.use('/productos', productosRouter);
logger.info('✅ Módulo de productos cargado en /api/productos');

router.use('/pedidos', pedidosRouter);
logger.info('✅ Módulo de pedidos cargado en /api/pedidos');

router.use('/carrito', carritoRouter);
logger.info('✅ Módulo de carrito cargado en /api/carrito');

router.use('/productores', productoresRouter);
router.use('/productor', productoresRouter);
logger.info('✅ Módulo de productores cargado en /api/productores y /api/productor');

router.use('/estadisticas', estadisticasRouter);
logger.info('✅ Módulo de estadísticas cargado en /api/estadisticas');

router.use('/categorias', categoriasRouter);
logger.info('✅ Módulo de categorías cargado en /api/categorias');

router.use('/usuarios', usuariosRouter);
logger.info('✅ Módulo de usuarios cargado en /api/usuarios');

router.use('/repartidor', repartidorRouter);
logger.info('✅ Módulo de repartidor cargado en /api/repartidor');

router.use('/paradas', paradasRouter);
logger.info('✅ Módulo de paradas cargado en /api/paradas');

router.use('/opiniones', opinionesRouter);
logger.info('✅ Módulo de opiniones cargado en /api/opiniones');

router.use('/mensajes', mensajesRouter);
logger.info('✅ Módulo de mensajes cargado en /api/mensajes');

router.use('/cupones', cuponesRouter);
logger.info('✅ Módulo de cupones cargado en /api/cupones');

router.use('/asistente', asistenteRouter);
logger.info('✅ Módulo de asistente IA cargado en /api/asistente');

router.use('/notificaciones', notificacionesRouter);
logger.info('✅ Módulo de notificaciones cargado en /api/notificaciones');

router.use('/lagunas', lagunasRouter);
logger.info('✅ Módulo de lagunas cargado en /api/lagunas');

router.use('/pescado', pescadoRouter);
router.use('/inventario', inventarioRouter);
router.use('/disponibilidad', disponibilidadRouter);
router.use('/reservas', reservasRouter);
router.use('/dispositivos', dispositivosRouter);
logger.info('✅ Módulo de análisis de pescado cargado en /api/pescado');
logger.info('✅ Módulo de dispositivos IoT cargado en /api/dispositivos (admin)');

// ============================================
// RUTAS DE UTILIDAD
// ============================================

router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    modulosActivos: 10,
    modulos: [
      'auth', 'productos', 'pedidos', 'carrito', 'productores',
      'estadisticas', 'categorias', 'usuarios', 'repartidor', 'paradas',
    ],
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
    timestamp: new Date().toISOString(),
  });
});

router.get('/version', (req, res) => {
  const version = require('../../package.json').version;
  res.status(200).json({
    success: true,
    version,
    apiVersion: '2.0.0',
    arquitectura: 'Clean Architecture',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;