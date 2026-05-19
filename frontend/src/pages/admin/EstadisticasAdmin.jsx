import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, ShoppingBag, Package, Activity, Users, Store } from "lucide-react"
import axiosInstance from "../../api/config/axios"
import { useAuth } from "../../contexts/AuthContext"

const EstadisticasAdmin = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [productores, setProductores] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingProductores, setLoadingProductores] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get("/estadisticas/admin/resumen")
        const data = res.data.data || res.data
        setStats({
          totalProductos:    data.totalProductos,
          totalPedidos:      data.totalPedidos,
          pedidosPendientes: data.pedidosPendientes,
          pedidosEntregados: data.pedidosEntregados,
          ingresoTotal:      data.ingresoTotal,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const fetchProductores = async () => {
      try {
        const res = await axiosInstance.get("/estadisticas/admin/productores")
        const data = Array.isArray(res.data) ? res.data : (res.data.data || [])
        setProductores(data)
      } catch (err) {
        console.error("Error cargando ventas por productor:", err)
      } finally {
        setLoadingProductores(false)
      }
    }

    fetchStats()
    fetchProductores()
  }, [user])

  const cards = stats ? [
    { label: "Total Productos",   value: stats.totalProductos,                  icon: Package,     bg: "bg-blue-50",   color: "text-blue-600",   border: "border-blue-100" },
    { label: "Total Pedidos",     value: stats.totalPedidos,                    icon: ShoppingBag, bg: "bg-orange-50", color: "text-orange-600", border: "border-orange-100" },
    { label: "Pedidos Pendientes",value: stats.pedidosPendientes,               icon: Activity,    bg: "bg-yellow-50", color: "text-yellow-600", border: "border-yellow-100" },
    { label: "Pedidos Entregados",value: stats.pedidosEntregados,               icon: TrendingUp,  bg: "bg-green-50",  color: "text-green-600",  border: "border-green-100" },
    { label: "Ingresos Totales",  value: `Bs ${stats.ingresoTotal.toFixed(2)}`, icon: null, customIcon: true, bg: "bg-cyan-50",   color: "text-cyan-600",   border: "border-cyan-100" },
  ] : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Estadísticas Globales</h2>
        <p className="text-gray-500 text-sm mt-1">Vista general de toda la actividad en NaturaPiscis</p>
      </div>

      {/* Cards globales */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon || (() => null)
            return (
              <motion.div key={card.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center mb-4`}>
                  <Icon size={20} className={card.color} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-gray-500 text-sm mt-1">{card.label}</p>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Ventas por productor */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Store size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Ventas por Productor</h3>
            <p className="text-gray-400 text-xs">Rendimiento de cada productor en la plataforma</p>
          </div>
        </div>

        {loadingProductores ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Productor</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Empresa</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Total Ventas</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Pedidos</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Productos</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Clientes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      No hay productores registrados
                    </td>
                  </tr>
                ) : productores.map((p, i) => {
                  const iniciales = p.nombre?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "P"
                  return (
                    <motion.tr key={p.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {iniciales}
                          </div>
                          <span className="text-gray-800 text-sm font-medium">{p.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-gray-500 text-sm">{p.nombre_empresa || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-semibold ${p.total_ventas > 0 ? "text-green-600" : "text-gray-400"}`}>
                          Bs {p.total_ventas.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-gray-600 text-sm">{p.total_pedidos}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-gray-600 text-sm">{p.total_productos}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Users size={13} className="text-gray-400" />
                          <span className="text-gray-600 text-sm">{p.total_clientes}</span>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default EstadisticasAdmin