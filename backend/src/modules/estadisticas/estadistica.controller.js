// estadistica.controller.js - Controlador para Estadísticas
const estadisticaService = require('./estadistica.service');
const { successResponse, errorResponse } = require('../../utils/response');

class EstadisticaController {
  async obtenerEstadisticasProductor(req, res) {
    try {
      const { id: productorId } = req.user;
      const estadisticas = await estadisticaService.obtenerEstadisticasProductor(productorId);
      return successResponse(res, estadisticas, 'Estadísticas obtenidas correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async obtenerEstadisticasVentas(req, res) {
    try {
      const { id: productorId } = req.user;
      const estadisticas = await estadisticaService.obtenerEstadisticasVentas(productorId);
      return successResponse(res, estadisticas, 'Estadísticas de ventas obtenidas');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async obtenerEstadisticasProductos(req, res) {
    try {
      const { id: productorId } = req.user;
      const estadisticas = await estadisticaService.obtenerEstadisticasProductos(productorId);
      return successResponse(res, estadisticas, 'Estadísticas de productos obtenidas');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async obtenerMarketingAnalytics(req, res) {
    try {
      const { id: productorId } = req.user;
      const { periodo } = req.query;
      const data = await estadisticaService.obtenerMarketingAnalytics(productorId, periodo);
      return successResponse(res, data, 'Métricas de marketing obtenidas');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async obtenerPrediccionVentas(req, res) {
    try {
      const { id: productorId } = req.user;
      const data = await estadisticaService.obtenerPrediccionVentas(productorId);
      return successResponse(res, data, 'Predicción de ventas generada');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  // NUEVO: para admin
  async obtenerVentasPorProductor(req, res) {
    try {
      const data = await estadisticaService.obtenerVentasPorProductor();
      return successResponse(res, data, 'Ventas por productor obtenidas');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }
  async obtenerResumenGlobal(req, res) {
    try {
      const data = await estadisticaService.obtenerResumenGlobal();
      return successResponse(res, data, 'Resumen global obtenido');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }


}

module.exports = new EstadisticaController();
