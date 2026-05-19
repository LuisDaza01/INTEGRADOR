import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Package, Trash2, ChevronLeft, ChevronRight, AlertCircle, Star, TrendingUp } from "lucide-react"
import axiosInstance from "../../api/config/axios"
import { useAuth } from "../../contexts/AuthContext"

const ProductosAdmin = () => {
  const { user } = useAuth()
  const [productos, setProductos] = useState([])
  const [masVendidos, setMasVendidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingVendidos, setLoadingVendidos] = useState(true)
  const [tab, setTab] = useState("todos") // "todos" | "vendidos"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const PER_PAGE = 10

  useEffect(() => { fetchProductos() }, [user])
  useEffect(() => { fetchMasVendidos() }, [user])

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get("/productos")
      const data = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setProductos(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchMasVendidos = async () => {
    try {
      setLoadingVendidos(true)
      // Traer todos los productos y ordenar por ventas usando estadísticas
      const res = await axiosInstance.get("/productos?order=fecha_desc&limit=100")
      const data = Array.isArray(res.data) ? res.data : (res.data.data || [])
      // Ordenar por stock vendido (productos con menos stock = más vendidos)
      // Como no hay endpoint de más vendidos por admin, usamos total de pedidos si existe
      setMasVendidos(data)
    } catch (err) { console.error(err) }
    finally { setLoadingVendidos(false) }
  }

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/productos/${id}`)
      setProductos(prev => prev.filter(p => p.id !== id))
      setConfirmDelete(null)
    } catch (err) { console.error(err) }
  }

  const handleToggleDestacado = async (producto) => {
    try {
      await axiosInstance.patch(`/productos/${producto.id}/destacar`, {
        destacado: !producto.destacado
      })
      const update = prev => prev.map(p =>
        p.id === producto.id ? { ...p, destacado: !p.destacado } : p
      )
      setProductos(update)
      setMasVendidos(update)
    } catch (err) { console.error("Error al cambiar destacado:", err) }
  }

  const filtered = productos.filter(p =>
    p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const ProductRow = ({ p, i, showDelete = true }) => (
    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
      className="hover:bg-gray-50 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            {p.imagen
              ? <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover rounded-lg" />
              : <Package size={16} className="text-blue-400" />}
          </div>
          <span className="text-gray-800 text-sm font-medium truncate max-w-[160px]">{p.nombre}</span>
        </div>
      </td>
      <td className="px-5 py-3.5 hidden md:table-cell">
        <span className="text-gray-500 text-sm">{p.categoria || "—"}</span>
      </td>
      <td className="px-5 py-3.5 hidden sm:table-cell">
        <span className="text-green-600 text-sm font-medium">Bs {parseFloat(p.precio || 0).toFixed(2)}</span>
      </td>
      <td className="px-5 py-3.5 hidden lg:table-cell">
        <span className="text-gray-600 text-sm">{p.stock ?? "—"} {p.unidad || ""}</span>
      </td>
      <td className="px-5 py-3.5 hidden sm:table-cell">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${p.disponible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {p.disponible ? "Disponible" : "No disponible"}
        </span>
      </td>
      {/* Botón destacar */}
      <td className="px-3 py-3.5">
        <button
          onClick={() => handleToggleDestacado(p)}
          title={p.destacado ? "Quitar destacado" : "Marcar como destacado"}
          className={`p-1.5 rounded-lg transition-colors ${
            p.destacado
              ? "text-yellow-500 bg-yellow-50 hover:bg-yellow-100"
              : "text-gray-300 hover:text-yellow-500 hover:bg-yellow-50"
          }`}>
          <Star size={15} fill={p.destacado ? "currentColor" : "none"} />
        </button>
      </td>
      {showDelete && (
        <td className="px-3 py-3.5">
          <button onClick={() => setConfirmDelete(p)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={15} />
          </button>
        </td>
      )}
    </motion.tr>
  )

  const TableHeader = ({ showDelete = true }) => (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Producto</th>
        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Categoría</th>
        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Precio</th>
        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Stock</th>
        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Estado</th>
        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">Destacado</th>
        {showDelete && <th className="px-3 py-3" />}
      </tr>
    </thead>
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
          <p className="text-gray-500 text-sm">{productos.length} productos registrados</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar producto..."
            className="bg-white border border-gray-300 text-gray-800 text-sm rounded-xl pl-9 pr-4 py-2.5 w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("todos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all
            ${tab === "todos" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
          <Package size={14} /> Todos los productos
        </button>
        <button onClick={() => setTab("vendidos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all
            ${tab === "vendidos" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
          <TrendingUp size={14} /> Destacar productos
        </button>
      </div>

      {/* Tab: Todos */}
      {tab === "todos" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <TableHeader showDelete={true} />
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No se encontraron productos</td></tr>
              ) : paginated.map((p, i) => <ProductRow key={p.id} p={p} i={i} showDelete={true} />)}
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
      )}

      {/* Tab: Destacar productos */}
      {tab === "vendidos" && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            ⭐ Haz clic en la estrella para destacar o quitar el destacado de un producto. Los productos destacados aparecen primero en la tienda.
          </div>

          {loadingVendidos ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <TableHeader showDelete={false} />
                <tbody className="divide-y divide-gray-100">
                  {masVendidos.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">No hay productos</td></tr>
                  ) : masVendidos.map((p, i) => <ProductRow key={p.id} p={p} i={i} showDelete={false} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {confirmDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold">Eliminar producto</h3>
                <p className="text-gray-400 text-sm">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-5">¿Eliminar <span className="text-gray-900 font-medium">"{confirmDelete.nombre}"</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">Eliminar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default ProductosAdmin