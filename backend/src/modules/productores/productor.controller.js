// productor.controller.js - Controlador para Productores
const productorService = require('./productor.service');
const cloudinary = require('../../config/cloudinary');
const { query } = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/response');

class ProductorController {
  /**
   * Obtener todos los productores
   * GET /api/productores?page=1&limit=12&q=texto&verificado=true
   */
  async obtenerProductores(req, res) {
    try {
      const { page = 1, limit = 12, q, verificado } = req.query;
      const result = await productorService.obtenerProductores(
        parseInt(page), parseInt(limit), { q, verificado }
      );
      return successResponse(res, result, 'Productores obtenidos correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Obtener productor por ID
   * GET /api/productores/:id
   */
  async obtenerProductorPorId(req, res) {
    try {
      const { id } = req.params;
      const productor = await productorService.obtenerProductorPorId(id);
      return successResponse(res, productor, 'Productor obtenido correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Obtener productos de un productor
   * GET /api/productores/:id/productos
   */
  async obtenerProductos(req, res) {
    try {
      const { id } = req.params;
      const productos = await productorService.obtenerProductosDeProductor(id);
      return successResponse(res, productos, 'Productos obtenidos correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Obtener perfil del productor autenticado
   * GET /api/productor/perfil
   */
  async obtenerPerfil(req, res) {
    try {
      const { id } = req.user;
      const productor = await productorService.obtenerPerfil(id);
      return successResponse(res, productor, 'Perfil obtenido correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Actualizar perfil del productor autenticado
   * PUT /api/productor/perfil
   */
  async actualizarPerfil(req, res) {
    try {
      const { id } = req.user;
      const data = req.body;

      const productor = await productorService.actualizarPerfil(id, data);
      return successResponse(res, productor, 'Perfil actualizado correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Actualizar productor por ID (público o admin)
   * PUT /api/productores/:id
   */
  async actualizarProductorPorId(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      const productor = await productorService.actualizarPerfil(id, data);
      return successResponse(res, productor, 'Productor actualizado correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Buscar productores
   * GET /api/productores/buscar
   */
  async buscarProductores(req, res) {
    try {
      const { q } = req.query;
      if (!q) return errorResponse(res, 'Término de búsqueda requerido', 400);
      const productores = await productorService.buscarProductores(q);
      return successResponse(res, { productores }, 'Búsqueda completada');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Subir foto o video a la galería del criadero
   * POST /api/productor/galeria
   */
  async subirMedia(req, res) {
    try {
      if (!req.file) return errorResponse(res, 'No se recibió ningún archivo', 400);

      const { id } = req.user;
      const { titulo } = req.body;
      const isVideo = req.file.mimetype?.startsWith('video/') ||
                      req.file.resource_type === 'video' ||
                      req.file.path?.includes('/video/');

      const nuevoItem = {
        url:        req.file.path,
        public_id:  req.file.filename,
        tipo:       isVideo ? 'video' : 'imagen',
        titulo:     titulo || null,
        categoria:  req.body.categoria || 'general',
        fecha:      new Date().toISOString(),
      };

      // Obtener galería actual y agregar el nuevo item
      const result = await query(
        `SELECT galeria_criadero FROM usuarios WHERE id = $1`, [id]
      );
      const galeriaActual = result[0]?.galeria_criadero || [];
      const galeriaActualizada = [...galeriaActual, nuevoItem];

      await query(
        `UPDATE usuarios SET galeria_criadero = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(galeriaActualizada), id]
      );

      return successResponse(res, { item: nuevoItem, galeria: galeriaActualizada }, 'Media subida correctamente', 201);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Eliminar item de la galería por índice
   * DELETE /api/productor/galeria/:index
   */
  async eliminarMedia(req, res) {
    try {
      const { id } = req.user;
      const index = parseInt(req.params.index);

      const result = await query(
        `SELECT galeria_criadero FROM usuarios WHERE id = $1`, [id]
      );
      const galeria = result[0]?.galeria_criadero || [];

      if (index < 0 || index >= galeria.length) {
        return errorResponse(res, 'Índice inválido', 400);
      }

      const item = galeria[index];

      // Eliminar de Cloudinary
      if (item.public_id) {
        const resourceType = item.tipo === 'video' ? 'video' : 'image';
        await cloudinary.uploader.destroy(item.public_id, { resource_type: resourceType });
      }

      const galeriaActualizada = galeria.filter((_, i) => i !== index);
      await query(
        `UPDATE usuarios SET galeria_criadero = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(galeriaActualizada), id]
      );

      return successResponse(res, { galeria: galeriaActualizada }, 'Media eliminada correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Subir foto de perfil
   * POST /api/productor/foto-perfil
   */
  async subirFotoPerfil(req, res) {
    try {
      if (!req.file) return errorResponse(res, 'No se recibió ningún archivo', 400);
      const { id } = req.user;
      const url = req.file.path;
      await query(
        `UPDATE usuarios SET foto_perfil = $1, updated_at = NOW() WHERE id = $2`,
        [url, id]
      );
      return successResponse(res, { foto_perfil: url }, 'Foto de perfil actualizada correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Subir QR de pago del productor
   * POST /api/productor/perfil/qr
   */
  async subirQRPago(req, res) {
    try {
      if (!req.file) return errorResponse(res, 'No se recibió ningún archivo', 400);
      const { id } = req.user;
      const url = req.file.path;
      await query(
        `UPDATE usuarios SET qr_pago_url = $1, updated_at = NOW() WHERE id = $2`,
        [url, id]
      );
      return successResponse(res, { qr_pago_url: url }, 'QR de pago actualizado correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Subir foto de portada (banner)
   * POST /api/productor/foto-portada
   */
  async subirFotoPortada(req, res) {
    try {
      if (!req.file) return errorResponse(res, 'No se recibió ningún archivo', 400);
      const { id } = req.user;
      const url = req.file.path;
      await query(
        `UPDATE usuarios SET foto_portada = $1, updated_at = NOW() WHERE id = $2`,
        [url, id]
      );
      return successResponse(res, { foto_portada: url }, 'Foto de portada actualizada correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

module.exports = new ProductorController();