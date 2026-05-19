// src/modules/pescado/pescado.routes.js
const express = require('express');
const router  = express.Router();
const { analizarFrescura } = require('./pescado.controller');
const { isAuthenticated }  = require('../../middlewares/auth.middleware');
const { aiLimiter }        = require('../../middlewares/rateLimiter.middleware');

// POST /api/pescado/analizar-frescura
router.post('/analizar-frescura', isAuthenticated, aiLimiter, analizarFrescura);

module.exports = router;
