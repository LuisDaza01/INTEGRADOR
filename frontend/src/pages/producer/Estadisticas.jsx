"use client"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import api from "../../api/config/axios"
import { motion } from "framer-motion"
import { BarChart3, PieChart, TrendingUp, TrendingDown, Calendar, Filter, Download, FileText, RefreshCw, AlertCircle, Star, ChevronDown, Clock, Heart, Award, Users, Target, Zap, ShoppingBag } from "lucide-react"
import { API_ENDPOINTS } from '../../config/apiConfig'
import { useTheme } from "../../contexts/ThemeContext"

// ── Marketing KPI card con comparación real vs período anterior ────
const MarketingKPI = ({ label, value, prefix = "", suffix = "", cambio, icon: Icon, color = "blue", D }) => {
  const palette = {
    blue:   { glow: "#38bdf8", accent: "#0ea5e9" },
    green:  { glow: "#4ade80", accent: "#22c55e" },
    purple: { glow: "#c084fc", accent: "#a855f7" },
    orange: { glow: "#fb923c", accent: "#f97316" },
    pink:   { glow: "#f472b6", accent: "#ec4899" },
  }
  const p = palette[color] || palette.blue
  const sube = cambio > 0
  const baja = cambio < 0
  const colorCambio = sube ? "#22c55e" : baja ? "#ef4444" : D.muted
  return (
    <div style={{
      background: `linear-gradient(135deg, ${p.glow}14, ${p.glow}06)`,
      border: `1px solid ${p.glow}30`,
      borderRadius: 14, padding: 18,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: D.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${p.glow}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} style={{ color: p.accent }} />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, color: p.accent, margin: "0 0 4px" }}>
        {prefix}{value}{suffix}
      </p>
      {cambio !== undefined && cambio !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
          {sube ? <TrendingUp size={13} style={{ color: colorCambio }} />
            : baja ? <TrendingDown size={13} style={{ color: colorCambio }} />
            : null}
          <span style={{ color: colorCambio, fontWeight: 700 }}>
            {sube ? "+" : ""}{cambio}%
          </span>
          <span style={{ color: D.muted, fontSize: 11 }}>vs período anterior</span>
        </div>
      )}
    </div>
  )
}

// ── Insight card (recomendación automática) ────────────────────────
const InsightCard = ({ insight, D }) => {
  const colores = {
    positivo: { bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.3)", icon: "#22c55e" },
    alerta:   { bg: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.3)", icon: "#fb923c" },
    info:     { bg: "rgba(56,189,248,0.10)", border: "rgba(56,189,248,0.3)", icon: "#38bdf8" },
  }
  const c = colores[insight.tipo] || colores.info
  const Icon = {
    calendar: Calendar, clock: Clock, alert: AlertCircle, check: Target,
    trending_up: TrendingUp, trending_down: TrendingDown, star: Star, heart: Heart,
  }[insight.icono] || Zap
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 10, padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <Icon size={16} style={{ color: c.icon, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: D.text, lineHeight: 1.4 }}>{insight.texto}</span>
    </div>
  )
}

// ── Gráfico de barras simple para ventas/día ──────────────────────
const SalesByDayChart = ({ data, D }) => {
  if (!data?.length) return <p style={{ color: D.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Sin datos en el período</p>
  const maxV = Math.max(...data.map(d => d.ventas), 1)
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 140, overflowX: "auto", padding: "8px 4px" }}>
      {data.map((d, i) => {
        const altura = Math.max((d.ventas / maxV) * 120, 2)
        const fecha = new Date(d.fecha + "T00:00:00")
        const lbl = `${fecha.getDate()}/${fecha.getMonth() + 1}`
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 26 }} title={`${d.fecha}: Bs ${d.ventas.toFixed(2)} (${d.pedidos} pedidos)`}>
            <div style={{ width: 18, height: altura, background: "linear-gradient(to top, #0ea5e9, #22d3ee)", borderRadius: "4px 4px 0 0" }} />
            <span style={{ fontSize: 9, color: D.dim, transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{lbl}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Prediction Line Chart ──────────────────────────────────────
const PredictionChart = ({ historico, prediccion, D }) => {
  const allPts = [...historico, ...prediccion]
  if (!allPts.length) return null

  const PAD = { left: 52, right: 16, top: 12, bottom: 52 }
  const W = 560, H = 220
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top  - PAD.bottom

  const maxVal = Math.max(...allPts.map(p => p.upper ?? p.valor), 1)
  const n      = allPts.length
  const lastH  = historico.length - 1

  const xS = (i) => PAD.left + (n > 1 ? (i / (n - 1)) * cW : cW / 2)
  const yS = (v) => PAD.top + cH - Math.min((v / maxVal) * cH, cH)

  const histPath = historico
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${yS(p.valor).toFixed(1)}`)
    .join(' ')

  const predPath = prediccion.length
    ? [`M${xS(lastH).toFixed(1)},${yS(historico[lastH].valor).toFixed(1)}`,
       ...prediccion.map((p, i) => `L${xS(lastH + 1 + i).toFixed(1)},${yS(p.valor).toFixed(1)}`)
      ].join(' ')
    : ''

  // Confidence band polygon (upper L→R, lower R→L)
  const bandUpper = prediccion.map((p, i) => `${xS(lastH + 1 + i).toFixed(1)},${yS(p.upper).toFixed(1)}`)
  const bandLower = [...prediccion].reverse().map((p, i) =>
    `${xS(lastH + prediccion.length - i).toFixed(1)},${yS(p.lower).toFixed(1)}`
  )
  const bandPoly = [...bandUpper, ...bandLower].join(' ')

  // Y-axis ticks (5 levels)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => maxVal * f)

  // X labels: show every ceil(n/9) ticks
  const skip = Math.max(1, Math.ceil(n / 9))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {/* Grid + Y labels */}
      {yTicks.map((v, i) => {
        const y = yS(v)
        const label = v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={D.border} strokeWidth={0.5} />
            <text x={PAD.left - 5} y={y + 4} textAnchor="end" fill={D.dim} fontSize={9}>{label}</text>
          </g>
        )
      })}

      {/* Prediction zone separator */}
      {prediccion.length > 0 && (
        <line x1={xS(lastH)} y1={PAD.top} x2={xS(lastH)} y2={PAD.top + cH}
          stroke={D.border} strokeWidth={1} strokeDasharray="4,3" />
      )}

      {/* Confidence band */}
      {prediccion.length > 0 && (
        <polygon points={bandPoly} fill="rgba(139,92,246,0.10)" />
      )}

      {/* Historical line */}
      <path d={histPath} fill="none" stroke="#38bdf8" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {/* Prediction line */}
      {predPath && (
        <path d={predPath} fill="none" stroke="#8b5cf6" strokeWidth={2}
          strokeDasharray="7,4" strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* Historical dots */}
      {historico.map((p, i) => (
        <circle key={i} cx={xS(i)} cy={yS(p.valor)} r={3} fill="#38bdf8" />
      ))}

      {/* Prediction dots */}
      {prediccion.map((p, i) => (
        <circle key={i} cx={xS(lastH + 1 + i)} cy={yS(p.valor)} r={3} fill="#8b5cf6" />
      ))}

      {/* X labels */}
      {allPts.map((p, i) => {
        if (i % skip !== 0 && i !== n - 1) return null
        const isP = i > lastH
        return (
          <text key={i}
            x={xS(i)} y={H - PAD.bottom + 13}
            textAnchor="end" fill={isP ? '#8b5cf6' : D.dim}
            fontSize={8.5}
            transform={`rotate(-40,${xS(i).toFixed(1)},${(H - PAD.bottom + 13).toFixed(1)})`}>
            {p.mes}
          </text>
        )
      })}
    </svg>
  )
}

// ── Export helpers ─────────────────────────────────────────────
const downloadFile = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
}

const exportCSV = (stats, productosConResenas) => {
  const rows = []
  rows.push(['=== RESUMEN GENERAL ==='])
  rows.push(['Métrica', 'Valor'])
  rows.push(['Ventas Totales (Bs)', stats?.ventasTotales?.toFixed(2) ?? '0.00'])
  rows.push(['Producción Total (kg)', stats?.produccionTotal ?? 0])
  rows.push(['Clientes Activos', stats?.clientesActivos ?? 0])
  rows.push([])
  rows.push(['=== VENTAS MENSUALES ==='])
  rows.push(['Mes', 'Ventas (Bs)'])
  ;(stats?.ventasMensuales ?? []).forEach(m => rows.push([m.mes, m.valor.toFixed(2)]))
  rows.push([])
  rows.push(['=== DISTRIBUCIÓN DE PRODUCTOS ==='])
  rows.push(['Producto', 'Porcentaje (%)'])
  ;(stats?.distribucionProductos ?? []).forEach(p => rows.push([p.nombre, p.porcentaje.toFixed(1)]))
  if (productosConResenas.length) {
    rows.push([])
    rows.push(['=== RESEÑAS POR PRODUCTO ==='])
    rows.push(['Producto', 'Calificación Promedio', 'N° Reseñas'])
    productosConResenas.forEach(p => rows.push([p.nombre, p.avg.toFixed(1), p.count]))
  }
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const today = new Date().toISOString().slice(0, 10)
  downloadFile('﻿' + csv, `naturapiscis_estadisticas_${today}.csv`, 'text/csv;charset=utf-8;')
}

const exportPDF = (stats) => {
  const today = new Date().toLocaleDateString('es-BO')
  const html = `
    <html><head><meta charset="utf-8">
    <title>Estadísticas NaturaPiscis</title>
    <style>
      body{font-family:sans-serif;padding:32px;color:#111;line-height:1.5}
      h1{font-size:22px;margin-bottom:4px}
      .sub{color:#666;font-size:13px;margin-bottom:28px}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th{background:#0284c7;color:#fff;padding:8px 12px;text-align:left;font-size:13px}
      td{padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
      tr:nth-child(even) td{background:#f8fafc}
      .kpi{display:inline-block;background:#f0f7ff;border:1px solid #bae6fd;border-radius:8px;padding:14px 20px;margin:0 12px 12px 0;min-width:140px}
      .kpi .val{font-size:22px;font-weight:700;color:#0284c7}
      .kpi .lbl{font-size:12px;color:#666;margin-top:2px}
      @media print{button{display:none}}
    </style></head><body>
    <h1>📊 Estadísticas NaturaPiscis</h1>
    <p class="sub">Generado el ${today}</p>
    <div>
      <div class="kpi"><div class="val">Bs ${stats?.ventasTotales?.toFixed(2) ?? '0.00'}</div><div class="lbl">Ventas Totales</div></div>
      <div class="kpi"><div class="val">${stats?.produccionTotal ?? 0} kg</div><div class="lbl">Producción Total</div></div>
      <div class="kpi"><div class="val">${stats?.clientesActivos ?? 0}</div><div class="lbl">Clientes Activos</div></div>
    </div>
    <h3>Ventas Mensuales</h3>
    <table><tr><th>Mes</th><th>Ventas (Bs)</th></tr>
    ${(stats?.ventasMensuales ?? []).map(m => `<tr><td>${m.mes}</td><td>Bs ${m.valor.toFixed(2)}</td></tr>`).join('')}
    </table>
    ${stats?.distribucionProductos?.length ? `<h3>Distribución de Productos</h3><table><tr><th>Producto</th><th>%</th></tr>${stats.distribucionProductos.map(p => `<tr><td>${p.nombre}</td><td>${p.porcentaje.toFixed(1)}%</td></tr>`).join('')}</table>` : ''}
    <script>window.onload=()=>{window.print()}</script>
    </body></html>`
  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
}

const FALLBACK_STATS = {
  ventasTotales: 0, produccionTotal: 0, clientesActivos: 0,
  ventasMensuales: [
    { mes: "Ene", valor: 0 }, { mes: "Feb", valor: 0 }, { mes: "Mar", valor: 0 },
    { mes: "Abr", valor: 0 }, { mes: "May", valor: 0 }, { mes: "Jun", valor: 0 },
    { mes: "Jul", valor: 0 }, { mes: "Ago", valor: 0 }, { mes: "Sep", valor: 0 },
    { mes: "Oct", valor: 0 }, { mes: "Nov", valor: 0 }, { mes: "Dic", valor: 0 },
  ],
  distribucionProductos: [],
}

const Estadisticas = () => {
  const { D } = useTheme()
  const [replyState, setReplyState] = useState({})
  const [periodoMK, setPeriodoMK] = useState('30d')
  const qc = useQueryClient()

  // Marketing analytics — métricas comparadas vs período anterior + insights automáticos
  const { data: marketing, isLoading: loadingMK } = useQuery({
    queryKey: ['estadisticas', 'marketing', periodoMK],
    queryFn: async () => {
      const r = await api.get(`${API_ENDPOINTS.ESTADISTICAS.MARKETING}?periodo=${periodoMK}`)
      return r.data.data
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: stats = FALLBACK_STATS, isLoading: loading, error: statsError, refetch: fetchStats } = useQuery({
    queryKey: ['estadisticas', 'productor'],
    queryFn: async () => {
      const r = await api.get(API_ENDPOINTS.ESTADISTICAS.PRODUCTOR)
      return r.data.data
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: prediccion = null, isLoading: loadingPrediccion } = useQuery({
    queryKey: ['estadisticas', 'prediccion'],
    queryFn: async () => {
      const r = await api.get(API_ENDPOINTS.ESTADISTICAS.PREDICCION)
      return r.data.data
    },
    staleTime: 15 * 60 * 1000,
  })

  const { data: productosConResenas = [], isLoading: loadingResenas } = useQuery({
    queryKey: ['estadisticas', 'resenas'],
    queryFn: async () => {
      const resProd = await api.get(API_ENDPOINTS.MIS_PRODUCTOS.BASE)
      const productos = resProd.data.data || resProd.data || []
      if (!productos.length) return []
      return Promise.all(
        productos.map(async (p) => {
          try {
            const resOp = await api.get(API_ENDPOINTS.OPINIONES.POR_PRODUCTO(p.id))
            const ops = resOp.data.data || []
            const avg = ops.length ? ops.reduce((s, o) => s + o.calificacion, 0) / ops.length : 0
            return { id: p.id, nombre: p.nombre, avg, count: ops.length, resenas: ops }
          } catch {
            return { id: p.id, nombre: p.nombre, avg: 0, count: 0, resenas: [] }
          }
        })
      )
    },
    staleTime: 5 * 60 * 1000,
  })

  const error = statsError?.response?.data?.error || statsError?.message || null

  const submitRespuesta = async (opinionId, texto) => {
    if (!texto?.trim()) return
    setReplyState(prev => ({ ...prev, [opinionId]: { ...prev[opinionId], loading: true } }))
    try {
      await api.put(API_ENDPOINTS.OPINIONES.RESPONDER(opinionId), { respuesta: texto })
      qc.setQueryData(['estadisticas', 'resenas'], (old = []) =>
        old.map(p => ({ ...p, resenas: p.resenas.map(r => r.id === opinionId ? { ...r, respuesta: texto.trim() } : r) }))
      )
      setReplyState(prev => ({ ...prev, [opinionId]: { open: false, text: '', loading: false } }))
    } catch {
      setReplyState(prev => ({ ...prev, [opinionId]: { ...prev[opinionId], loading: false } }))
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  }

  const renderBarChart = () => {
    if (!stats?.ventasMensuales?.length) {
      return (
        <div style={{ height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: D.muted }}>No hay datos de ventas mensuales</p>
        </div>
      )
    }
    const ventasMensuales = stats.ventasMensuales
    const maxValue = Math.max(...ventasMensuales.map(i => i.valor), 1)
    return (
      <div style={{ display: 'flex', height: 256, alignItems: 'flex-end', gap: 6, marginTop: 16, justifyContent: 'center' }}>
        {ventasMensuales.map((item, index) => (
          <motion.div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1, transition: { delay: index * 0.05 } }}>
            <motion.div
              style={{ width: 28, background: 'linear-gradient(to top, #0ea5e9, #22d3ee)', borderRadius: '4px 4px 0 0', minHeight: 4,
                height: item.valor > 0 ? `${Math.max((item.valor / maxValue) * 180, 4)}px` : '4px' }}
              whileHover={{ scale: 1.05 }} title={`${item.mes}: Bs${item.valor.toFixed(2)}`} />
            <span style={{ fontSize: 10, marginTop: 4, color: D.muted }}>{item.mes}</span>
            <span style={{ fontSize: 10, color: D.dim }}>Bs{item.valor.toFixed(0)}</span>
          </motion.div>
        ))}
      </div>
    )
  }

  const renderPieChart = () => {
    if (!stats?.distribucionProductos?.length) {
      return (
        <div style={{ height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: D.muted }}>No hay datos de productos vendidos</p>
        </div>
      )
    }
    const distribucionProductos = stats.distribucionProductos
    let cumulativePercentage = 0
    const colors = ["#38bdf8", "#06B6D4", "#10B981", "#6366F1", "#8B5CF6"]
    return (
      <div style={{ position: 'relative', width: 200, height: 200, margin: '16px auto 0' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          {distribucionProductos.map((item, index) => {
            const startAngle = cumulativePercentage * 3.6
            cumulativePercentage += item.porcentaje
            const endAngle = cumulativePercentage * 3.6
            const startX = 50 + 40 * Math.cos((startAngle - 90) * (Math.PI / 180))
            const startY = 50 + 40 * Math.sin((startAngle - 90) * (Math.PI / 180))
            const endX = 50 + 40 * Math.cos((endAngle - 90) * (Math.PI / 180))
            const endY = 50 + 40 * Math.sin((endAngle - 90) * (Math.PI / 180))
            const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
            return (
              <motion.path key={index}
                d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                fill={colors[index % colors.length]}
                initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: index * 0.2 } }}
                whileHover={{ scale: 1.05 }} />
            )
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: D.card, borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${D.border}` }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: D.text, textAlign: 'center' }}>Productos</span>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `3px solid ${D.border}`, borderTopColor: D.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: D.muted }}>Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bg }}>
        <div style={{ textAlign: 'center', padding: 24, background: D.card, borderRadius: 16, border: `1px solid ${D.border}`, maxWidth: 400 }}>
          <AlertCircle size={48} style={{ color: D.red, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 8 }}>Error al cargar estadísticas</h3>
          <p style={{ color: D.muted, marginBottom: 16 }}>{error}</p>
          <button onClick={fetchStats} style={{ background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const kpiCards = [
    { label: 'Ventas Totales', value: `Bs ${stats?.ventasTotales?.toFixed(2) || "0.00"}`, icon: BarChart3, accent: D.primary, glow: 'rgba(56,189,248,0.15)' },
    { label: 'Producción Total', value: `${stats?.produccionTotal || 0} kg`, icon: TrendingUp, accent: D.teal, glow: 'rgba(20,184,166,0.15)' },
    { label: 'Clientes Activos', value: stats?.clientesActivos || 0, icon: PieChart, accent: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
  ]

  return (
    <motion.div style={{ padding: 24, height: '100%', overflowY: 'auto', background: D.bg }}
      initial="hidden" animate="visible" variants={containerVariants}>

      {error && (
        <motion.div variants={itemVariants} style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} style={{ color: D.orange }} />
          <span style={{ color: D.orange, fontSize: 13 }}>{error} — Mostrando datos por defecto</span>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: D.text, margin: '0 0 4px' }}>Estadísticas</h1>
          <p style={{ color: D.muted, fontSize: 14, margin: 0 }}>Visualiza el rendimiento de tu producción acuícola</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => exportCSV(stats, productosConResenas)}
            title="Descargar CSV"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            <Download size={15} style={{ color: D.teal }} />CSV
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => exportPDF(stats)}
            title="Imprimir como PDF"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            <FileText size={15} style={{ color: D.orange }} />PDF
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchStats}
            style={{ padding: '7px 10px', background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, cursor: 'pointer' }}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </motion.button>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ║ DASHBOARD DE MARKETING — KPIs + Insights automáticos    ║ */}
      {/* ══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
        {/* Header con selector de período */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: D.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} style={{ color: '#fb923c' }} />
            Marketing Analytics
          </h2>
          <div style={{ display: 'flex', gap: 4, background: D.card, border: `1px solid ${D.border}`, borderRadius: 10, padding: 3 }}>
            {[
              { k: 'hoy',  l: 'Hoy'    },
              { k: '7d',   l: '7 días' },
              { k: '30d',  l: '30 días'},
              { k: '90d',  l: '90 días'},
              { k: 'año',  l: 'Año'    },
            ].map(p => (
              <button key={p.k} onClick={() => setPeriodoMK(p.k)}
                style={{
                  padding: '5px 12px', fontSize: 12, fontWeight: 600,
                  background: periodoMK === p.k ? `linear-gradient(135deg, ${D.primary}, ${D.teal})` : 'transparent',
                  color: periodoMK === p.k ? '#fff' : D.muted,
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                }}>
                {p.l}
              </button>
            ))}
          </div>
        </div>

        {loadingMK && !marketing ? (
          <div style={{ padding: 40, textAlign: 'center', color: D.muted, fontSize: 13 }}>
            Cargando métricas…
          </div>
        ) : marketing && (
          <>
            {/* KPIs principales con comparación real */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 18 }}>
              <MarketingKPI D={D} label="Ingresos" prefix="Bs " value={marketing.metricas.ingresos.actual.toFixed(2)} cambio={marketing.metricas.ingresos.cambio_pct} icon={BarChart3} color="blue" />
              <MarketingKPI D={D} label="Pedidos completados" value={marketing.metricas.pedidos.completados} cambio={marketing.metricas.pedidos.cambio_pct} icon={ShoppingBag} color="green" />
              <MarketingKPI D={D} label="Ticket promedio" prefix="Bs " value={marketing.metricas.ticket_promedio.actual.toFixed(2)} cambio={marketing.metricas.ticket_promedio.cambio_pct} icon={TrendingUp} color="purple" />
              <MarketingKPI D={D} label="Clientes únicos" value={marketing.metricas.clientes_unicos.actual} cambio={marketing.metricas.clientes_unicos.cambio_pct} icon={Users} color="orange" />
              <MarketingKPI D={D} label="Tasa conversión" suffix="%" value={marketing.metricas.tasa_conversion} icon={Target} color="green" />
              <MarketingKPI D={D} label="Tasa cancelación" suffix="%" value={marketing.metricas.tasa_cancelacion} icon={AlertCircle} color={marketing.metricas.tasa_cancelacion > 15 ? "orange" : "blue"} />
            </div>

            {/* Insights automáticos */}
            {marketing.insights?.length > 0 && (
              <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 16, marginBottom: 18 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={14} style={{ color: '#fb923c' }} />
                  Recomendaciones para ti
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                  {marketing.insights.map((ins, i) => <InsightCard key={i} insight={ins} D={D} />)}
                </div>
              </div>
            )}

            {/* Ventas por día + Hora/Día pico + Top clientes + Funnel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginBottom: 18 }}>
              {/* Ventas por día */}
              <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: '0 0 8px' }}>Ventas día a día</h3>
                <SalesByDayChart data={marketing.ventas_por_dia} D={D} />
              </div>

              {/* Hora pico + Día pico */}
              <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: 0 }}>Momentos pico</h3>
                {marketing.hora_pico ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(56,189,248,0.08)', borderRadius: 10, border: '1px solid rgba(56,189,248,0.2)' }}>
                    <Clock size={28} style={{ color: '#0ea5e9' }} />
                    <div>
                      <p style={{ fontSize: 11, color: D.muted, margin: '0 0 2px' }}>Hora pico</p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#0ea5e9', margin: '0 0 2px' }}>
                        {String(marketing.hora_pico.hora).padStart(2, '0')}:00 – {String((marketing.hora_pico.hora + 1) % 24).padStart(2, '0')}:00
                      </p>
                      <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>{marketing.hora_pico.pedidos} pedidos · Bs {marketing.hora_pico.ventas.toFixed(0)}</p>
                    </div>
                  </div>
                ) : <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>Sin datos de hora pico</p>}
                {marketing.dia_semana_pico ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(34,197,94,0.08)', borderRadius: 10, border: '1px solid rgba(34,197,94,0.2)' }}>
                    <Calendar size={28} style={{ color: '#22c55e' }} />
                    <div>
                      <p style={{ fontSize: 11, color: D.muted, margin: '0 0 2px' }}>Mejor día de la semana</p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#22c55e', margin: '0 0 2px' }}>{marketing.dia_semana_pico.dia}</p>
                      <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>{marketing.dia_semana_pico.pedidos} pedidos · Bs {marketing.dia_semana_pico.ventas.toFixed(0)}</p>
                    </div>
                  </div>
                ) : <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>Sin datos de día pico</p>}
              </div>

              {/* Top clientes */}
              <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={14} style={{ color: '#fb923c' }} /> Top clientes
                </h3>
                {marketing.top_clientes?.length === 0 ? (
                  <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>Sin clientes en el período</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {marketing.top_clientes.map((c, i) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < marketing.top_clientes.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : D.surface, color: i === 0 ? '#fff' : D.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                        {c.foto_perfil
                          ? <img src={c.foto_perfil} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                          : <div style={{ width: 28, height: 28, borderRadius: '50%', background: D.primary + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: D.primary }}>{c.nombre?.[0]?.toUpperCase() || '?'}</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: D.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</p>
                          <p style={{ fontSize: 10, color: D.muted, margin: 0 }}>{c.pedidos} pedido{c.pedidos !== 1 ? 's' : ''}</p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: D.primary }}>Bs {c.gastado.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Funnel de reservas */}
              <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Filter size={14} style={{ color: '#a855f7' }} /> Funnel de reservas
                </h3>
                {marketing.funnel_reservas.creadas === 0 ? (
                  <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>Sin reservas en el período</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { l: 'Creadas',    v: marketing.funnel_reservas.creadas,    c: '#38bdf8' },
                      { l: 'Aceptadas',  v: marketing.funnel_reservas.aceptadas,  c: '#22c55e' },
                      { l: 'Rechazadas', v: marketing.funnel_reservas.rechazadas, c: '#ef4444' },
                      { l: 'Expiradas',  v: marketing.funnel_reservas.expiradas,  c: '#fb923c' },
                      { l: 'Canceladas', v: marketing.funnel_reservas.canceladas, c: D.muted },
                    ].map(row => {
                      const pct = marketing.funnel_reservas.creadas > 0
                        ? (row.v / marketing.funnel_reservas.creadas) * 100
                        : 0
                      return (
                        <div key={row.l}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: D.muted, marginBottom: 2 }}>
                            <span>{row.l}</span>
                            <span style={{ color: D.text, fontWeight: 700 }}>{row.v}</span>
                          </div>
                          <div style={{ height: 5, background: D.surface, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: row.c, transition: 'width 0.4s' }} />
                          </div>
                        </div>
                      )
                    })}
                    <p style={{ fontSize: 11, color: D.muted, marginTop: 6, textAlign: 'center' }}>
                      Tasa de aceptación: <span style={{ color: '#22c55e', fontWeight: 700 }}>{marketing.funnel_reservas.tasa_aceptacion}%</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Sección clásica (mantenida para compatibilidad — ventas mensuales 12m) */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: D.text, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Calendar size={18} style={{ color: D.primary }} />
        Vista anual
      </h2>

      {/* KPI Cards (ventas totales históricas) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        {kpiCards.map(({ label, value, icon: Icon, accent, glow }) => (
          <motion.div key={label} variants={itemVariants} whileHover={{ y: -4 }}
            className="np-hover"
            style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20,
              boxShadow: `0 4px 20px ${glow}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, color: D.muted, margin: 0, fontWeight: 500 }}>{label}</h3>
              <div style={{ padding: 8, borderRadius: 8, background: glow }}>
                <Icon size={18} style={{ color: accent }} />
              </div>
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: accent, margin: '0 0 8px' }}>{value}</p>
            <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>Total histórico</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
        <motion.div variants={itemVariants} className="np-hover" style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, color: D.text, margin: 0, fontSize: 15 }}>Ventas Mensuales</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select style={{ fontSize: 11, background: D.surface, border: `1px solid ${D.border}`, color: D.text, borderRadius: 6, padding: '3px 6px', outline: 'none' }}>
                <option>Este Año</option><option>Año Anterior</option>
              </select>
              <Calendar size={14} style={{ color: D.muted }} />
            </div>
          </div>
          {renderBarChart()}
        </motion.div>

        <motion.div variants={itemVariants} className="np-hover" style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, color: D.text, margin: 0, fontSize: 15 }}>Distribución de Productos</h3>
            <select style={{ fontSize: 11, background: D.surface, border: `1px solid ${D.border}`, color: D.text, borderRadius: 6, padding: '3px 6px', outline: 'none' }}>
              <option>Por Ventas</option><option>Por Cantidad</option>
            </select>
          </div>
          {renderPieChart()}
          {stats?.distribucionProductos?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
              {stats.distribucionProductos.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: ["#38bdf8","#06B6D4","#10B981","#6366F1","#8B5CF6"][index % 5], flexShrink: 0 }} />
                  <span style={{ color: D.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.producto}</span>
                  <span style={{ fontWeight: 600, color: D.muted }}>{item.porcentaje}%</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Módulo C: Predicción de Ventas ─────────────── */}
      <motion.div variants={itemVariants} style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} style={{ color: '#8b5cf6' }} />
            Predicción de Ventas
          </h3>
          {loadingPrediccion && (
            <div style={{ width: 18, height: 18, border: `2px solid ${D.border}`, borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          )}
        </div>

        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
          {loadingPrediccion ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: D.muted, fontSize: 13 }}>Calculando regresión lineal…</p>
            </div>
          ) : prediccion?.mensaje ? (
            <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <AlertCircle size={28} style={{ color: D.muted }} />
              <p style={{ color: D.muted, fontSize: 13, margin: 0, textAlign: 'center' }}>{prediccion.mensaje}</p>
            </div>
          ) : prediccion ? (
            <>
              {/* Métricas del modelo */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', fontSize: 12 }}>
                  <span style={{ color: D.muted }}>Modelo: </span>
                  <span style={{ color: '#8b5cf6', fontWeight: 600, fontFamily: 'monospace' }}>{prediccion.modelo}</span>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(56,189,248,0.08)', border: `1px solid ${D.border}`, fontSize: 12 }}>
                  <span style={{ color: D.muted }}>R² = </span>
                  <span style={{ color: D.primary, fontWeight: 700 }}>{prediccion.r2.toFixed(3)}</span>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(56,189,248,0.08)', border: `1px solid ${D.border}`, fontSize: 12 }}>
                  <span style={{ color: D.muted }}>RMSE = </span>
                  <span style={{ color: D.primary, fontWeight: 700 }}>Bs {prediccion.rmse.toFixed(2)}</span>
                </div>
              </div>

              {/* Gráfico */}
              <PredictionChart
                historico={prediccion.historico}
                prediccion={prediccion.prediccion}
                D={D}
              />

              {/* Leyenda */}
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: D.muted }}>
                  <svg width={28} height={10}><line x1={0} y1={5} x2={28} y2={5} stroke="#38bdf8" strokeWidth={2} /></svg>
                  Ventas históricas
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: D.muted }}>
                  <svg width={28} height={10}><line x1={0} y1={5} x2={28} y2={5} stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6,3" /></svg>
                  Proyección 6 meses
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: D.muted }}>
                  <svg width={16} height={10}><rect x={0} y={1} width={16} height={8} rx={2} fill="rgba(139,92,246,0.18)" /></svg>
                  Intervalo 95%
                </div>
              </div>

              {/* Tabla de proyección */}
              {prediccion.prediccion.length > 0 && (
                <div style={{ marginTop: 16, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: D.surface }}>
                        <th style={{ padding: '6px 10px', textAlign: 'left', color: D.muted, fontWeight: 600, borderBottom: `1px solid ${D.border}` }}>Mes</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right', color: D.muted, fontWeight: 600, borderBottom: `1px solid ${D.border}` }}>Proyectado (Bs)</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right', color: D.muted, fontWeight: 600, borderBottom: `1px solid ${D.border}` }}>Mín (Bs)</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right', color: D.muted, fontWeight: 600, borderBottom: `1px solid ${D.border}` }}>Máx (Bs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prediccion.prediccion.map((p, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${D.border}` }}>
                          <td style={{ padding: '6px 10px', color: '#8b5cf6', fontWeight: 600 }}>{p.mes}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: D.text, fontWeight: 700 }}>{p.valor.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: D.muted }}>{p.lower.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: D.muted }}>{p.upper.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      </motion.div>

      {/* ── Reseñas de tus Productos ────────────────────── */}
      <motion.div variants={itemVariants} style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={18} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
            Reseñas de tus Productos
          </h3>
          {loadingResenas && (
            <div style={{ width: 18, height: 18, border: `2px solid ${D.border}`, borderTopColor: D.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          )}
        </div>

        {!loadingResenas && productosConResenas.length === 0 ? (
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 32, textAlign: 'center' }}>
            <Star size={36} style={{ color: D.dim, margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: D.muted, margin: 0 }}>Aún no tienes reseñas en tus productos</p>
          </div>
        ) : (
          <>
            {/* Resumen por producto */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 12, marginBottom: 20 }}>
              {productosConResenas.map(p => (
                <div key={p.id} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: D.text, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={13} style={{ color: '#F59E0B', fill: s <= Math.round(p.avg) && p.count > 0 ? '#F59E0B' : 'none' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 22, fontWeight: 800, color: p.count > 0 ? '#F59E0B' : D.dim, margin: '0 0 2px' }}>
                    {p.count > 0 ? p.avg.toFixed(1) : '—'}
                  </p>
                  <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>{p.count} reseña{p.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>

            {/* Comentarios recientes */}
            {(() => {
              const todas = productosConResenas
                .flatMap(p => p.resenas.map(r => ({ ...r, producto_nombre: p.nombre })))
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .slice(0, 6)
              if (!todas.length) return (
                <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
                  <p style={{ color: D.muted, fontSize: 13, margin: 0 }}>Ningún producto tiene comentarios todavía</p>
                </div>
              )
              return (
                <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${D.border}` }}>
                    <p style={{ fontWeight: 600, color: D.text, fontSize: 14, margin: 0 }}>Comentarios recientes</p>
                  </div>
                  {todas.map((r, i) => (
                    <div key={r.id} style={{ padding: '12px 16px', borderBottom: i < todas.length - 1 ? `1px solid ${D.border}` : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: D.primary + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: D.primary, flexShrink: 0, overflow: 'hidden' }}>
                        {r.foto_perfil
                          ? <img src={r.foto_perfil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : r.usuario_nombre?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{r.usuario_nombre}</span>
                            <span style={{ fontSize: 11, color: D.muted, marginLeft: 8 }}>
                              sobre <em>{r.producto_nombre}</em>
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: D.dim, flexShrink: 0, marginLeft: 8 }}>
                            {new Date(r.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 2, marginBottom: r.comentario ? 4 : 0 }}>
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={11} style={{ color: '#F59E0B', fill: s <= r.calificacion ? '#F59E0B' : 'none' }} />
                          ))}
                        </div>
                        {r.comentario && (
                          <p style={{ fontSize: 13, color: D.muted, margin: 0, lineHeight: 1.5 }}>{r.comentario}</p>
                        )}
                        {r.respuesta ? (
                          <div style={{ marginTop: 6, paddingLeft: 10, borderLeft: `2px solid ${D.primary}`, marginLeft: 2 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: D.primary, margin: '0 0 2px' }}>Tu respuesta:</p>
                            <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>{r.respuesta}</p>
                          </div>
                        ) : (
                          <>
                            {!replyState[r.id]?.open ? (
                              <button onClick={() => setReplyState(prev => ({ ...prev, [r.id]: { open: true, text: '', loading: false } }))}
                                style={{ marginTop: 6, fontSize: 11, color: D.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                                + Responder
                              </button>
                            ) : (
                              <div style={{ marginTop: 8 }}>
                                <textarea
                                  rows={2} maxLength={400}
                                  value={replyState[r.id]?.text || ''}
                                  onChange={e => setReplyState(prev => ({ ...prev, [r.id]: { ...prev[r.id], text: e.target.value } }))}
                                  placeholder="Escribe tu respuesta..."
                                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, resize: 'none', background: D.bg, border: `1px solid ${D.primary}`, color: D.text, fontSize: 12, outline: 'none', lineHeight: 1.5, boxSizing: 'border-box' }}
                                />
                                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                  <button
                                    onClick={() => submitRespuesta(r.id, replyState[r.id]?.text)}
                                    disabled={replyState[r.id]?.loading || !replyState[r.id]?.text?.trim()}
                                    style={{ padding: '5px 14px', borderRadius: 8, background: `linear-gradient(135deg,${D.primary},#0369a1)`, color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', opacity: replyState[r.id]?.loading ? 0.7 : 1 }}>
                                    {replyState[r.id]?.loading ? 'Enviando…' : 'Publicar'}
                                  </button>
                                  <button
                                    onClick={() => setReplyState(prev => ({ ...prev, [r.id]: { open: false, text: '', loading: false } }))}
                                    style={{ padding: '5px 10px', borderRadius: 8, background: D.surface, color: D.muted, fontSize: 12, border: `1px solid ${D.border}`, cursor: 'pointer' }}>
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default Estadisticas
