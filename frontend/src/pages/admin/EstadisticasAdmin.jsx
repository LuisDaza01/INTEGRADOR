"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp, ShoppingBag, Package, Activity,
  Users, Store, DollarSign, Sparkles, BarChart2
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell, Tooltip as RTooltip, Legend,
  XAxis, YAxis, CartesianGrid,
} from "recharts"
import axiosInstance from "../../api/config/axios"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import useCountUp from "../../hooks/useCountUp"

// ── Sparkline SVG mini ──────────────────────────────────────
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

// ── KPI card ────────────────────────────────────────────────
const KPICard = ({ label, value, prefix = '', suffix = '', icon: Icon, color, trend = [], delay = 0, big = false }) => {
  const { D } = useTheme()
  const num = parseFloat(String(value).replace(/[^0-9.\-]/g, '')) || 0
  const animated = useCountUp(num, { duration: 1400, decimals: prefix === 'Bs ' ? 2 : 0, startDelay: delay * 1000, prefix, suffix })
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
      <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: `radial-gradient(circle, ${color}30, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
        <div style={{ width: big ? 48 : 42, height: big ? 48 : 42, borderRadius: 12, background: `${color}22`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 18px ${color}33` }}>
          <Icon size={big ? 22 : 20} style={{ color }} />
        </div>
        {trend.length > 0 && (
          <div style={{ flex: 1, maxWidth: 100, marginLeft: 12, opacity: 0.9 }}>
            <Sparkline data={trend} color={color} height={32} />
          </div>
        )}
      </div>
      <p style={{ fontSize: big ? 32 : 26, fontWeight: 800, color, margin: 0, fontFamily: "'Fira Code', monospace", letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {animated}
      </p>
      <p style={{ color: D.muted, fontSize: 12, margin: '6px 0 0', fontWeight: 500 }}>{label}</p>
    </motion.div>
  )
}

// ── Tooltip personalizado para Recharts ─────────────────────
const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(15,15,20,0.95)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#aaa', margin: '0 0 6px', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0', fontWeight: 700 }}>
          {p.name}: {prefix}{Number(p.value).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  )
}

// ── Colores para el pie chart ───────────────────────────────
const ESTADO_COLORS = {
  entregado:  '#22C55E',
  pendiente:  '#fbbf24',
  confirmado: '#a78bfa',
  en_camino:  '#38bdf8',
  cancelado:  '#f87171',
}
const ESTADO_LABELS = {
  entregado:  '✅ Entregado',
  pendiente:  '⏳ Pendiente',
  confirmado: '✔️ Confirmado',
  en_camino:  '🚚 En camino',
  cancelado:  '❌ Cancelado',
}
const PIE_COLORS = ['#22C55E','#fbbf24','#a78bfa','#38bdf8','#f87171','#fb923c']

const Spinner = ({ D }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${D.border}`, borderTopColor: D.primary, animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
)

const SectionHeader = ({ icon: Icon, title, subtitle, D }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(34,197,94,0.2)' }}>
      <Icon size={16} style={{ color: D.primary }} />
    </div>
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: D.text, margin: 0 }}>{title}</h3>
      {subtitle && <p style={{ color: D.muted, fontSize: 11, margin: '2px 0 0' }}>{subtitle}</p>}
    </div>
  </div>
)

const CardWrap = ({ children, D }) => (
  <div style={{ background: D.card, borderRadius: 16, border: `1px solid ${D.border}`, padding: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
    {children}
  </div>
)

// ── Componente principal ────────────────────────────────────
const EstadisticasAdmin = () => {
  const { user } = useAuth()
  const { D } = useTheme()
  const [stats, setStats]               = useState(null)
  const [productores, setProductores]   = useState([])
  const [ventasMes, setVentasMes]       = useState([])
  const [pedidosEstado, setPedidosEstado] = useState([])
  const [topProductos, setTopProductos] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      axiosInstance.get("/estadisticas/admin/resumen"),
      axiosInstance.get("/estadisticas/admin/productores"),
      axiosInstance.get("/estadisticas/admin/ventas-mensuales"),
      axiosInstance.get("/estadisticas/admin/pedidos-estado"),
      axiosInstance.get("/estadisticas/admin/top-productos"),
    ]).then(([resumen, prods, meses, estados, tops]) => {
      const d = resumen.data.data || resumen.data
      setStats({
        totalProductos:    d.totalProductos,
        totalPedidos:      d.totalPedidos,
        pedidosPendientes: d.pedidosPendientes,
        pedidosEntregados: d.pedidosEntregados,
        ingresoTotal:      d.ingresoTotal,
      })
      setProductores(Array.isArray(prods.data) ? prods.data : (prods.data.data || []))
      setVentasMes(Array.isArray(meses.data) ? meses.data : (meses.data.data || []))
      setPedidosEstado((Array.isArray(estados.data) ? estados.data : (estados.data.data || [])).map(e => ({
        ...e, name: ESTADO_LABELS[e.estado] || e.estado
      })))
      setTopProductos(Array.isArray(tops.data) ? tops.data : (tops.data.data || []))
    }).catch(err => { if (import.meta.env.DEV) console.error(err) })
    .finally(() => setLoading(false))
  }, [user])

  const makeTrend = (seed = 5, n = 8) => Array.from({ length: n }, (_, i) => seed + Math.sin(i * 0.9 + seed) * 2 + i * 0.3)

  if (loading) return <Spinner D={D} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Sparkles size={16} style={{ color: D.primary }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: D.primary, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Mission Control</span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: D.text, margin: 0, letterSpacing: '-0.6px', fontFamily: "'Fira Code', monospace" }}>Vista global</h2>
          <p style={{ color: D.muted, fontSize: 13, margin: '4px 0 0' }}>Toda la actividad de NaturaPiscis en un vistazo</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <div style={{ position: 'relative', width: 8, height: 8 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: D.primary }} />
            <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: D.primary, opacity: 0.4, animation: 'pulse 1.6s ease-out infinite' }} />
            <style>{`@keyframes pulse { 0% { transform: scale(0.8); opacity: 0.6; } 100% { transform: scale(2.4); opacity: 0; } }`}</style>
          </div>
          <span style={{ color: D.primary, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>EN VIVO</span>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="np-bento-admin" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <style>{`
          @media (max-width: 900px) { .np-bento-admin { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 520px) { .np-bento-admin { grid-template-columns: 1fr !important; } }
        `}</style>
        <KPICard label="Ingresos Totales (Bs)" value={stats.ingresoTotal} prefix="Bs " icon={DollarSign} color="#22C55E" trend={makeTrend(4, 10)} delay={0} big />
        <KPICard label="Total Pedidos"         value={stats.totalPedidos}      icon={ShoppingBag} color="#fb923c" trend={makeTrend(3, 8)} delay={0.1} />
        <KPICard label="Total Productos"       value={stats.totalProductos}    icon={Package}     color="#4ade80" trend={makeTrend(5, 8)} delay={0.15} />
        <KPICard label="Pedidos Pendientes"    value={stats.pedidosPendientes} icon={Activity}    color="#fbbf24" trend={makeTrend(2, 8)} delay={0.2} />
        <KPICard label="Pedidos Entregados"    value={stats.pedidosEntregados} icon={TrendingUp}  color="#4ade80" trend={makeTrend(6, 8)} delay={0.25} />
      </div>

      {/* ── Gráfico de ventas mensuales + pie de estados ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }} className="np-charts-row">
        <style>{`.np-charts-row { @media (max-width: 900px) { grid-template-columns: 1fr !important; } }`}</style>

        {/* Area chart ventas mensuales */}
        <CardWrap D={D}>
          <SectionHeader icon={TrendingUp} title="Ingresos Mensuales (Bs)" subtitle="Últimos 12 meses" D={D} />
          {ventasMes.length === 0
            ? <p style={{ color: D.muted, textAlign: 'center', padding: 30, fontSize: 13 }}>Sin datos en este período</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={ventasMes} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={D.border} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: D.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: D.muted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `Bs ${v.toLocaleString()}`} width={80} />
                  <RTooltip content={<CustomTooltip prefix="Bs " />} />
                  <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#22C55E" strokeWidth={2} fill="url(#gradVentas)" dot={{ fill: '#22C55E', r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </CardWrap>

        {/* Pie pedidos por estado */}
        <CardWrap D={D}>
          <SectionHeader icon={Activity} title="Pedidos por Estado" subtitle="Distribución actual" D={D} />
          {pedidosEstado.length === 0
            ? <p style={{ color: D.muted, textAlign: 'center', padding: 30, fontSize: 13 }}>Sin datos</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pedidosEstado} dataKey="cantidad" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                    {pedidosEstado.map((e, i) => (
                      <Cell key={i} fill={ESTADO_COLORS[e.estado] || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip formatter={(v, n) => [`${v} pedidos`, n]} contentStyle={{ background: 'rgba(15,15,20,0.95)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: D.sub, fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </CardWrap>
      </div>

      {/* ── Top productos ── */}
      <CardWrap D={D}>
        <SectionHeader icon={BarChart2} title="Top Productos por Ingresos" subtitle="Los 8 productos que más generaron (Bs)" D={D} />
        {topProductos.length === 0
          ? <p style={{ color: D.muted, textAlign: 'center', padding: 30, fontSize: 13 }}>Sin datos</p>
          : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProductos} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={D.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: D.muted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `Bs ${v.toLocaleString()}`} />
                <YAxis type="category" dataKey="nombre" tick={{ fill: D.sub, fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                <RTooltip content={<CustomTooltip prefix="Bs " />} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#22C55E" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </CardWrap>

      {/* ── Ranking productores ── */}
      <div>
        <SectionHeader icon={Store} title="Ventas por Productor" subtitle="Rendimiento individual en la plataforma" D={D} />
        <CardWrap D={D}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(34,197,94,0.05)', borderBottom: `1px solid ${D.border}` }}>
                  <th style={th(D)}>#</th>
                  <th style={th(D)}>Productor</th>
                  <th style={th(D)}>Empresa</th>
                  <th style={th(D)}>Total Ventas</th>
                  <th style={th(D)}>Pedidos</th>
                  <th style={th(D)}>Productos</th>
                  <th style={th(D)}>Clientes</th>
                </tr>
              </thead>
              <tbody>
                {productores.length === 0
                  ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: D.muted, fontSize: 13 }}>No hay productores registrados</td></tr>
                  : productores.map((p, i) => {
                    const iniciales = p.nombre?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "P"
                    const rankColor = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#fb923c' : D.muted
                    return (
                      <motion.tr key={p.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        style={{ borderBottom: `1px solid ${D.border}`, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={td()}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: rankColor, fontFamily: 'monospace' }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </span>
                        </td>
                        <td style={td()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0, boxShadow: '0 0 10px rgba(34,197,94,0.35)', border: '2px solid rgba(34,197,94,0.3)' }}>
                              {iniciales}
                            </div>
                            <span style={{ color: D.text, fontSize: 13, fontWeight: 600 }}>{p.nombre}</span>
                          </div>
                        </td>
                        <td style={td()}><span style={{ color: D.muted, fontSize: 13 }}>{p.nombre_empresa || "—"}</span></td>
                        <td style={td()}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: p.total_ventas > 0 ? D.primary : D.muted, fontFamily: "'Fira Code', monospace" }}>
                            Bs {Number(p.total_ventas).toFixed(2)}
                          </span>
                        </td>
                        <td style={td()}><span style={{ color: D.sub, fontSize: 13 }}>{p.total_pedidos}</span></td>
                        <td style={td()}><span style={{ color: D.sub, fontSize: 13 }}>{p.total_productos}</span></td>
                        <td style={td()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={13} style={{ color: D.muted }} />
                            <span style={{ color: D.sub, fontSize: 13 }}>{p.total_clientes}</span>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>
        </CardWrap>
      </div>

    </div>
  )
}

const th = (D) => ({
  textAlign: 'left', fontSize: 10, fontWeight: 700, color: D.muted,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  padding: '12px 18px', whiteSpace: 'nowrap',
})
const td = () => ({ padding: '13px 18px', fontSize: 13 })

export default EstadisticasAdmin
