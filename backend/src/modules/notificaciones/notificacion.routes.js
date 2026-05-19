const express = require('express');
const router = express.Router();
const ctrl = require('./notificacion.controller');
const { isAuthenticated } = require('../../middlewares/auth.middleware');

router.get('/',                     isAuthenticated, ctrl.listar);
router.patch('/leer-todas',         isAuthenticated, ctrl.marcarTodasLeidas);
router.patch('/:id/leer',           isAuthenticated, ctrl.marcarLeida);

module.exports = router;
