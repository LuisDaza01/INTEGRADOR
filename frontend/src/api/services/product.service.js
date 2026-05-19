import { API_ENDPOINTS } from '../../config/apiConfig';  // ✅ RUTA CORRECTA
export async function obtenerProductos() {
  const res = await fetch(`${API_ENDPOINTS.PRODUCTOS.BASE}/buscar`);  // ✅ CORREGIDO
  if (!res.ok) throw new Error("Error al obtener productos");
  return await res.json();
}