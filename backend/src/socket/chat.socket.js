// src/socket/chat.socket.js
const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const logger = require('../utils/logger');

let _io = null;

const roomName = (uid1, uid2) =>
  `chat:${Math.min(uid1, uid2)}_${Math.max(uid1, uid2)}`;

// Extract token from socket handshake — try auth payload first (mobile/legacy),
// then fall back to the httpOnly cookie sent by the browser.
const extractSocketToken = (socket) => {
  if (socket.handshake.auth?.token) return socket.handshake.auth.token;
  const cookieHeader = socket.handshake.headers?.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map(p => p.trim()).find(p => p.startsWith('token='));
  return match ? decodeURIComponent(match.slice('token='.length)) : null;
};

const initSocket = (io) => {
  _io = io;

  io.use((socket, next) => {
    const token = extractSocketToken(socket);
    if (!token) return next(new Error('Token requerido'));
    try {
      socket.user = jwt.verify(token, config.jwt.secret);
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket conectado: ${socket.id} | usuario: ${socket.user?.id}`);

    // Auto-join personal room for order status updates
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Client passes the other user's id; server computes the canonical room name
    socket.on('join_chat', (destinatarioId) => {
      const room = roomName(socket.user.id, destinatarioId);
      socket.join(room);
      logger.info(`   └─ ${socket.id} unido a sala ${room}`);
    });

    socket.on('leave_chat', (destinatarioId) => {
      socket.leave(roomName(socket.user.id, destinatarioId));
    });

    socket.on('join_tracking', (pedidoId) => {
      socket.join(`tracking:${pedidoId}`);
    });

    socket.on('leave_tracking', (pedidoId) => {
      socket.leave(`tracking:${pedidoId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket desconectado: ${socket.id}`);
    });
  });
};

// Called by mensaje.controller after saving to DB
const emitNuevoMensaje = (remitenteId, destinatarioId, mensaje) => {
  if (_io) {
    _io.to(roomName(remitenteId, destinatarioId)).emit('nuevo_mensaje', mensaje);
  }
};

// Called by pedido.service when order status changes — notifies the consumer in real time
const emitPedidoActualizado = (consumidorId, pedido) => {
  if (_io) {
    _io.to(`user:${consumidorId}`).emit('pedido_actualizado', pedido);
  }
};

// Called by notificacion.service when a notification is created
const emitNuevaNotificacion = (usuarioId, notificacion) => {
  if (_io) {
    _io.to(`user:${usuarioId}`).emit('nueva_notificacion', notificacion);
  }
};

// Called by repartidor.controller when driver sends GPS update
const emitUbicacionConductor = (pedidoId, lat, lng) => {
  if (_io) {
    _io.to(`tracking:${pedidoId}`).emit('ubicacion_conductor', { pedidoId, lat, lng });
  }
};

module.exports = { initSocket, emitNuevoMensaje, emitPedidoActualizado, emitNuevaNotificacion, emitUbicacionConductor };
