const repo = require('./notificacion.repository');
const { AppError } = require('../../utils/errors');
const { emitNuevaNotificacion } = require('../../socket/chat.socket');

class NotificacionService {
  async crear(data) {
    try {
      const notif = await repo.crear(data);
      if (notif) emitNuevaNotificacion(data.usuario_id, notif);
      return notif;
    } catch (error) {
      // Silently ignore notification errors to avoid breaking the caller
      console.error('[notificacion.service] crear error:', error.message);
      return null;
    }
  }

  async listar(usuarioId) {
    try {
      return await repo.findByUsuario(usuarioId);
    } catch (error) {
      throw new AppError('Error al obtener notificaciones', 500);
    }
  }

  async contarNoLeidas(usuarioId) {
    try {
      return await repo.contarNoLeidas(usuarioId);
    } catch {
      return 0;
    }
  }

  async marcarLeida(id, usuarioId) {
    try {
      const n = await repo.marcarLeida(id, usuarioId);
      if (!n) throw new AppError('Notificación no encontrada', 404);
      return n;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al marcar notificación', 500);
    }
  }

  async marcarTodasLeidas(usuarioId) {
    try {
      await repo.marcarTodasLeidas(usuarioId);
    } catch (error) {
      throw new AppError('Error al marcar notificaciones', 500);
    }
  }
}

module.exports = new NotificacionService();
