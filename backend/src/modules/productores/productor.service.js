// productor.service.js - Lógica de negocio para Productores
const productorRepository = require('./productor.repository');
const { AppError } = require('../../utils/errors');

class ProductorService {
  /**
   * Obtener todos los productores con paginación y filtros
   */
  async obtenerProductores(page = 1, limit = 12, filters = {}) {
    try {
      const result = await productorRepository.findAll({ page, limit, ...filters });
      return {
        productores: result.productores.map(p => this.parseJsonFields(p)),
        total: result.total
      };
    } catch (error) {
      throw new AppError('Error al obtener productores', 500);
    }
  }

  /**
   * Obtener productor por ID
   */
  async obtenerProductorPorId(productorId) {
    try {
      const productor = await productorRepository.findById(productorId);
      
      if (!productor) {
        throw new AppError('Productor no encontrado', 404);
      }

      return this.parseJsonFields(productor);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al obtener productor', 500);
    }
  }

  /**
   * Obtener productos de un productor
   */
  async obtenerProductosDeProductor(productorId) {
    try {
      const productos = await productorRepository.findProductos(productorId);
      return productos;
    } catch (error) {
      throw new AppError('Error al obtener productos del productor', 500);
    }
  }

  /**
   * Obtener perfil del productor autenticado
   */
  async obtenerPerfil(productorId) {
    try {
      const productor = await productorRepository.findPerfil(productorId);
      
      if (!productor) {
        throw new AppError('Perfil del productor no encontrado', 404);
      }

      return this.parseJsonFields(productor);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al obtener perfil del productor', 500);
    }
  }

  /**
   * Actualizar perfil del productor
   */
  async actualizarPerfil(productorId, data) {
    try {
      // Verificar que es productor
      const esProductor = await productorRepository.esProductor(productorId);
      if (!esProductor) {
        throw new AppError('Usuario no es productor', 403);
      }

      // Mapear campos del frontend a la base de datos
      const dataMapeada = {
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        ubicacion: data.ciudad || data.ubicacion,
        direccion: data.direccion_completa || data.direccion,
        descripcion: data.descripcion,
        foto_perfil: data.foto_perfil,
        years_experience: data.years_experience,
        nombre_empresa: data.nombre_empresa,
        rfc: data.rfc,
        tipo_empresa: data.tipo_empresa,
        num_empleados: data.num_empleados,
        sitio_web: data.sitio_web,
        facebook: data.facebook,
        instagram: data.instagram,
        twitter: data.twitter,
        horario_atencion_inicio: data.horario_atencion_inicio,
        horario_atencion_fin: data.horario_atencion_fin,
        zona_horaria: data.zona_horaria,
        dias_venta: data.dias_venta,
        dias_envio: data.dias_envio,
        galeria_criadero: data.galeria_criadero,
        certificaciones: data.certificaciones,
        metodos_envio: data.metodos_envio,
        especialidad: data.especialidades || data.especialidad,
        perfil_publico: data.perfil_publico,
        mostrar_telefono: data.mostrar_telefono,
        mostrar_email: data.mostrar_email,
        mostrar_direccion: data.mostrar_direccion
      };

      const productor = await productorRepository.updatePerfil(productorId, dataMapeada);
      
      if (!productor) {
        throw new AppError('Productor no encontrado o no autorizado', 404);
      }

      return productor;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al actualizar perfil del productor', 500);
    }
  }

  /**
   * Buscar productores
   */
  async buscarProductores(termino) {
    try {
      const productores = await productorRepository.buscar(termino);
      return productores.map(productor => this.parseJsonFields(productor));
    } catch (error) {
      throw new AppError('Error al buscar productores', 500);
    }
  }

  /**
   * Parse JSON fields (helper)
   */
  parseJsonFields(productor) {
    const tryParse = (val) => {
      try {
        return typeof val === "string" ? JSON.parse(val) : val || [];
      } catch {
        return [];
      }
    };

    return {
      ...productor,
      dias_venta: tryParse(productor.dias_venta),
      dias_envio: tryParse(productor.dias_envio),
      galeria_criadero: tryParse(productor.galeria_criadero),
      certificaciones: tryParse(productor.certificaciones),
      metodos_envio: tryParse(productor.metodos_envio),
      especialidades: tryParse(productor.especialidad)
    };
  }
}

module.exports = new ProductorService();