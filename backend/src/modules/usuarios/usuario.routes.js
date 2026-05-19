const express = require('express');
const router = express.Router();
const usuarioController = require('./usuario.controller');
const { isAuthenticated, hasRole } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

// Perfil del usuario autenticado
router.get('/perfil', isAuthenticated, usuarioController.obtenerPerfil);
router.put('/perfil', isAuthenticated, usuarioController.actualizarPerfil);
router.put('/foto-perfil', isAuthenticated, upload.single('foto'), usuarioController.subirFotoPerfil);

// Cambiar contraseña y push token
router.put('/cambiar-password', isAuthenticated, usuarioController.cambiarPassword);
router.post('/push-token', isAuthenticated, usuarioController.guardarPushToken);

// Configuración del productor: minutos de espera para confirmación de precio
router.patch('/minutos-confirmacion', isAuthenticated, hasRole('productor'), usuarioController.actualizarMinutosConfirmacion);

// Rutas admin
router.get('/admin/todos', isAuthenticated, hasRole('admin'), usuarioController.obtenerTodosUsuarios);
router.patch('/admin/:id/estado', isAuthenticated, hasRole('admin'), usuarioController.cambiarEstadoUsuario);
router.put('/admin/:id', isAuthenticated, hasRole('admin'), usuarioController.editarUsuario);
router.delete('/admin/:id', isAuthenticated, hasRole('admin'), usuarioController.eliminarUsuario);

module.exports = router;
