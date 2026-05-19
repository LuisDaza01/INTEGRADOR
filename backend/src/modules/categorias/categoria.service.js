// categoria.service.js - Lógica de negocio para Categorías
const categoriaRepository = require('./categoria.repository');
const { AppError } = require('../../utils/errors');

class CategoriaService {
  async obtenerCategorias(incluirConteo = false) {
    try {
      if (incluirConteo) {
        const categorias = await categoriaRepository.findAllWithCount();
        return categorias.map(c => ({
          ...c,
          total_productos: parseInt(c.total_productos)
        }));
      }
      return await categoriaRepository.findAll();
    } catch (error) {
      throw new AppError('Error al obtener categorías', 500);
    }
  }

  async obtenerCategoriaPorId(categoriaId, incluirConteo = false) {
    try {
      const categoria = await categoriaRepository.findById(categoriaId);
      if (!categoria) throw new AppError('Categoría no encontrada', 404);

      if (incluirConteo) {
        const totalProductos = await categoriaRepository.contarProductos(categoriaId);
        return { ...categoria, total_productos: totalProductos };
      }
      return categoria;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al obtener categoría', 500);
    }
  }

  async crearCategoria(categoriaData) {
    try {
      const existente = await categoriaRepository.findByNombre(categoriaData.nombre);
      if (existente) throw new AppError('Ya existe una categoría con ese nombre', 400);

      return await categoriaRepository.create(categoriaData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al crear categoría', 500);
    }
  }

  async actualizarCategoria(categoriaId, categoriaData) {
    try {
      const existente = await categoriaRepository.findById(categoriaId);
      if (!existente) throw new AppError('Categoría no encontrada', 404);

      if (categoriaData.nombre && categoriaData.nombre !== existente.nombre) {
        const duplicado = await categoriaRepository.findByNombre(categoriaData.nombre);
        if (duplicado) throw new AppError('Ya existe una categoría con ese nombre', 400);
      }

      return await categoriaRepository.update(categoriaId, categoriaData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al actualizar categoría', 500);
    }
  }

  async eliminarCategoria(categoriaId) {
    try {
      const existente = await categoriaRepository.findById(categoriaId);
      if (!existente) throw new AppError('Categoría no encontrada', 404);

      const totalProductos = await categoriaRepository.contarProductos(categoriaId);
      if (totalProductos > 0) {
        throw new AppError(
          `No se puede eliminar la categoría porque tiene ${totalProductos} producto(s) asociado(s)`,
          400
        );
      }

      return await categoriaRepository.delete(categoriaId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al eliminar categoría', 500);
    }
  }
}

module.exports = new CategoriaService();