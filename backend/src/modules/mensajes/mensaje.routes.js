// src/modules/mensajes/mensaje.routes.js
const express = require('express');
const router  = express.Router();
const { listarConversaciones, listarDirecto, enviar, enviarMedia } = require('./mensaje.controller');
const { isAuthenticated } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

router.get('/conversaciones',      isAuthenticated, listarConversaciones);
router.get('/directo/:usuarioId',  isAuthenticated, listarDirecto);
router.post('/',                   isAuthenticated, enviar);
router.post('/media',              isAuthenticated, upload.single('archivo'), enviarMedia);

module.exports = router;
