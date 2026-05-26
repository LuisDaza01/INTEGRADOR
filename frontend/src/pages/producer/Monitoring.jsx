"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  Thermometer, Eye, Waves, RefreshCw, AlertTriangle,
  Clock, Activity, TrendingUp, TrendingDown, Minus,
  Wifi, WifiOff, Fish, Bell, CheckCircle, Info, Sparkles
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

// ─── Configuración de rangos óptimos ───
const SENSOR_CONFIG = {
  temperatura: {
    label: "Temperatura", unit: "°C",
    min: 25, max: 34, optMin: 27, optMax: 32,
    icon: Thermometer,
    color: "#00F5FF", chartColor: "#00F5FF", // Neon Cyan
  },
  ph: {
    label: "pH", unit: "",
    min: 6.5, max: 8.5, optMin: 7.0, optMax: 7.8,
    icon: Waves,
    color: "#00FF88", chartColor: "#00FF88", // Neon Green
  },
  turbidez: {
    label: "Turbidez", unit: "NTU",
    min: 0, max: 50, optMin: 5, optMax: 30,
    icon: Eye,
    color: "#BF5AF2", chartColor: "#BF5AF2", // Neon Purple
  },
}

const TIME_RANGES = [
  { key: "1h",  label: "1 hora"   },
  { key: "24h", label: "24 horas" },
  { key: "7d",  label: "7 días"   },
  { key: "30d", label: "30 días"  },
]

const getRiskLevel = (sensorsData) => {
  if (!sensorsData) return { level: "unknown", label: "Sin datos", color: "gray" }
  const issues = []
  Object.entries(SENSOR_CONFIG).forEach(([key, cfg]) => {
    const val = parseFloat(sensorsData[key]?.raw ?? sensorsData[key]?.value ?? 0)
    if (val < cfg.min || val > cfg.max) issues.push({ key, severity: "critical" })
    else if (val < cfg.optMin || val > cfg.optMax) issues.push({ key, severity: "warning" })
  })
  if (issues.some(i => i.severity === "critical")) return { level: "critical", label: "CRÍTICO — Intervención urgente", color: "red",    score: 95 }
  if (issues.length >= 2)                           return { level: "high",     label: "ALTO — Revisar parámetros",     color: "orange",  score: 70 }
  if (issues.length === 1)                          return { level: "moderate", label: "MODERADO — Monitorear estanque", color: "yellow",  score: 35 }
  return { level: "low", label: "BAJO — Biomasa estable", color: "green", score: 8 }
}

const formatChartTime = (ts, range) => {
  const d = new Date(ts)
  if (range === "1h" || range === "24h") return d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("es-BO", { month: "short", day: "numeric" })
}

const generateSimulatedHistory = (currentValue, sensorKey, range) => {
  const now = Date.now()
  const ranges = { "1h": 3600000, "24h": 86400000, "7d": 604800000, "30d": 2592000000 }
  const points = { "1h": 24, "24h": 48, "7d": 56, "30d": 60 }
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

// ─── Componente SensorCard Glassmorphic ───
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

  const borderColor = !isConnected ? 'rgba(255,255,255,0.06)'
    : isOutOfRange ? 'rgba(239,68,68,0.3)'
    : isWarning    ? 'rgba(250,204,21,0.3)'
    : `${cfg.color}35`

  const activeColor = isOutOfRange ? '#f87171' : isWarning ? '#facc15' : '#00FF88'

  return (
    <div 
      className="np-hover glass relative overflow-hidden" 
      style={{ 
        border: `1.5px solid ${borderColor}`, 
        borderRadius: 16, 
        padding: 20, 
        transition: 'all 0.3s',
        boxShadow: `0 8px 32px rgba(0,0,0,0.3)`
      }}
    >
      {/* Línea superior neón del color del sensor */}
      <div className="absolute top-0 left-0 right-0 h-[2px] transition-opacity" style={{ background: cfg.color }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 10, borderRadius: 12, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
            <Icon size={18} style={{ color: cfg.color, filter: `drop-shadow(0 0 4px ${cfg.color})` }} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: D.muted, margin: 0, letterSpacing: '0.05em', fontFamily: "'Fira Code', monospace" }}>{cfg.label.toUpperCase()}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: isOutOfRange ? '#f87171' : '#f8fafc', fontFamily: "'Fira Code', monospace" }}>
                {isConnected ? (data?.value ?? "--") : "--"}
              </span>
              <span style={{ fontSize: 13, color: D.muted, fontFamily: "'Fira Sans', sans-serif" }}>{cfg.unit}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {isConnected ? (
            isOutOfRange ? <AlertTriangle size={18} style={{ color: '#f87171', filter: 'drop-shadow(0 0 6px #f87171)' }} className="animate-pulse" />
            : isWarning  ? <AlertTriangle size={18} style={{ color: '#facc15' }} />
            : <CheckCircle size={18} style={{ color: '#00FF88', filter: 'drop-shadow(0 0 4px #00FF88)' }} />
          ) : <WifiOff size={18} style={{ color: '#64748b' }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            {trend === "up"   ? <TrendingUp   size={14} style={{ color: '#00FF88' }} /> :
             trend === "down" ? <TrendingDown size={14} style={{ color: '#f87171' }} /> :
                                <Minus        size={14} style={{ color: '#64748b' }} />}
          </div>
        </div>
      </div>

      {/* Barra de rango glassmorphic */}
      <div style={{ marginTop: 12 }}>
        <div style={{ position: 'relative', height: 7, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', height: '100%', background: `${cfg.color}18`, borderRadius: 4, left: `${optPctMin}%`, width: `${optPctMax - optPctMin}%` }} />
          {isConnected && (
            <div 
              style={{ 
                position: 'absolute', height: '100%', width: 5, borderRadius: 3, 
                transition: 'left 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)', 
                left: `${Math.min(96, pct)}%`, background: cfg.color,
                boxShadow: `0 0 8px ${cfg.color}` 
              }} 
            />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: D.muted, marginTop: 6, fontFamily: "'Fira Code', monospace" }}>
          <span>{cfg.min}{cfg.unit}</span>
          <span style={{ color: activeColor }}>Óptimo: {cfg.optMin}–{cfg.optMax}{cfg.unit}</span>
          <span>{cfg.max}{cfg.unit}</span>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, fontFamily: "'Fira Code', monospace" }}>
        {!isConnected ? <span style={{ color: '#64748b' }}>SENSORES FUERA DE LINEA</span>
        : isOutOfRange ? <span style={{ color: '#f87171' }}>🚨 BIO-ALARMA CRÍTICA</span>
        : isWarning    ? <span style={{ color: '#facc15' }}>⚡ RANGO NO ÓPTIMO</span>
        : <span style={{ color: '#00FF88' }}>✓ ESTADO SALUDABLE</span>}
      </div>
    </div>
  )
}

// ─── Tooltip personalizado de Recharts ───
const CustomTooltip = ({ active, payload, label, sensorKey }) => {
  const cfg = SENSOR_CONFIG[sensorKey]
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  const isOut = val < cfg.min || val > cfg.max
  return (
    <div 
      className="glass-strong"
      style={{ 
        border: `1.5px solid ${cfg.color}35`, 
        borderRadius: 12, 
        boxShadow: `0 10px 30px rgba(0,0,0,0.5)`, 
        padding: '10px 14px', 
        fontSize: 12.5,
        fontFamily: "'Fira Code', monospace" 
      }}
    >
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>{new Date(label).toLocaleString("es-BO")}</p>
      <p style={{ fontWeight: 700, color: isOut ? "#ef4444" : cfg.color, margin: 0, fontSize: 14 }}>
        {val?.toFixed(2)} {cfg.unit}
      </p>
      {isOut && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>🚨 ALERTA FUERA DE RANGO</p>}
    </div>
  )
}

// ─── Gráfico individual ───
const SensorChart = ({ sensorKey, data, timeRange }) => {
  const { D } = useTheme()
  const cfg = SENSOR_CONFIG[sensorKey]

  if (!data || data.length === 0) {
    return (
      <div className="glass" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14 }}>
        <p style={{ color: D.muted, fontSize: 13.5, fontFamily: "'Fira Code', monospace" }}>SIN REGISTROS HOLOGRÁFICOS</p>
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
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${sensorKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={cfg.chartColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={cfg.chartColor} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={ts => formatChartTime(ts, timeRange)}
          tick={{ fontSize: 9.5, fill: 'rgba(255,255,255,0.4)', fontFamily: "'Fira Code', monospace" }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[cfg.min * 0.95, cfg.max * 1.05]}
          tick={{ fontSize: 9.5, fill: 'rgba(255,255,255,0.4)', fontFamily: "'Fira Code', monospace" }}
        />
        <Tooltip content={<CustomTooltip sensorKey={sensorKey} />} />
        <ReferenceLine y={cfg.optMin} stroke="#00FF88" strokeDasharray="3 3" strokeWidth={1} strokeOpacity={0.4} />
        <ReferenceLine y={cfg.optMax} stroke="#00FF88" strokeDasharray="3 3" strokeWidth={1} strokeOpacity={0.4} />
        <Area
          type="monotone" dataKey="value"
          stroke={cfg.chartColor} strokeWidth={2.5}
          fill={`url(#grad-${sensorKey})`}
          dot={false}
          activeDot={{ r: 5.5, fill: cfg.chartColor, stroke: `${cfg.chartColor}44`, strokeWidth: 4 }}
          style={{ filter: `drop-shadow(0 0 5px ${cfg.chartColor}aa)` }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Indicador de riesgo Glassmorphic ───
const RISK_COLORS = {
  green:  { border: 'rgba(0,255,136,0.2)', text: '#00FF88', bar: '#00FF88', noteBg: 'rgba(0,255,136,0.05)',   noteBorder: 'rgba(0,255,136,0.15)'   },
  yellow: { border: 'rgba(250,204,21,0.2)', text: '#facc15', bar: '#facc15', noteBg: 'rgba(250,204,21,0.05)',   noteBorder: 'rgba(250,204,21,0.15)'   },
  orange: { border: 'rgba(251,146,60,0.2)', text: '#fb923c', bar: '#fb923c', noteBg: 'rgba(251,146,60,0.05)',   noteBorder: 'rgba(251,146,60,0.15)'   },
  red:    { border: 'rgba(239,68,68,0.2)', text: '#f87171', bar: '#f87171', noteBg: 'rgba(239,68,68,0.05)',  noteBorder: 'rgba(239,68,68,0.15)'  },
  gray:   { border: 'rgba(255,255,255,0.08)', text: '#94a3b8', bar: '#94a3b8', noteBg: 'rgba(255,255,255,0.02)', noteBorder: 'rgba(255,255,255,0.05)'  },
}

const RiskIndicator = ({ sensorsData, isConnected }) => {
  const { D } = useTheme()
  const risk = isConnected ? getRiskLevel(sensorsData) : { level: "unknown", label: "MODO DESCONECTADO", color: "gray", score: 0 }
  const c = RISK_COLORS[risk.color] || RISK_COLORS.gray

  return (
    <div className="glass relative overflow-hidden" style={{ border: `1.5px solid ${c.border}`, borderRadius: 16, padding: 20 }}>
      {/* Línea shimmer superior neón */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: c.bar }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Activity size={18} style={{ color: c.text, filter: `drop-shadow(0 0 3px ${c.text})` }} />
        <h3 style={{ fontWeight: 700, color: c.text, margin: 0, fontSize: 13.5, fontFamily: "'Fira Code', monospace", letterSpacing: '0.05em' }}>INDICADOR DE RIESGO DE MORTALIDAD</h3>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: D.muted, marginBottom: 5, fontFamily: "'Fira Code', monospace" }}>
          <span>BAJO</span><span>CRÍTICO</span>
        </div>
        <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${risk.score ?? 0}%`, background: c.bar, borderRadius: 5, transition: 'width 1.2s cubic-bezier(0.25, 0.8, 0.25, 1)', boxShadow: `0 0 8px ${c.bar}` }} />
        </div>
      </div>

      <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: '0 0 4px', fontFamily: "'Fira Code', monospace" }}>{risk.label}</p>
      <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>Análisis cuántico multivariante basado en pH, turbidez y temperatura</p>

      {risk.level === "critical" && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: c.noteBg, border: `1.5px solid ${c.noteBorder}`, borderRadius: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: c.text, margin: 0 }}>🚨 ALERTA ROJA: Se requiere intervención de aireación inmediata en el estanque.</p>
        </div>
      )}
      {risk.level === "high" && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: c.noteBg, border: `1.5px solid ${c.noteBorder}`, borderRadius: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: c.text, margin: 0 }}>⚡ ATENCIÓN: Múltiples biosensores reportan valores fuera de tolerancia.</p>
        </div>
      )}
    </div>
  )
}

// ─── Componente Principal Monitoring ───
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }} className="text-slate-100">

      {/* Encabezado */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: D.text, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Fira Code', monospace" }}>
            <Fish size={22} className="text-cyan-400" />
            Monitoreo IoT — {TAMBAQUI_INFO?.nombreComun || "Tambaqui"}
          </h2>
          <p style={{ fontSize: 13, color: D.muted, margin: 0, fontFamily: "'Fira Sans', sans-serif" }}>
            {isConnected
              ? `Estación de enlace en línea · Sincronizado ${lastUpdated.toLocaleTimeString("es-BO")}`
              : "Buscando enlace telemétrico..."}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div 
            className="border border-cyan-500/20 bg-cyan-950/20"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              color: isConnected ? '#00FF88' : '#f87171',
              fontFamily: "'Fira Code', monospace",
            }}
          >
            {isConnected ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}
            {isConnected ? "EN LÍNEA" : "DESCONECTADO"}
          </div>
          <button
            onClick={() => { refreshData(); loadHistory(timeRange) }}
            className="glass transition hover:bg-white/5 active:scale-95"
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, 
              padding: '6px 12px', border: `1px solid rgba(255,255,255,0.08)`, 
              borderRadius: 10, color: D.text, fontSize: 13, cursor: 'pointer',
              fontFamily: "'Fira Code', monospace"
            }}
          >
            <RefreshCw size={13} className={loadingHistory ? "animate-spin" : ""} />
            REFRESCAR
          </button>
        </div>
      </div>

      {/* Alertas activas */}
      {alerts?.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Bell size={18} style={{ color: '#f87171' }} className="animate-bounce" />
            <h3 style={{ fontWeight: 700, color: '#f87171', margin: 0, fontSize: 14, fontFamily: "'Fira Code', monospace" }}>
              {alerts.length} ALERTA{alerts.length > 1 ? "S" : ""} DE BIOSISTEMA ACTIVA{alerts.length > 1 ? "S" : ""}
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {alerts.slice(0, 3).map((alert, i) => (
              <p key={i} style={{ fontSize: 13, color: '#fca5a5', margin: 0 }}>• {alert.message || alert}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── HUD Telemetría Glassmorphism panel ── */}
      <div className="np-hud-frame glass relative overflow-hidden" style={{
        borderRadius: 20, padding: '24px 20px',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Línea superior neón */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Rejilla de fondo HUD */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px)',
          borderRadius: 20,
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div className="np-pulse-ring" style={{ '--pulse-color': '#00F5FF' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00F5FF', boxShadow: '0 0 8px #00F5FF' }} />
            </div>
            <span style={{ fontSize: 11, fontFamily: "'Fira Code', monospace", fontWeight: 700, color: '#00F5FF', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              HUD TELEMETRÍA CUÁNTICA EN VIVO
            </span>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto', fontFamily: "'Fira Code', monospace" }}>
              {isConnected ? '● MONITOREO HABILITADO' : '○ ENLACE CAÍDO'}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 28 }}>
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
                  size={152}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Tarjetas de sensores */}
      <div>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, fontFamily: "'Fira Code', monospace" }}>
          DETALLE · VALORES EN TIEMPO REAL
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          {Object.keys(SENSOR_CONFIG).map(key => (
            <SensorCard key={key} sensorKey={key} data={sensorsData?.[key]} isConnected={isConnected} />
          ))}
        </div>
      </div>

      {/* Indicador de riesgo */}
      <RiskIndicator sensorsData={sensorsData} isConnected={isConnected} />

      {/* Selector de rango */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, fontFamily: "'Fira Code', monospace" }}>
          HISTORIAL DE PARÁMETROS
        </h3>
        
        {/* Selector glass */}
        <div className="glass" style={{ display: 'flex', borderRadius: 10, padding: 3, gap: 2 }}>
          {TIME_RANGES.map(r => (
            <button key={r.key} onClick={() => setTimeRange(r.key)}
              className="transition hover:text-white"
              style={{
                padding: '6px 12px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: timeRange === r.key ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: timeRange === r.key ? '#00F5FF' : D.muted,
                fontFamily: "'Fira Code', monospace"
              }}>
              {r.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Gráficos históricos */}
      {loadingHistory ? (
        <div className="glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: D.muted }}>
            <RefreshCw size={16} className="animate-spin" />
            <span style={{ fontSize: 13.5, fontFamily: "'Fira Code', monospace" }}>CARGANDO HISTORIAL DE DATOS...</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(SENSOR_CONFIG).map(([key, cfg]) => (
            <div key={key} className="np-hover glass relative overflow-hidden" style={{ borderRadius: 16, padding: 20 }}>
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: cfg.color }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <cfg.icon size={16} style={{ color: cfg.color }} />
                  <h4 style={{ fontWeight: 700, color: D.text, margin: 0, fontSize: 14, fontFamily: "'Fira Code', monospace" }}>{cfg.label.toUpperCase()}</h4>
                  <span style={{ fontSize: 11.5, color: D.muted, fontFamily: "'Fira Sans', sans-serif" }}>
                    — últimas {TIME_RANGES.find(r => r.key === timeRange)?.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: D.muted, fontFamily: "'Fira Code', monospace" }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 0, borderTop: '2px dashed #00FF88' }} /> Rango óptimo
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 2, background: cfg.color }} /> Medición
                  </span>
                </div>
              </div>
              <SensorChart sensorKey={key} data={currentHistory} timeRange={timeRange} />
              <p style={{ fontSize: 10.5, color: D.dim, marginTop: 8, textAlign: 'right', fontFamily: "'Fira Code', monospace" }}>
                {!historicalData[timeRange] || historicalData[timeRange].length === 0
                  ? "* Datos simulados de biomasa"
                  : `${currentHistory.length} registros encriptados`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Historial de alertas */}
      {alertHistory.length > 0 && (
        <div className="np-hover glass" style={{ borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontWeight: 700, color: D.text, margin: '0 0 12px', fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Fira Code', monospace" }}>
            <Clock size={16} style={{ color: D.muted }} />
            HISTORIAL DE ALERTAS CUÁNTICAS RECIENTES
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertHistory.map((alert, i) => (
              <div key={i} className="glass" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 10, fontSize: 13 }}>
                <AlertTriangle size={14} style={{ color: '#facc15', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ color: D.text, margin: '0 0 2px' }}>{alert.message || JSON.stringify(alert)}</p>
                  <p style={{ fontSize: 11, color: D.muted, margin: 0, fontFamily: "'Fira Code', monospace" }}>{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IA Predictiva */}
      <div>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, fontFamily: "'Fira Code', monospace" }}>
          PREDICCIÓN DE RIESGO — MÓDULO IA
        </h3>
        <PrediccionRiesgo sensorsData={sensorsData} historicalData={currentHistory} isConnected={isConnected} />
      </div>

      {/* Info de especie */}
      <div 
        className="glass relative overflow-hidden"
        style={{ 
          border: `1px solid rgba(0,245,255,0.2)`, 
          borderRadius: 16, 
          padding: 20 
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-500" />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ padding: 8, background: 'rgba(0,245,255,0.12)', borderRadius: 10 }}>
            <Info size={18} style={{ color: '#00F5FF', filter: 'drop-shadow(0 0 3px #00F5FF)' }} />
          </div>
          <div className="w-full">
            <h4 style={{ fontWeight: 700, color: D.text, margin: '0 0 12px', fontSize: 14, fontFamily: "'Fira Code', monospace" }}>
              {TAMBAQUI_INFO?.nombreComun || "Tambaqui"} — PARÁMETROS ÓPTIMOS DE CULTIVO
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, fontSize: 13 }}>
              {Object.entries(SENSOR_CONFIG).map(([key, cfg]) => (
                <div key={key} className="glass" style={{ padding: 12, borderRadius: 10 }}>
                  <p style={{ fontSize: 10.5, color: D.muted, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px', fontFamily: "'Fira Code', monospace" }}>{cfg.label}</p>
                  <p style={{ color: '#00F5FF', fontWeight: 700, margin: '0 0 3px', fontSize: 14, fontFamily: "'Fira Code', monospace" }}>{cfg.optMin}–{cfg.optMax} {cfg.unit}</p>
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
