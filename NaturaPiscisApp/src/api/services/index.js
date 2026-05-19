// src/api/services/index.js
// Exportaciones centralizadas de servicios

export { default as authService }    from './auth.service';
export { default as sensorService }  from './sensor.service';
export { default as deviceService }  from './device.service';
export { default as orderService }   from './order.service';
export { default as producerService } from './producer.service';
export { default as productService } from './product.service';
export { default as carritoService } from './carrito.service';
export { default as mensajeService } from './mensaje.service';

// Re-exportar helpers de sensor
export { getSensorStatusColor, formatSensorValue } from './sensor.service';

// ✅ ELIMINADO: getOrderStatusLabel, getNextStatus, canUpdateStatus
// no existen en order.service.js → causaban crash en Hermes

// Re-exportar funciones del carrito
export { 
  obtenerCarrito, 
  agregarAlCarrito, 
  actualizarCantidad, 
  eliminarDelCarrito,
  vaciarCarrito,
  obtenerCantidadItems 
} from './carrito.service';