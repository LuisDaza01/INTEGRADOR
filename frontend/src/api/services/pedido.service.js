import { API_ENDPOINTS } from '../../config/apiConfig';

// "Está autenticado" se infiere de la presencia del perfil cacheado.
// El token vive en cookie httpOnly y JS no debe leerlo.
const isAuthenticated = () => !!localStorage.getItem('usuario');

// Session id para usuarios sin login (carrito temporal).
const getSessionId = () => {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

const baseHeaders = { 'Content-Type': 'application/json' };
const fetchOpts = (extra = {}) => ({ credentials: 'include', ...extra });

// 🛒 Agregar producto al carrito (con o sin cookie)
export async function agregarAlCarrito(producto_id, cantidad = 1) {
  try {
    const auth = isAuthenticated();
    const sessionId = getSessionId();

    const body = { producto_id, cantidad };
    if (!auth) body.session_id = sessionId;

    const res = await fetch(API_ENDPOINTS.CARRITO.AGREGAR, fetchOpts({
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify(body),
    }));

    if (res.status === 401 && !auth) {
      return { message: 'Producto agregado a carrito temporal', authenticated: false, carrito_tipo: 'temporal' };
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status} al agregar al carrito`);
    }

    const result = await res.json();
    if (!auth && result.session_id) localStorage.setItem('cart_session_id', result.session_id);

    window.dispatchEvent(new CustomEvent('carritoActualizado', {
      detail: { producto_id, cantidad, tipo: result.carrito_tipo || 'unknown' },
    }));

    return result;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return { message: 'Producto agregado (sin conexión)', offline: true };
    }
    throw error;
  }
}

// 📦 Obtener carrito
export async function obtenerCarrito() {
  try {
    const auth = isAuthenticated();
    const sessionId = getSessionId();

    let url = API_ENDPOINTS.CARRITO.BASE;
    if (!auth && sessionId) url += `?session_id=${sessionId}`;

    const response = await fetch(url, fetchOpts({ method: 'GET', headers: baseHeaders }));

    if (!response.ok) {
      return { items: [], authenticated: false, carrito_tipo: 'empty' };
    }

    return await response.json();
  } catch (error) {
    return { items: [], authenticated: false, error: error.message };
  }
}

// 🔄 Actualizar cantidad
export async function actualizarCantidadCarrito(id, cantidad) {
  const auth = isAuthenticated();
  const sessionId = getSessionId();
  const body = { cantidad };
  if (!auth) body.session_id = sessionId;

  const res = await fetch(API_ENDPOINTS.CARRITO.ACTUALIZAR(id), fetchOpts({
    method: 'PUT',
    headers: baseHeaders,
    body: JSON.stringify(body),
  }));

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al actualizar cantidad');
  }

  const result = await res.json();
  window.dispatchEvent(new CustomEvent('carritoActualizado', {
    detail: { id, cantidad, action: 'update' },
  }));
  return result;
}

// 🗑️ Eliminar del carrito
export async function eliminarDelCarrito(id) {
  const auth = isAuthenticated();
  const sessionId = getSessionId();

  let url = API_ENDPOINTS.CARRITO.ELIMINAR(id);
  if (!auth && sessionId) url += `?session_id=${sessionId}`;

  const res = await fetch(url, fetchOpts({ method: 'DELETE', headers: baseHeaders }));

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al eliminar del carrito');
  }

  const result = await res.json();
  window.dispatchEvent(new CustomEvent('carritoActualizado', { detail: { id, action: 'delete' } }));
  return result;
}

// 🔄 Migrar carrito temporal a usuario autenticado
export async function migrarCarritoTemporal() {
  const auth = isAuthenticated();
  const sessionId = localStorage.getItem('cart_session_id');

  if (!auth) throw new Error('Se requiere autenticación para migrar carrito');
  if (!sessionId) return { message: 'No hay carrito temporal', productos_migrados: 0 };

  const response = await fetch(API_ENDPOINTS.CARRITO.MIGRAR, fetchOpts({
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({ session_id: sessionId }),
  }));

  if (!response.ok) throw new Error('Error al migrar carrito');

  const result = await response.json();
  localStorage.removeItem('cart_session_id');
  window.dispatchEvent(new CustomEvent('carritoMigrado', { detail: result }));
  return result;
}

export function limpiarCarritoLocal() {
  localStorage.removeItem('cart_session_id');
  window.dispatchEvent(new CustomEvent('carritoLimpiado'));
}

export function tieneCarritoTemporal() {
  return !!localStorage.getItem('cart_session_id');
}

export async function obtenerEstadisticasCarrito() {
  try {
    const carrito = await obtenerCarrito();
    const items = carrito.items || [];
    return {
      totalProductos: items.length,
      cantidadTotal:  items.reduce((sum, item) => sum + item.cantidad, 0),
      totalPrecio:    items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
      carrito_tipo:   carrito.carrito_tipo || 'unknown',
      authenticated:  carrito.authenticated || false,
    };
  } catch {
    return { totalProductos: 0, cantidadTotal: 0, totalPrecio: 0, carrito_tipo: 'empty', authenticated: false };
  }
}

// 📅 Crear pedido (requiere autenticación)
export async function crearPedido(datosPedido) {
  if (!isAuthenticated()) throw new Error('Se requiere autenticación para crear pedido');

  const response = await fetch(API_ENDPOINTS.PEDIDOS.CREAR, fetchOpts({
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify(datosPedido),
  }));

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al crear pedido');
  }

  const result = await response.json();
  limpiarCarritoLocal();
  return result;
}
