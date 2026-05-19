// src/modules/disponibilidad/disponibilidad.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('./disponibilidad.controller');
const { isAuthenticated, hasRole } = require('../../middlewares/auth.middleware');

// Endpoints del productor autenticado
router.get('/dias',                    isAuthenticated, hasRole('productor'), ctrl.misDias);
router.put('/dias',                    isAuthenticated, hasRole('productor'), ctrl.guardarDia);
router.delete('/dias/:dia',            isAuthenticated, hasRole('productor'), ctrl.borrarDia);

router.get('/excepciones',             isAuthenticated, hasRole('productor'), ctrl.misExcepciones);
router.put('/excepciones/bulk',        isAuthenticated, hasRole('productor'), ctrl.guardarExcepcionesBulk);
router.put('/excepciones',             isAuthenticated, hasRole('productor'), ctrl.guardarExcepcion);
router.delete('/excepciones/:fecha',   isAuthenticated, hasRole('productor'), ctrl.borrarExcepcion);

module.exports = router;
