const express = require('express');
const router  = express.Router();
const ctrl    = require('./dispositivo.controller');
const { isAuthenticated, isAdmin } = require('../../middlewares/auth.middleware');

// Todo el módulo es solo-admin
router.use(isAuthenticated, isAdmin);

router.get   ('/',                  ctrl.listar);
router.post  ('/',                  ctrl.crear);
router.patch ('/:id',               ctrl.actualizar);
router.post  ('/:id/liberar',       ctrl.liberar);
router.delete('/:id',               ctrl.eliminar);

module.exports = router;
