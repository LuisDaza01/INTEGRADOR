import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, ShoppingBag, ChevronLeft, ChevronRight, Eye, X, User, Package } from "lucide-react"
import axiosInstance from "../../api/config/axios"
import { useAuth } from "../../contexts/AuthContext"

const ESTADOS = ["todos", "pendiente", "confirmado", "enviado", "entregado", "cancelado"]

const estadoStyle = {
  pendiente:  "bg-yellow-100 text-yellow-700",
  confirmado: "bg-blue-100 text-blue-700",
  enviado:    "bg-cyan-100 text-cyan-700",
  entregado:  "bg-green-100 text-green-700",
  cancelado:  "bg-red-100 text-red-700",
}

const PedidosAdmin = () => {
  const { user } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [page, setPage] = useState(1)
  const [detalle, setDetalle] = useState(null)
  const [detalleLoading, setDetalleLoading] = useState(false)
  const PER_PAGE = 10

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true)
        const res = await axiosInstance.get("/pedidos/admin/todos")
        const data = Array.isArray(res.data) ? res.data : (res.data.data || [])
        setPedidos(data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    if (user) fetchPedidos()
  }, [user])

  const handleVerDetalle = async (p) => {
    setDetalle({ ...p, items: null })
    setDetalleLoading(true)
    try {
      // Intentar obtener detalle completo con items
      const res = await axiosInstance.get(`/pedidos/${p.id}`)
      const data = res.data.data || res.data
      setDetalle(data)
    } catch (err) {
      // Si falla, usar los datos básicos que ya tenemos
      setDetalle(p)
    } finally {
      setDetalleLoading(false)
    }
  }

  const filtered = pedidos.filter(p => {
    const matchSearch = String(p.id).includes(search) ||
      p.consumidor?.toLowerCase().includes(search.toLowerCase()) || false
    const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado
    return matchSearch && matchEstado
  })
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pedidos</h2>
          <p className="text-gray-500 text-sm">{pedidos.length} pedidos en total</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por ID o consumidor..."
            className="bg-white border border-gray-300 text-gray-800 text-sm rounded-xl pl-9 pr-4 py-2.5 w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400" />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {ESTADOS.map(e => (
          <button key={e} onClick={() => { setFiltroEstado(e); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-all
              ${filtroEstado === e
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              }`}>
            {e}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">ID</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Consumidor</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Fecha</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Total</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No se encontraron pedidos</td></tr>
            ) : paginated.map((p, i) => (
              <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                      <ShoppingBag size={13} className="text-orange-500" />
                    </div>
                    <span className="text-gray-800 text-sm font-mono font-medium">#{p.id}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User size={12} className="text-blue-600" />
                    </div>
                    <span className="text-gray-700 text-sm">{p.consumidor || "—"}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden sm:table-cell">
                  <span className="text-gray-500 text-sm">
                    {p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString("es-BO") : "—"}
                  </span>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-green-600 text-sm font-medium">Bs {parseFloat(p.total || 0).toFixed(2)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${estadoStyle[p.estado] || "bg-gray-100 text-gray-500"}`}>
                    {p.estado || "—"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button onClick={() => handleVerDetalle(p)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Eye size={15} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-gray-400 text-xs">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {detalle && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setDetalle(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Header modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <ShoppingBag size={18} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-lg">Pedido #{detalle.id}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${estadoStyle[detalle.estado] || "bg-gray-100 text-gray-500"}`}>
                    {detalle.estado}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetalle(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {detalleLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Info consumidor */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Consumidor</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                      <User size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium text-sm">{detalle.consumidor || "—"}</p>
                      {detalle.consumidor_email && (
                        <p className="text-gray-400 text-xs">{detalle.consumidor_email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info del pedido */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detalles del pedido</p>
                  <div className="space-y-2 text-sm">
                    {[
                      ["Fecha", detalle.fecha_pedido ? new Date(detalle.fecha_pedido).toLocaleString("es-BO") : "—"],
                      ["Método envío", detalle.metodo_envio || "—"],
                      ["Costo envío", `Bs ${parseFloat(detalle.costo_envio || 0).toFixed(2)}`],
                      ["Total", <span className="text-green-600 font-semibold">Bs {parseFloat(detalle.total || 0).toFixed(2)}</span>],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-200 last:border-0">
                        <span className="text-gray-500">{label}</span>
                        <span className="text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Productos del pedido con productor */}
                {detalle.items && detalle.items.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Productos y Productores</p>
                    <div className="space-y-2">
                      {detalle.items.map((item, i) => (
                        <div key={i} className="py-2 border-b border-gray-200 last:border-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Package size={13} className="text-blue-500" />
                              </div>
                              <div>
                                <p className="text-gray-800 text-sm font-medium">{item.nombre || `Producto #${item.producto_id}`}</p>
                                <p className="text-gray-400 text-xs">x{item.cantidad} · Bs {parseFloat(item.precio_unitario || 0).toFixed(2)} c/u</p>
                              </div>
                            </div>
                            <span className="text-gray-700 text-sm font-medium">
                              Bs {(item.cantidad * parseFloat(item.precio_unitario || 0)).toFixed(2)}
                            </span>
                          </div>
                          {item.productor_nombre && (
                            <div className="mt-1.5 ml-9 flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                                <User size={9} className="text-cyan-600" />
                              </div>
                              <p className="text-xs text-cyan-700 font-medium">
                                {item.productor_empresa || item.productor_nombre}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => setDetalle(null)}
              className="mt-5 w-full px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors">
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default PedidosAdmin