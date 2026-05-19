const service = require('./notificacion.service');
const { successResponse, errorResponse } = require('../../utils/response');

class NotificacionController {
  async listar(req, res) {
    try {
      const notificaciones = await service.listar(req.user.id);
      const noLeidas = notificaciones.filter(n => !n.leida).length;
      return successResponse(res, { notificaciones, noLeidas }, 'OK');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async marcarLeida(req, res) {
    try {
      const n = await service.marcarLeida(Number(req.params.id), req.user.id);
      return successResponse(res, n, 'Notificación marcada como leída');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async marcarTodasLeidas(req, res) {
    try {
      await service.marcarTodasLeidas(req.user.id);
      return successResponse(res, null, 'Todas las notificaciones marcadas como leídas');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

module.exports = new NotificacionController();
