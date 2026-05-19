// opinion.routes.js
const express = require('express');
const router = express.Router();
const opinionController = require('./opinion.controller');
const { crearOpinion, responderOpinion } = require('./opinion.validator');
const { isAuthenticated } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { createLimiter } = require('../../middlewares/rateLimiter.middleware');

router.post('/', isAuthenticated, createLimiter, crearOpinion, validate, opinionController.crear);
router.get('/producto/:producto_id', opinionController.listarPorProducto);
router.get('/productor/:productor_id', opinionController.listarPorProductor);
router.put('/:id/respuesta', isAuthenticated, responderOpinion, validate, opinionController.responder);

module.exports = router;
