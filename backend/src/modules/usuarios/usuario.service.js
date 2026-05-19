// usuario.service.js
const usuarioRepository = require('./usuario.repository');
const { AppError } = require('../../utils/errors');

class UsuarioService {
  async obtenerPerfil(id) {
    try {
      const usuario = await usuarioRepository.findById(id);
      if (!usuario) throw new AppError('Usuario no encontrado', 404);
      return usuario;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al obtener perfil', 500);
    }
  }

  async actualizarPerfil(id, data) {
    try {
      const usuario = await usuarioRepository.update(id, data);
      if (!usuario) throw new AppError('Usuario no encontrado', 404);
      return usuario;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al actualizar perfil', 500);
    }
  }

  async obtenerTodosUsuarios() {
    try {
      return await usuarioRepository.findAll();
    } catch (error) {
      throw new AppError('Error al obtener usuarios', 500);
    }
  }

  async cambiarEstadoUsuario(id, activo) {
    try {
      const usuario = await usuarioRepository.findById(id);
      if (!usuario) throw new AppError('Usuario no encontrado', 404);
      if (usuario.rol_id === 1) throw new AppError('No se puede modificar el estado de un administrador', 403);
      return await usuarioRepository.setActivo(id, activo);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al cambiar estado del usuario', 500);
    }
  }

  async editarUsuario(id, data) {
    try {
      const usuario = await usuarioRepository.findById(id);
      if (!usuario) throw new AppError('Usuario no encontrado', 404);
      return await usuarioRepository.adminUpdate(id, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al editar usuario', 500);
    }
  }

  async eliminarUsuario(id) {
    try {
      const usuario = await usuarioRepository.findById(id);
      if (!usuario) throw new AppError('Usuario no encontrado', 404);
      if (usuario.rol_id === 1) throw new AppError('No se puede eliminar un administrador', 403);
      await usuarioRepository.deleteById(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al eliminar usuario', 500);
    }
  }

  async cambiarPassword(id, currentPassword, newPassword) {
    const bcrypt = require('bcryptjs');
    try {
      const row = await usuarioRepository.findPasswordById(id);
      if (!row) throw new AppError('Usuario no encontrado', 404);
      const valid = await bcrypt.compare(currentPassword, row.password);
      if (!valid) throw new AppError('Contraseña actual incorrecta', 401);
      const hashed = await bcrypt.hash(newPassword, 10);
      await usuarioRepository.updatePassword(id, hashed);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al cambiar contraseña', 500);
    }
  }

  async guardarPushToken(id, token) {
    try {
      await usuarioRepository.updatePushToken(id, token);
    } catch (error) {
      throw new AppError('Error al guardar push token', 500);
    }
  }
}

module.exports = new UsuarioService();
