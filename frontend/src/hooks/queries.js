// src/hooks/queries.js
// Pre-built React Query hooks for all key API endpoints.
// Pages import these instead of writing their own useEffect + axios.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/config/axios'
import { API_ENDPOINTS } from '../config/apiConfig'

// ── Query key registry ────────────────────────────────────────────────────────
export const QK = {
  destacados:         ['productos', 'destacados'],
  pedidosRecientes:   ['pedidos', 'recientes'],
  statsConsumidor:    ['pedidos', 'stats', 'consumidor'],
  pedidosRecibidos:   ['pedidos', 'recibidos'],
  misProductos:       ['mis-productos'],
  misProductoById:    (id) => ['mis-productos', id],
  productores:        (params) => ['productores', params],
  productorById:      (id) => ['productores', id],
  productoById:       (id) => ['productos', id],
  estadisticasProductor: ['estadisticas', 'productor'],
  estadisticasVentas: ['estadisticas', 'ventas'],
  estadisticasProductos: ['estadisticas', 'productos'],
  carrito:            ['carrito'],
  categorias:         ['categorias'],
  opinionesPorProducto: (id) => ['opiniones', id],
  perfilProductor:    ['perfil', 'productor'],
  perfilConsumidor:   ['perfil', 'consumidor'],
  cupones:            ['cupones'],
  notificaciones:     ['notificaciones'],
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const get  = (url, params) => api.get(url, { params }).then(r => r.data?.data ?? r.data)
const post = (url, body)   => api.post(url, body).then(r => r.data?.data ?? r.data)
const put  = (url, body)   => api.put(url, body).then(r => r.data?.data ?? r.data)
const del  = (url)         => api.delete(url).then(r => r.data?.data ?? r.data)

// ── Productos ─────────────────────────────────────────────────────────────────
export const useDestacados = (opts) =>
  useQuery({ queryKey: QK.destacados, queryFn: () => get(API_ENDPOINTS.PRODUCTOS.DESTACADOS), ...opts })

export const useProductoById = (id, opts) =>
  useQuery({ queryKey: QK.productoById(id), queryFn: () => get(API_ENDPOINTS.PRODUCTOS.BY_ID(id)), enabled: !!id, ...opts })

// ── Mis Productos (productor) ─────────────────────────────────────────────────
export const useMisProductos = (opts) =>
  useQuery({ queryKey: QK.misProductos, queryFn: () => get(API_ENDPOINTS.MIS_PRODUCTOS.BASE), ...opts })

export const useCrearProducto = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post(API_ENDPOINTS.MIS_PRODUCTOS.CREAR, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.misProductos }),
  })
}

export const useActualizarProducto = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => put(API_ENDPOINTS.MIS_PRODUCTOS.BY_ID(id), body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.misProductos }),
  })
}

export const useEliminarProducto = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => del(API_ENDPOINTS.MIS_PRODUCTOS.BY_ID(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.misProductos }),
  })
}

// ── Pedidos ───────────────────────────────────────────────────────────────────
export const usePedidosRecientes = (opts) =>
  useQuery({ queryKey: QK.pedidosRecientes, queryFn: () => get(API_ENDPOINTS.PEDIDOS.RECIENTES), ...opts })

export const useStatsConsumidor = (opts) =>
  useQuery({ queryKey: QK.statsConsumidor, queryFn: () => get(API_ENDPOINTS.PEDIDOS.STATS_CONSUMIDOR), staleTime: 2 * 60 * 1000, ...opts })

export const usePedidosRecibidos = (opts) =>
  useQuery({ queryKey: QK.pedidosRecibidos, queryFn: () => get(API_ENDPOINTS.PEDIDOS.RECIBIDOS), ...opts })

export const useActualizarEstadoPedido = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }) => put(API_ENDPOINTS.PEDIDOS.ESTADO(id), { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos'] }),
  })
}

// ── Productores ───────────────────────────────────────────────────────────────
export const useProductores = (params, opts) =>
  useQuery({ queryKey: QK.productores(params), queryFn: () => get(API_ENDPOINTS.PRODUCTORES.BASE, params), ...opts })

export const useProductorById = (id, opts) =>
  useQuery({ queryKey: QK.productorById(id), queryFn: () => get(API_ENDPOINTS.PRODUCTORES.BY_ID(id)), enabled: !!id, ...opts })

// ── Estadísticas ──────────────────────────────────────────────────────────────
export const useEstadisticasProductor = (opts) =>
  useQuery({ queryKey: QK.estadisticasProductor, queryFn: () => get(API_ENDPOINTS.ESTADISTICAS.PRODUCTOR), staleTime: 5 * 60 * 1000, ...opts })

export const useEstadisticasVentas = (opts) =>
  useQuery({ queryKey: QK.estadisticasVentas, queryFn: () => get(API_ENDPOINTS.ESTADISTICAS.VENTAS), staleTime: 5 * 60 * 1000, ...opts })

export const useEstadisticasProductos = (opts) =>
  useQuery({ queryKey: QK.estadisticasProductos, queryFn: () => get(API_ENDPOINTS.ESTADISTICAS.PRODUCTOS), staleTime: 5 * 60 * 1000, ...opts })

// ── Carrito ───────────────────────────────────────────────────────────────────
export const useCarrito = (opts) =>
  useQuery({ queryKey: QK.carrito, queryFn: () => get(API_ENDPOINTS.CARRITO.BASE), ...opts })

// ── Categorías ────────────────────────────────────────────────────────────────
export const useCategorias = (opts) =>
  useQuery({ queryKey: QK.categorias, queryFn: () => get(API_ENDPOINTS.CATEGORIAS.BASE), staleTime: 10 * 60 * 1000, ...opts })

// ── Opiniones ─────────────────────────────────────────────────────────────────
export const useOpinionesPorProducto = (id, opts) =>
  useQuery({ queryKey: QK.opinionesPorProducto(id), queryFn: () => get(API_ENDPOINTS.OPINIONES.POR_PRODUCTO(id)), enabled: !!id, ...opts })

// ── Perfil ────────────────────────────────────────────────────────────────────
export const usePerfilProductor = (opts) =>
  useQuery({ queryKey: QK.perfilProductor, queryFn: () => get(API_ENDPOINTS.PERFIL.PRODUCTOR), ...opts })

export const usePerfilConsumidor = (opts) =>
  useQuery({ queryKey: QK.perfilConsumidor, queryFn: () => get(API_ENDPOINTS.PERFIL.CONSUMIDOR), ...opts })

// ── Cupones ───────────────────────────────────────────────────────────────────
export const useCupones = (opts) =>
  useQuery({ queryKey: QK.cupones, queryFn: () => get(API_ENDPOINTS.CUPONES.BASE), ...opts })

export const useCrearCupon = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post(API_ENDPOINTS.CUPONES.BASE, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.cupones }),
  })
}

export const useEliminarCupon = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => del(`${API_ENDPOINTS.CUPONES.BASE}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.cupones }),
  })
}

// ── Notificaciones ────────────────────────────────────────────────────────────
export const useNotificaciones = (opts) =>
  useQuery({
    queryKey: QK.notificaciones,
    queryFn: () => get(API_ENDPOINTS.NOTIFICACIONES.BASE),
    staleTime: 60_000,
    refetchInterval: 60_000,
    ...opts,
  })

export const useMarcarLeidaMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.patch(API_ENDPOINTS.NOTIFICACIONES.LEER(id)).then(r => r.data?.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.notificaciones }),
  })
}

export const useMarcarTodasLeidasMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch(API_ENDPOINTS.NOTIFICACIONES.LEER_TODAS).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.notificaciones }),
  })
}
