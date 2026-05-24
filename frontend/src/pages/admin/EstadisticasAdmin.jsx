"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, ShoppingBag, Package, Activity, Users, Store, DollarSign, Sparkles } from "lucide-react"
import axiosInstance from "../../api/config/axios"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import useCountUp from "../../hooks/useCountUp"

// ── Mini sparkline SVG sin librerías ────────────────────────────
const Sparkline = ({ data = [], color = '#22C55E', height = 36 }) => {
  if (!data.length) return null
  const w = 100
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w
    const y = height - 4 - ((v - min) / range) * (height - 10)
    return `${x},${y}`
  })
  const areaPoints = `0,${height} ${pts.join(' ')} ${w},${height}`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, opacity: 0.85 }}>
      <defs>
        <linearGradient id={`spark-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color.slice(1)})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── KPI card con animated counter + sparkline ───────────────────
const KPICard = ({ label, value, prefix = '', suffix = '', icon: Icon, color, trend = [], delay = 0, big = false }) => {
  const { D } = useTheme()
  const num = parseFloat(String(value).replace(/[^0-9.\-]/g, '')) || 0
  const animated = useCountUp(num, { duration: 1400, decimals: 0, startDelay: delay * 1000, prefix, suffix })
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
      className="np-hover"
      style={{
        gridColumn: big ? 'span 2' : 'span 1',
        background: `linear-gradient(135deg, ${color}14, ${color}05)`,
        border: `1px solid ${color}30`,
        borderRadius: 16, padding: big ? 22 : 18,
        boxShadow: `0 4px 28px rgba(0,0,0,0.25), inset 0 1px 0 ${color}20`,
        position: 'relative', overflow: 'hidden',
      }}>
      {/* glow orb decorativo */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 110, height: 110, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}30, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
        <div style={{
          width: big ? 48 : 42, height: big ? 48 : 42, borderRadius: 12,
          background: `${color}22`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 18px ${color}33`,
        }}>
          <Icon size={big ? 22 : 20} style={{ color }} />
        </div>
        {trend.length > 0 && (
          <div style={{ flex: 1, maxWidth: 100, marginLeft: 12, opacity: 0.9 }}>
            <Sparkline data={trend} color={color} height={32} />
          </div>
        )}
      </div>
      <p style={{
        fontSize: big ? 32 : 26, fontWeight: 800, color, margin: 0,
        fontFamily: "'Fira Code', monospace", letterSpacing: '-0.02em',
        lineHeight: 1.1,
      }}>
        {animated}
      </p>
      <p style={{ color: D.muted, fontSize: 12, margin: '6px 0 0', fontWeight: 500 }}>{label}</p>
    </motion.div>
  )
}

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
      } catch (err) { if (import.meta.env.DEV) console.error(err) }
      finally { setLoading(false) }
    }
    const fetchProductores = async () => {
      try {
        const res = await axiosInstance.get("/estadisticas/admin/productores")
        const data = Array.isArray(res.data) ? res.data : (res.data.data || [])
        setProductores(data)
      } catch (err) { if (import.meta.env.DEV) console.error(err) }
      finally { setLoadingProductores(false) }
    }
    fetchStats(); fetchProductores()
  }, [user])

  // Genera tendencia sintética (en producción esto vendría del backend)
  const makeTrend = (seed = 5, n = 8) => Array.from({ length: n }, (_, i) => seed + Math.sin(i * 0.9 + seed) * 2 + i * 0.3)

  const Spinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: `3px solid ${D.border}`, borderTopColor: D.primary,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header con saludo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Sparkles size={16} style={{ color: D.primary }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: D.primary, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Mission Control
            </span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: D.text, margin: 0, letterSpacing: '-0.6px', fontFamily: "'Fira Code', monospace" }}>
            Vista global
          </h2>
          <p style={{ color: D.muted, fontSize: 13, margin: '4px 0 0' }}>Toda la actividad de NaturaPiscis en un vistazo</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 14px', borderRadius: 999,
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
        }}>
          <div style={{ position: 'relative', width: 8, height: 8 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: D.primary }} />
            <div style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              background: D.primary, opacity: 0.4,
              animation: 'pulse 1.6s ease-out infinite',
            }} />
            <style>{`@keyframes pulse { 0% { transform: scale(0.8); opacity: 0.6; } 100% { transform: scale(2.4); opacity: 0; } }`}</style>
          </div>
          <span style={{ color: D.primary, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>EN VIVO</span>
        </div>
      </div>

      {/* Bento grid */}
      {loading ? <Spinner /> : (
        <div className="np-bento-admin"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
          }}>
          <style>{`
            @media (max-width: 900px) { .np-bento-admin { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (max-width: 520px) { .np-bento-admin { grid-template-columns: 1fr !important; } }
          `}</style>
          {/* Card grande (span 2) — Ingresos */}
          <KPICard label="Ingresos Totales (Bs)" value={stats.ingresoTotal} icon={DollarSign}
            color="#22C55E" trend={makeTrend(4, 10)} delay={0} big />
          <KPICard label="Total Pedidos" value={stats.totalPedidos} icon={ShoppingBag}
            color="#fb923c" trend={makeTrend(3, 8)} delay={0.1} />
          <KPICard label="Total Productos" value={stats.totalProductos} icon={Package}
            color="#4ade80" trend={makeTrend(5, 8)} delay={0.15} />
          <KPICard label="Pedidos Pendientes" value={stats.pedidosPendientes} icon={Activity}
            color="#fbbf24" trend={makeTrend(2, 8)} delay={0.2} />
          <KPICard label="Pedidos Entregados" value={stats.pedidosEntregados} icon={TrendingUp}
            color="#34d399" trend={makeTrend(6, 8)} delay={0.25} />
        </div>
      )}

      {/* Ventas por productor */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(34,197,94,0.2)',
          }}>
            <Store size={16} style={{ color: D.primary }} />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: D.text, margin: 0 }}>Ventas por Productor</h3>
            <p style={{ color: D.muted, fontSize: 11, margin: '2px 0 0' }}>Rendimiento individual en la plataforma</p>
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
                    <th className="hidden sm:table-cell" style={th(D)}>Empresa</th>
                    <th style={th(D)}>Total Ventas</th>
                    <th className="hidden md:table-cell" style={th(D)}>Pedidos</th>
                    <th className="hidden lg:table-cell" style={th(D)}>Productos</th>
                    <th className="hidden lg:table-cell" style={th(D)}>Clientes</th>
                  </tr>
                </thead>
                <tbody>
                  {productores.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: D.muted, fontSize: 13 }}>No hay productores registrados</td></tr>
                  ) : productores.map((p, i) => {
                    const iniciales = p.nombre?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "P"
                    return (
                      <motion.tr key={p.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        style={{ borderBottom: `1px solid ${D.border}`, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={td()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: 'linear-gradient(135deg,#16a34a,#22C55E)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                              boxShadow: '0 0 10px rgba(34,197,94,0.35)',
                              border: '2px solid rgba(34,197,94,0.3)',
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
