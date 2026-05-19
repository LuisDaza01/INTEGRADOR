// ============================================
// src/constants/estados.js
// Estados de los pedidos en NaturaPiscis
// ============================================

const ESTADOS_PEDIDO = {
  PENDIENTE:               'pendiente',
  CONFIRMADO:              'confirmado',
  PREPARANDO:              'preparando',
  // ✅ NUEVO: productor registró el peso real
  PESADO:                  'pesado',
  // El consumidor tiene N min para aceptar el precio final.
  // N viene de usuarios.minutos_confirmacion (configurable por productor, default 15).
  ESPERANDO_CONFIRMACION:  'esperando_confirmacion',
  LISTO_PARA_RECOGER:      'listo_para_recoger',
  EN_CAMINO:               'en_camino',
  ENTREGADO:               'entregado',
  CANCELADO:               'cancelado',
};

// Flujo completo:
// pendiente → confirmado → preparando → pesado
//   → esperando_confirmacion → listo_para_recoger → en_camino → entregado
const ESTADOS_PEDIDO_LISTA = Object.values(ESTADOS_PEDIDO);

// Transiciones válidas por estado actual
// (el service valida que el productor solo pueda avanzar en orden)
const TRANSICIONES_VALIDAS = {
  pendiente:              ['confirmado', 'cancelado'],
  confirmado:             ['preparando', 'cancelado'],
  preparando:             ['pesado', 'cancelado'],
  pesado:                 ['esperando_confirmacion'],
  esperando_confirmacion: ['listo_para_recoger', 'cancelado'], // cancelado si vence el timer
  listo_para_recoger:     ['en_camino', 'cancelado'],
  en_camino:              ['entregado'],
  entregado:              [],
  cancelado:              [],
};

// Estados que permiten tracking en tiempo real
const ESTADOS_TRACKING = [
  'confirmado',
  'preparando',
  'pesado',
  'esperando_confirmacion',
  'listo_para_recoger',
  'en_camino',
];

// Estados donde el consumidor puede actuar
const ESTADOS_ACCION_CONSUMIDOR = [
  'esperando_confirmacion', // aceptar o rechazar el precio pesado
];

// Minutos por defecto si el productor no configuró su valor.
// El valor real viene de usuarios.minutos_confirmacion.
const MINUTOS_CONFIRMACION = 20;

const ESTADOS_PRODUCTO = {
  DISPONIBLE:    'disponible',
  NO_DISPONIBLE: 'no_disponible',
  AGOTADO:       'agotado',
};

// Precio por kg fijo (Bs.)
const PRECIO_KG = 35;

// Peso mínimo por pescado (gramos). 0 = sin mínimo.
const PESO_MINIMO_GRAMOS = 0;

module.exports = {
  ESTADOS_PEDIDO,
  ESTADOS_PEDIDO_LISTA,
  TRANSICIONES_VALIDAS,
  ESTADOS_TRACKING,
  ESTADOS_ACCION_CONSUMIDOR,
  MINUTOS_CONFIRMACION,
  ESTADOS_PRODUCTO,
  PRECIO_KG,
  PESO_MINIMO_GRAMOS,
};