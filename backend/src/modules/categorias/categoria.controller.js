// categoria.controller.js - Controlador para Categorías
const categoriaService = require('./categoria.service');
const { successResponse, errorResponse } = require('../../utils/response');

class CategoriaController {
  /**
   * Obtener todas las categorías
   * GET /api/categorias
   */
  async obtenerCategorias(req, res) {
    try {
      const { incluir_conteo } = req.query;
      const incluirConteo = incluir_conteo === 'true';
      
      const categorias = await categoriaService.obtenerCategorias(incluirConteo);
      return successResponse(res, categorias, 'Categorías obtenidas correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Obtener categoría por ID
   * GET /api/categorias/:id
   */
  async obtenerCategoriaPorId(req, res) {
    try {
      const { id } = req.params;
      const { incluir_conteo } = req.query;
      const incluirConteo = incluir_conteo === 'true';
      
      const categoria = await categoriaService.obtenerCategoriaPorId(id, incluirConteo);
      return successResponse(res, categoria, 'Categoría obtenida correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Crear nueva categoría
   * POST /api/categorias
   */
  async crearCategoria(req, res) {
    try {
      const categoriaData = req.body;
      const categoria = await categoriaService.crearCategoria(categoriaData);
      return successResponse(res, categoria, 'Categoría creada exitosamente', 201);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Actualizar categoría
   * PUT /api/categorias/:id
   */
  async actualizarCategoria(req, res) {
    try {
      const { id } = req.params;
      const categoriaData = req.body;
      
      const categoria = await categoriaService.actualizarCategoria(id, categoriaData);
      return successResponse(res, categoria, 'Categoría actualizada correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Eliminar categoría
   * DELETE /api/categorias/:id
   */
  async eliminarCategoria(req, res) {
    try {
      const { id } = req.params;
      const categoria = await categoriaService.eliminarCategoria(id);
      return successResponse(res, categoria, 'Categoría eliminada correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

module.exports = new CategoriaController();