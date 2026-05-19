// usuario.controller.js
const usuarioService = require('./usuario.service');
const { successResponse, errorResponse } = require('../../utils/response');
const { query } = require('../../config/database');

class UsuarioController {
  async obtenerPerfil(req, res) {
    try {
      const { id } = req.user;
      const usuario = await usuarioService.obtenerPerfil(id);
      return successResponse(res, usuario, 'Perfil obtenido correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async actualizarPerfil(req, res) {
    try {
      const { id } = req.user;
      const usuario = await usuarioService.actualizarPerfil(id, req.body);
      return successResponse(res, usuario, 'Perfil actualizado correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async obtenerTodosUsuarios(req, res) {
    try {
      const usuarios = await usuarioService.obtenerTodosUsuarios();
      return successResponse(res, usuarios, 'Usuarios obtenidos correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async cambiarEstadoUsuario(req, res) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      const usuario = await usuarioService.cambiarEstadoUsuario(id, activo);
      const msg = activo ? 'Usuario reactivado correctamente' : 'Usuario dado de baja correctamente';
      return successResponse(res, usuario, msg);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async editarUsuario(req, res) {
    try {
      const { id } = req.params;
      const usuario = await usuarioService.editarUsuario(id, req.body);
      return successResponse(res, usuario, 'Usuario actualizado correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async eliminarUsuario(req, res) {
    try {
      const { id } = req.params;
      await usuarioService.eliminarUsuario(id);
      return successResponse(res, null, 'Usuario eliminado correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async cambiarPassword(req, res) {
    try {
      const { id } = req.user;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return errorResponse(res, 'Se requieren currentPassword y newPassword', 400);
      }
      if (newPassword.length < 6) {
        return errorResponse(res, 'La nueva contraseña debe tener al menos 6 caracteres', 400);
      }
      await usuarioService.cambiarPassword(id, currentPassword, newPassword);
      return successResponse(res, null, 'Contraseña cambiada correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async guardarPushToken(req, res) {
    try {
      const { id } = req.user;
      const { pushToken } = req.body;
      if (!pushToken) return errorResponse(res, 'pushToken requerido', 400);
      await usuarioService.guardarPushToken(id, pushToken);
      return successResponse(res, null, 'Push token guardado');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async subirFotoPerfil(req, res) {
    try {
      if (!req.file) return errorResponse(res, 'No se recibió ningún archivo', 400);
      const { id } = req.user;
      const url = req.file.path;
      await query(
        `UPDATE usuarios SET foto_perfil = $1, updated_at = NOW() WHERE id = $2`,
        [url, id]
      );
      return successResponse(res, { foto_perfil: url }, 'Foto de perfil actualizada');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async actualizarMinutosConfirmacion(req, res) {
    try {
      const { id } = req.user;
      const min = parseInt(req.body.minutos, 10);
      if (!Number.isFinite(min)) return errorResponse(res, 'minutos requerido', 400);
      if (min < 5 || min > 60) {
        return errorResponse(res, 'El valor debe estar entre 5 y 60 minutos', 400);
      }
      await query(
        `UPDATE usuarios SET minutos_confirmacion = $1, updated_at = NOW() WHERE id = $2`,
        [min, id]
      );
      return successResponse(res, { minutos_confirmacion: min }, 'Tiempo de confirmación actualizado');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

module.exports = new UsuarioController();
