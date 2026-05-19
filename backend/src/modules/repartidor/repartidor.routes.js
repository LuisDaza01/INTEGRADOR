// src/modules/repartidor/repartidor.routes.js
const express = require('express');
const router = express.Router();
const repartidorController = require('./repartidor.controller');
const { isAuthenticated, hasRole } = require('../../middlewares/auth.middleware');

// Guardar push token
router.post('/push-token', isAuthenticated, repartidorController.guardarPushToken);

// Ver pedidos disponibles
router.get('/pedidos-disponibles', isAuthenticated, hasRole('repartidor'), repartidorController.getPedidosDisponibles);

// Ingresar código → notifica consumidor
router.post('/pedidos/:id/recoger', isAuthenticated, hasRole('repartidor'), repartidorController.confirmarRecogida);

// Marcar entregado
router.post('/pedidos/:id/entregar', isAuthenticated, hasRole('repartidor'), repartidorController.confirmarEntrega);

// ✅ NUEVO: Actualizar ubicación GPS del conductor
router.post('/pedidos/:id/ubicacion', isAuthenticated, hasRole('repartidor'), repartidorController.actualizarUbicacion);

// Historial
router.get('/mis-pedidos', isAuthenticated, hasRole('repartidor'), repartidorController.getMisPedidos);

// Calificaciones
router.post('/pedidos/:id/calificar', isAuthenticated, hasRole('consumidor'), repartidorController.calificar);
router.get('/calificaciones',         isAuthenticated, hasRole('repartidor'), repartidorController.misCalificaciones);

module.exports = router;