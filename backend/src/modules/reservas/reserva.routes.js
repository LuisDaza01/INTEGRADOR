// src/modules/reservas/reserva.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('./reserva.controller');
const { isAuthenticated, hasRole } = require('../../middlewares/auth.middleware');

router.use(isAuthenticated);

router.get('/',                          ctrl.listar);
router.get('/:id',                       ctrl.detalle);

router.post('/',                         ctrl.crear);
router.patch('/:id/aceptar',             hasRole('productor'), ctrl.aceptar);
router.patch('/:id/rechazar',            hasRole('productor'), ctrl.rechazar);
router.patch('/:id/cancelar',            hasRole('consumidor'), ctrl.cancelar);

module.exports = router;
