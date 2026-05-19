// src/modules/asistente/asistente.routes.js
const express    = require('express');
const router     = express.Router();
const { chat }   = require('./asistente.controller');
const { isAuthenticated } = require('../../middlewares/auth.middleware');
const { aiLimiter }       = require('../../middlewares/rateLimiter.middleware');

router.post('/', isAuthenticated, aiLimiter, chat);

module.exports = router;
