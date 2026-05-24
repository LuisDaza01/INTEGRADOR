"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, ShoppingBag, Package, Activity, Users, Store, DollarSign } from "lucide-react"
import axiosInstance from "../../api/config/axios"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"

const EstadisticasAdmin = () => {
  const { user } = useAuth()
  const { D } = useTheme()
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
        if (import.meta.env.DEV) console.error(err)
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
        if (import.meta.env.DEV) console.error("Error cargando ventas por productor:", err)
      } finally {
        setLoadingProductores(false)
      }
    }

    fetchStats()
    fetchProductores()
  }, [user])

  const cards = stats ? [
    { label: "Total Productos",    value: stats.totalProductos,                  icon: Package,     glow: '#4ade80' },
    { label: "Total Pedidos",      value: stats.totalPedidos,                    icon: ShoppingBag, glow: '#fb923c' },
    { label: "Pedidos Pendientes", value: stats.pedidosPendientes,               icon: Activity,    glow: '#fbbf24' },
    { label: "Pedidos Entregados", value: stats.pedidosEntregados,               icon: TrendingUp,  glow: '#22C55E' },
    { label: "Ingresos Totales",   value: `Bs ${stats.ingresoTotal.toFixed(2)}`, icon: DollarSign,  glow: '#34d399' },
  ] : []

  const Spinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 128 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: `3px solid ${D.border}`,
        borderTopColor: D.primary,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: D.text, margin: 0, letterSpacing: '-0.5px' }}>Estadísticas Globales</h2>
        <p style={{ color: D.muted, fontSize: 13, margin: '4px 0 0' }}>Vista general de toda la actividad en NaturaPiscis</p>
      </div>

      {/* Cards globales */}
      {loading ? <Spinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div key={card.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="np-hover"
                style={{
                  background: `linear-gradient(135deg, ${card.glow}12, ${card.glow}06)`,
                  border: `1px solid ${card.glow}30`,
                  borderRadius: 16, padding: 18,
                  boxShadow: `0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 ${card.glow}15`,
                }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: `${card.glow}20`, border: `1px solid ${card.glow}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                }}>
                  <Icon size={20} style={{ color: card.glow }} />
                </div>
                <p style={{ fontSize: 24, fontWeight: 800, color: card.glow, margin: 0, fontFamily: "'Fira Code', monospace" }}>{card.value}</p>
                <p style={{ color: D.muted, fontSize: 12, margin: '4px 0 0', fontWeight: 500 }}>{card.label}</p>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Ventas por productor */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Store size={16} style={{ color: D.primary }} />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: D.text, margin: 0 }}>Ventas por Productor</h3>
            <p style={{ color: D.muted, fontSize: 11, margin: '2px 0 0' }}>Rendimiento de cada productor en la plataforma</p>
          </div>
        </div>

        {loadingProductores ? <Spinner /> : (
          <div style={{
            background: D.card, borderRadius: 16,
            border: `1px solid ${D.border}`,
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(34,197,94,0.05)', borderBottom: `1px solid ${D.border}` }}>
                    <th style={th(D)}>Productor</th>
                    <th style={{ ...th(D), display: 'table-cell' }} className="hidden sm:table-cell">Empresa</th>
                    <th style={th(D)}>Total Ventas</th>
                    <th className="hidden md:table-cell" style={th(D)}>Pedidos</th>
                    <th className="hidden lg:table-cell" style={th(D)}>Productos</th>
                    <th className="hidden lg:table-cell" style={th(D)}>Clientes</th>
                  </tr>
                </thead>
                <tbody>
                  {productores.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: D.muted, fontSize: 13 }}>
                        No hay productores registrados
                      </td>
                    </tr>
                  ) : productores.map((p, i) => {
                    const iniciales = p.nombre?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "P"
                    return (
                      <motion.tr key={p.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: `1px solid ${D.border}`, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={td()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'linear-gradient(135deg,#16a34a,#22C55E)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
                              boxShadow: '0 0 8px rgba(34,197,94,0.3)',
                            }}>
                              {iniciales}
                            </div>
                            <span style={{ color: D.text, fontSize: 13, fontWeight: 600 }}>{p.nombre}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell" style={td()}>
                          <span style={{ color: D.muted, fontSize: 13 }}>{p.nombre_empresa || "—"}</span>
                        </td>
                        <td style={td()}>
                          <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: p.total_ventas > 0 ? D.primary : D.muted,
                            fontFamily: "'Fira Code', monospace",
                          }}>
                            Bs {Number(p.total_ventas).toFixed(2)}
                          </span>
                        </td>
                        <td className="hidden md:table-cell" style={td()}>
                          <span style={{ color: D.sub, fontSize: 13 }}>{p.total_pedidos}</span>
                        </td>
                        <td className="hidden lg:table-cell" style={td()}>
                          <span style={{ color: D.sub, fontSize: 13 }}>{p.total_productos}</span>
                        </td>
                        <td className="hidden lg:table-cell" style={td()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={13} style={{ color: D.muted }} />
                            <span style={{ color: D.sub, fontSize: 13 }}>{p.total_clientes}</span>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const th = (D) => ({
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 700,
  color: D.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '12px 18px',
  whiteSpace: 'nowrap',
})

const td = () => ({
  padding: '13px 18px',
  fontSize: 13,
})

export default EstadisticasAdmin
