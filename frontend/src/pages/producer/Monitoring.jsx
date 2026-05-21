"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  Thermometer, Eye, Waves, RefreshCw, AlertTriangle,
  Clock, Activity, TrendingUp, TrendingDown, Minus,
  Wifi, WifiOff, Fish, Bell, CheckCircle, Info,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import { useSensorData, TAMBAQUI_INFO } from "../../api/services/sensor.service"
import PrediccionRiesgo from "./PrediccionRiesgo"
import { getHistoricalData } from "../../api/config/firebase"
import { useTheme } from "../../contexts/ThemeContext"
import HUDGauge from "../../components/effects/HUDGauge"
import ParticleBackground from "../../components/effects/ParticleBackground"

// ─── Configuración de rangos óptimos ────────────────────────────────────────
const SENSOR_CONFIG = {
  temperatura: {
    label: "Temperatura", unit: "°C",
    min: 25, max: 34, optMin: 27, optMax: 32,
    icon: Thermometer,
    color: "#ef4444", chartColor: "#ef4444",
  },
  ph: {
    label: "pH", unit: "",
    min: 6.5, max: 8.5, optMin: 7.0, optMax: 7.8,
    icon: Waves,
    color: "#3b82f6", chartColor: "#3b82f6",
  },
  turbidez: {
    label: "Turbidez", unit: "NTU",
    min: 0, max: 50, optMin: 5, optMax: 30,
    icon: Eye,
    color: "#8b5cf6", chartColor: "#8b5cf6",
  },
}

const TIME_RANGES = [
  { key: "1h",  label: "1 hora"   },
  { key: "24h", label: "24 horas" },
  { key: "7d",  label: "7 días"   },
  { key: "30d", label: "30 días"  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getRiskLevel = (sensorsData) => {
  if (!sensorsData) return { level: "unknown", label: "Sin datos", color: "gray" }
  const issues = []
  Object.entries(SENSOR_CONFIG).forEach(([key, cfg]) => {
    const val = parseFloat(sensorsData[key]?.raw ?? sensorsData[key]?.value ?? 0)
    if (val < cfg.min || val > cfg.max) issues.push({ key, severity: "critical" })
    else if (val < cfg.optMin || val > cfg.optMax) issues.push({ key, severity: "warning" })
  })
  if (issues.some(i => i.severity === "critical")) return { level: "critical", label: "Crítico — Intervención urgente", color: "red",    score: 95 }
  if (issues.length >= 2)                           return { level: "high",     label: "Alto — Revisar parámetros",     color: "orange",  score: 70 }
  if (issues.length === 1)                          return { level: "moderate", label: "Moderado — Monitorear",         color: "yellow",  score: 35 }
  return { level: "low", label: "Bajo — Sistema estable", color: "green", score: 5 }
}

const formatChartTime = (ts, range) => {
  const d = new Date(ts)
  if (range === "1h" || range === "24h") return d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("es-BO", { month: "short", day: "numeric" })
}

const generateSimulatedHistory = (currentValue, sensorKey, range) => {
  const now = Date.now()
  const ranges = { "1h": 3600000, "24h": 86400000, "7d": 604800000, "30d": 2592000000 }
  const points = { "1h": 20, "24h": 48, "7d": 56, "30d": 60 }
  const duration = ranges[range] || ranges["24h"]
  const count    = points[range]  || 48
  const cfg = SENSOR_CONFIG[sensorKey]
  const base = currentValue || ((cfg.min + cfg.max) / 2)
  return Array.from({ length: count }, (_, i) => {
    const ts    = now - duration + (i * duration / count)
    const noise = (Math.random() - 0.5) * (cfg.max - cfg.min) * 0.15
    const trend = Math.sin(i / count * Math.PI * 2) * (cfg.max - cfg.min) * 0.05
    const value = Math.max(cfg.min * 0.9, Math.min(cfg.max * 1.1, base + noise + trend))
    return { timestamp: ts, [sensorKey]: parseFloat(value.toFixed(2)) }
  })
}

// ─── Componente SensorCard ────────────────────────────────────────────────────
const SensorCard = ({ sensorKey, data, isConnected }) => {
  const { D } = useTheme()
  const cfg = SENSOR_CONFIG[sensorKey]
  const Icon = cfg.icon
  const value = parseFloat(data?.value ?? 0)
  const isOutOfRange = data?.isOutOfRange
  const isWarning = !isOutOfRange && (value < cfg.optMin || value > cfg.optMax)
  const trend = data?.trend

  const pct      = Math.min(100, Math.max(0, ((value - cfg.min) / (cfg.max - cfg.min)) * 100))
  const optPctMin = ((cfg.optMin - cfg.min) / (cfg.max - cfg.min)) * 100
  const optPctMax = ((cfg.optMax - cfg.min) / (cfg.max - cfg.min)) * 100

  const borderColor = !isConnected ? D.border
    : isOutOfRange ? '#f87171'
    : isWarning    ? '#facc15'
    : '#4ade80'

  return (
    <div className="np-hover" style={{ background: D.card, border: `2px solid ${borderColor}`, borderRadius: 12, padding: 20, transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 10, borderRadius: 10, background: `${cfg.color}22` }}>
            <Icon size={20} style={{ color: cfg.color }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: D.muted, margin: 0 }}>{cfg.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: isOutOfRange ? '#f87171' : D.text }}>
                {isConnected ? (data?.value ?? "--") : "--"}
              </span>
              <span style={{ fontSize: 13, color: D.muted }}>{cfg.unit}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {isConnected ? (
            isOutOfRange ? <AlertTriangle size={20} style={{ color: '#f87171', animation: 'pulse 2s infinite' }} />
            : isWarning  ? <AlertTriangle size={20} style={{ color: '#facc15' }} />
            : <CheckCircle size={20} style={{ color: '#4ade80' }} />
          ) : <WifiOff size={20} style={{ color: D.dim }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {trend === "up"   ? <TrendingUp   size={12} style={{ color: '#4ade80' }} /> :
             trend === "down" ? <TrendingDown size={12} style={{ color: '#f87171' }} /> :
                                <Minus        size={12} style={{ color: D.dim      }} />}
          </div>
        </div>
      </div>

      {/* Barra de rango */}
      <div style={{ marginTop: 12 }}>
        <div style={{ position: 'relative', height: 10, background: D.border, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', height: '100%', background: 'rgba(74,222,128,0.35)', borderRadius: 5, left: `${optPctMin}%`, width: `${optPctMax - optPctMin}%` }} />
          {isConnected && (
            <div style={{ position: 'absolute', height: '100%', width: 5, borderRadius: 3, transition: 'left 0.5s', left: `${Math.min(96, pct)}%`, background: cfg.color }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: D.muted, marginTop: 4 }}>
          <span>{cfg.min}{cfg.unit}</span>
          <span style={{ color: '#4ade80' }}>Óptimo: {cfg.optMin}–{cfg.optMax}{cfg.unit}</span>
          <span>{cfg.max}{cfg.unit}</span>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>
        {!isConnected ? <span style={{ color: D.dim }}>Sin conexión</span>
        : isOutOfRange ? <span style={{ color: '#f87171' }}>⚠ Fuera del rango seguro</span>
        : isWarning    ? <span style={{ color: '#facc15' }}>⚡ Fuera del rango óptimo</span>
        : <span style={{ color: '#4ade80' }}>✓ Valor óptimo</span>}
      </div>
    </div>
  )
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, sensorKey }) => {
  const { D } = useTheme()
  if (!active || !payload?.length) return null
  const cfg = SENSOR_CONFIG[sensorKey]
  const val = payload[0]?.value
  const isOut = val < cfg.min || val > cfg.max
  return (
    <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', padding: '8px 12px', fontSize: 13 }}>
      <p style={{ color: D.muted, marginBottom: 4 }}>{new Date(label).toLocaleString("es-BO")}</p>
      <p style={{ fontWeight: 700, color: isOut ? "#ef4444" : cfg.color, margin: 0 }}>
        {val?.toFixed(2)} {cfg.unit}
      </p>
      {isOut && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>⚠ Fuera de rango</p>}
    </div>
  )
}

// ─── Gráfico individual ───────────────────────────────────────────────────────
const SensorChart = ({ sensorKey, data, timeRange }) => {
  const { D } = useTheme()
  const cfg = SENSOR_CONFIG[sensorKey]

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 192, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.surface, borderRadius: 10, border: `1px dashed ${D.border}` }}>
        <p style={{ color: D.muted, fontSize: 14 }}>Sin datos históricos para este rango</p>
      </div>
    )
  }

  const chartData = data.map(d => ({
    ...d,
    timestamp: d.timestamp,
    value: parseFloat(d[sensorKey]?.toFixed(2)),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${sensorKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={cfg.chartColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={cfg.chartColor} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={D.border} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={ts => formatChartTime(ts, timeRange)}
          tick={{ fontSize: 10, fill: D.muted }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[cfg.min * 0.95, cfg.max * 1.05]}
          tick={{ fontSize: 10, fill: D.muted }}
        />
        <Tooltip content={<CustomTooltip sensorKey={sensorKey} />} />
        <ReferenceLine y={cfg.optMin} stroke="#4ade80" strokeDasharray="4 4" strokeWidth={1}
          label={{ value: `Min óptimo`, position: "left", fontSize: 9, fill: "#4ade80" }} />
        <ReferenceLine y={cfg.optMax} stroke="#4ade80" strokeDasharray="4 4" strokeWidth={1}
          label={{ value: `Max óptimo`, position: "left", fontSize: 9, fill: "#4ade80" }} />
        <Area
          type="monotone" dataKey="value"
          stroke={cfg.chartColor} strokeWidth={2.5}
          fill={`url(#grad-${sensorKey})`}
          dot={false}
          activeDot={{ r: 5, fill: cfg.chartColor, stroke: `${cfg.chartColor}66`, strokeWidth: 4 }}
          style={{ filter: `drop-shadow(0 0 4px ${cfg.chartColor}88)` }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Indicador de riesgo ──────────────────────────────────────────────────────
const RISK_COLORS = {
  green:  { border: '#4ade80', text: '#4ade80', bar: '#4ade80', noteBg: 'rgba(74,222,128,0.1)',   noteBorder: 'rgba(74,222,128,0.3)'   },
  yellow: { border: '#facc15', text: '#facc15', bar: '#facc15', noteBg: 'rgba(250,204,21,0.1)',   noteBorder: 'rgba(250,204,21,0.3)'   },
  orange: { border: '#fb923c', text: '#fb923c', bar: '#fb923c', noteBg: 'rgba(251,146,60,0.1)',   noteBorder: 'rgba(251,146,60,0.3)'   },
  red:    { border: '#f87171', text: '#f87171', bar: '#f87171', noteBg: 'rgba(248,113,113,0.1)',  noteBorder: 'rgba(248,113,113,0.3)'  },
  gray:   { border: '#64748b', text: '#94a3b8', bar: '#94a3b8', noteBg: 'rgba(100,116,139,0.1)', noteBorder: 'rgba(100,116,139,0.3)'  },
}

const RiskIndicator = ({ sensorsData, isConnected }) => {
  const { D } = useTheme()
  const risk = isConnected ? getRiskLevel(sensorsData) : { level: "unknown", label: "Sin conexión", color: "gray", score: 0 }
  const c = RISK_COLORS[risk.color] || RISK_COLORS.gray

  return (
    <div style={{ background: D.card, border: `2px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Activity size={20} style={{ color: c.text }} />
        <h3 style={{ fontWeight: 700, color: c.text, margin: 0, fontSize: 15 }}>Indicador de Riesgo IoT</h3>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: D.muted, marginBottom: 4 }}>
          <span>Bajo</span><span>Crítico</span>
        </div>
        <div style={{ height: 14, background: D.border, borderRadius: 7, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${risk.score ?? 0}%`, background: c.bar, borderRadius: 7, transition: 'width 1s' }} />
        </div>
      </div>

      <p style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: '0 0 4px' }}>{risk.label}</p>
      <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>Basado en los 3 parámetros monitoreados en tiempo real</p>

      {risk.level === "critical" && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: c.noteBg, border: `1px solid ${c.noteBorder}`, borderRadius: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: c.text, margin: 0 }}>🚨 Acción inmediata requerida. Revisa los sensores en campo.</p>
        </div>
      )}
      {risk.level === "high" && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: c.noteBg, border: `1px solid ${c.noteBorder}`, borderRadius: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: c.text, margin: 0 }}>⚡ Múltiples parámetros fuera del rango óptimo.</p>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal Monitoring ─────────────────────────────────────────
const Monitoring = () => {
  const { D } = useTheme()
  const { data: sensorsData, isConnected, alerts, refreshData } = useSensorData()
  const [timeRange, setTimeRange] = useState("24h")
  const [historicalData, setHistoricalData] = useState({})
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [alertHistory, setAlertHistory] = useState([])
  const currentRef = useRef(sensorsData)

  useEffect(() => { currentRef.current = sensorsData }, [sensorsData])

  const loadHistory = useCallback(async (range) => {
    setLoadingHistory(true)
    try {
      const raw = await getHistoricalData(range)
      if (raw && raw.length > 0) {
        setHistoricalData(prev => ({ ...prev, [range]: raw }))
      } else {
        const current = currentRef.current
        const merged = Object.keys(SENSOR_CONFIG).reduce((acc, key) => {
          const pts = generateSimulatedHistory(
            parseFloat(current?.[key]?.raw ?? current?.[key]?.value ?? 0), key, range
          )
          pts.forEach((p, i) => {
            if (!acc[i]) acc[i] = { timestamp: p.timestamp }
            acc[i][key] = p[key]
          })
          return acc
        }, [])
        setHistoricalData(prev => ({ ...prev, [range]: merged }))
      }
    } catch (e) {
      console.error("Error cargando historial:", e)
    } finally {
      setLoadingHistory(false)
      setLastUpdated(new Date())
    }
  }, [])

  useEffect(() => { loadHistory(timeRange) }, [timeRange, loadHistory])

  useEffect(() => {
    if (alerts?.length > 0) {
      setAlertHistory(prev => [
        ...alerts.map(a => ({ ...a, time: new Date().toLocaleTimeString("es-BO") })),
        ...prev,
      ].slice(0, 10))
    }
  }, [alerts])

  const currentHistory = historicalData[timeRange] || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: D.text, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Fish size={22} style={{ color: D.primary }} />
            Monitoreo IoT — {TAMBAQUI_INFO?.nombreComun || "Tambaqui"}
          </h2>
          <p style={{ fontSize: 13, color: D.muted, margin: 0 }}>
            {isConnected
              ? `Conectado · Actualizado ${lastUpdated.toLocaleTimeString("es-BO")}`
              : "Sin conexión con Firebase"}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: isConnected ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
            color: isConnected ? '#4ade80' : '#f87171',
          }}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isConnected ? "En línea" : "Desconectado"}
          </div>
          <button
            onClick={() => { refreshData(); loadHistory(timeRange) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, fontSize: 13, cursor: 'pointer' }}>
            <RefreshCw size={14} style={{ animation: loadingHistory ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Alertas activas */}
      {alerts?.length > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Bell size={18} style={{ color: '#f87171' }} />
            <h3 style={{ fontWeight: 700, color: '#f87171', margin: 0, fontSize: 14 }}>
              {alerts.length} alerta{alerts.length > 1 ? "s" : ""} activa{alerts.length > 1 ? "s" : ""}
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {alerts.slice(0, 3).map((alert, i) => (
              <p key={i} style={{ fontSize: 13, color: '#f87171', margin: 0 }}>• {alert.message || alert}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── HUD Gauges panel ── */}
      <div className="np-hud-frame" style={{
        background: 'rgba(17,30,51,0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(34,197,94,0.18)',
        borderRadius: 16, padding: '24px 20px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Scanline subtle overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.03) 3px,rgba(0,0,0,0.03) 4px)',
          borderRadius: 16,
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div className="np-pulse-ring" style={{ '--pulse-color': '#22C55E' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
            </div>
            <span style={{ fontSize: 11, fontFamily: "'Fira Code', monospace", fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              HUD · Parámetros en vivo
            </span>
            <span style={{ fontSize: 11, color: D.muted, marginLeft: 'auto', fontFamily: "'Fira Code', monospace" }}>
              {isConnected ? '● LIVE' : '○ OFFLINE'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24 }}>
            {Object.entries(SENSOR_CONFIG).map(([key, cfg]) => {
              const val = parseFloat(sensorsData?.[key]?.value ?? sensorsData?.[key]?.raw ?? ((cfg.min + cfg.max) / 2))
              return (
                <HUDGauge
                  key={key}
                  value={isConnected ? val : 0}
                  min={cfg.min} max={cfg.max}
                  optMin={cfg.optMin} optMax={cfg.optMax}
                  label={cfg.label} unit={cfg.unit}
                  color={cfg.color}
                  size={150}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Tarjetas de sensores */}
      <div>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Detalle · Valores en tiempo real
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
          {Object.keys(SENSOR_CONFIG).map(key => (
            <SensorCard key={key} sensorKey={key} data={sensorsData?.[key]} isConnected={isConnected} />
          ))}
        </div>
      </div>

      {/* Indicador de riesgo */}
      <RiskIndicator sensorsData={sensorsData} isConnected={isConnected} />

      {/* Selector de rango */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
          Historial de parámetros
        </h3>
        <div style={{ display: 'flex', background: D.surface, borderRadius: 8, padding: 4, gap: 2 }}>
          {TIME_RANGES.map(r => (
            <button key={r.key} onClick={() => setTimeRange(r.key)}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                background: timeRange === r.key ? D.card : 'transparent',
                color: timeRange === r.key ? D.text : D.muted,
                boxShadow: timeRange === r.key ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráficos históricos */}
      {loadingHistory ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 192, background: D.surface, borderRadius: 12, border: `1px dashed ${D.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: D.muted }}>
            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14 }}>Cargando historial...</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(SENSOR_CONFIG).map(([key, cfg]) => (
            <div key={key} className="np-hover" style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <cfg.icon size={18} style={{ color: cfg.color }} />
                  <h4 style={{ fontWeight: 700, color: D.text, margin: 0, fontSize: 15 }}>{cfg.label}</h4>
                  <span style={{ fontSize: 12, color: D.muted }}>
                    — últimas {TIME_RANGES.find(r => r.key === timeRange)?.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: D.muted }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 0, borderTop: '2px dashed #4ade80' }} /> Rango óptimo
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 2, background: cfg.color }} /> Medición
                  </span>
                </div>
              </div>
              <SensorChart sensorKey={key} data={currentHistory} timeRange={timeRange} />
              <p style={{ fontSize: 11, color: D.dim, marginTop: 8, textAlign: 'right' }}>
                {!historicalData[timeRange] || historicalData[timeRange].length === 0
                  ? "* Datos simulados (sin historial en Firebase)"
                  : `${currentHistory.length} registros`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Historial de alertas */}
      {alertHistory.length > 0 && (
        <div className="np-hover" style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontWeight: 700, color: D.text, margin: '0 0 12px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} style={{ color: D.muted }} />
            Historial de alertas recientes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertHistory.map((alert, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, background: D.surface, borderRadius: 8, fontSize: 13 }}>
                <AlertTriangle size={14} style={{ color: '#facc15', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ color: D.text, margin: '0 0 2px' }}>{alert.message || JSON.stringify(alert)}</p>
                  <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IA Predictiva */}
      <div>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Predicción de riesgo — Módulo IA
        </h3>
        <PrediccionRiesgo sensorsData={sensorsData} historicalData={currentHistory} isConnected={isConnected} />
      </div>

      {/* Info de especie */}
      <div style={{ background: `linear-gradient(135deg,rgba(6,182,212,0.08),rgba(56,189,248,0.06))`, border: `1px solid rgba(6,182,212,0.3)`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ padding: 8, background: 'rgba(6,182,212,0.15)', borderRadius: 8 }}>
            <Info size={18} style={{ color: '#06b6d4' }} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, color: D.text, margin: '0 0 8px', fontSize: 14 }}>
              {TAMBAQUI_INFO?.nombreComun || "Tambaqui"} — Parámetros óptimos de cultivo
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, fontSize: 13 }}>
              {Object.entries(SENSOR_CONFIG).map(([key, cfg]) => (
                <div key={key}>
                  <p style={{ fontSize: 11, color: D.muted, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 2px' }}>{cfg.label}</p>
                  <p style={{ color: '#06b6d4', fontWeight: 700, margin: '0 0 2px' }}>{cfg.optMin}–{cfg.optMax} {cfg.unit}</p>
                  <p style={{ fontSize: 11, color: D.dim, margin: 0 }}>Rango seguro: {cfg.min}–{cfg.max} {cfg.unit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Monitoring
