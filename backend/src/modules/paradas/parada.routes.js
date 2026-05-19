// src/modules/paradas/parada.routes.js
const express = require('express');
const router = express.Router();
const paradaController = require('./parada.controller');
const { isAuthenticated, hasRole } = require('../../middlewares/auth.middleware');

// ✅ Pública — cualquier consumidor puede ver las paradas
router.get('/', paradaController.getAll);
router.get('/:id', paradaController.getById);

// Solo admin puede crear/editar/eliminar paradas
router.post('/', isAuthenticated, hasRole('admin'), paradaController.create);
router.put('/:id', isAuthenticated, hasRole('admin'), paradaController.update);
router.delete('/:id', isAuthenticated, hasRole('admin'), paradaController.delete);

module.exports = router;
