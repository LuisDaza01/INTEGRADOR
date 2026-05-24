// ============================================================
// PrediccionRiesgo.jsx
// Módulo de IA predictiva de riesgo de mortalidad — NaturaPiscis
//
// Algoritmo: Modelo de scoring ponderado multivariable
//   1. Detecta tendencia de cada parámetro (regresión lineal simple)
//   2. Extrapola el valor a +2h y +4h
//   3. Calcula score de riesgo con pesos por criticidad
//   4. Emite alerta y recomendaciones accionables
//
// Parámetros monitoreados:
//   - Temperatura  (peso 40%) — principal causa de mortalidad
//   - pH           (peso 35%) — afecta absorción de oxígeno
//   - Turbidez     (peso 25%) — indicador de calidad del agua
// ============================================================

import { useState, useEffect, useMemo } from "react"
import {
  Brain, AlertTriangle, CheckCircle, TrendingUp,
  TrendingDown, Minus, Clock, Fish, Thermometer,
  Waves, Eye, Info, Zap, Shield, Activity,
} from "lucide-react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine,
} from "recharts"
import { useTheme } from "../../contexts/ThemeContext"

// ─── Configuración del modelo ─────────────────────────────────────────────────
const MODEL_CONFIG = {
  temperatura: {
    label: "Temperatura",
    unit: "°C",
    weight: 0.40,
    min: 25, max: 34,
    optMin: 27, optMax: 32,
    criticalDeltaPerHour: 2.0,
    icon: Thermometer,
    color: "#ef4444",
    riskFn: (val) => {
      if (val > 36 || val < 23) return 100
      if (val > 34 || val < 25) return 80
      if (val > 33 || val < 26) return 50
      if (val > 32 || val < 27) return 25
      return 0
    },
  },
  ph: {
    label: "pH",
    unit: "",
    weight: 0.35,
    min: 6.0, max: 9.0,
    optMin: 7.0, optMax: 7.8,
    criticalDeltaPerHour: 0.5,
    icon: Waves,
    color: "#3b82f6",
    riskFn: (val) => {
      if (val > 9.5 || val < 5.5) return 100
      if (val > 8.5 || val < 6.0) return 75
      if (val > 8.0 || val < 6.5) return 45
      if (val > 7.8 || val < 7.0) return 20
      return 0
    },
  },
  turbidez: {
    label: "Turbidez",
    unit: "NTU",
    weight: 0.25,
    min: 0, max: 80,
    optMin: 5, optMax: 30,
    criticalDeltaPerHour: 15,
    icon: Eye,
    color: "#8b5cf6",
    riskFn: (val) => {
      if (val > 100) return 100
      if (val > 80)  return 75
      if (val > 50)  return 45
      if (val > 30)  return 20
      return 0
    },
  },
}

// ─── Motor de predicción ──────────────────────────────────────────────────────

const linearRegression = (points) => {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, r2: 0 }

  const sumX  = points.reduce((s, p) => s + p.x, 0)
  const sumY  = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)

  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1)
  const intercept = (sumY - slope * sumX) / n

  const yMean  = sumY / n
  const ssTot  = points.reduce((s, p) => s + Math.pow(p.y - yMean, 2), 0)
  const ssRes  = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0)
  const r2     = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot)

  return { slope, intercept, r2 }
}

const extractPoints = (history, sensorKey, n = 20) => {
  if (!history || history.length === 0) return []
  const recent = history.slice(-n)
  return recent
    .map((d, i) => ({ x: i, y: parseFloat(d[sensorKey] ?? 0), ts: d.timestamp }))
    .filter(p => p.y > 0)
}

const predictValue = (history, sensorKey, hoursAhead) => {
  const cfg = MODEL_CONFIG[sensorKey]
  const points = extractPoints(history, sensorKey)

  if (points.length < 3) {
    return { predictedValue: null, confidence: 0, slope: 0, trendLabel: "Datos insuficientes" }
  }

  const { slope, intercept, r2 } = linearRegression(points)
  const avgIntervalHours = 5 / 60
  const slopePerHour = slope / avgIntervalHours
  const stepsAhead = hoursAhead / avgIntervalHours
  const lastX = points[points.length - 1].x
  const predictedValue = slope * (lastX + stepsAhead) + intercept
  const confidence = Math.round(r2 * 100)
  const trendLabel = Math.abs(slopePerHour) < 0.05 ? "Estable"
    : slopePerHour > 0 ? `+${slopePerHour.toFixed(2)}${cfg.unit}/h`
    : `${slopePerHour.toFixed(2)}${cfg.unit}/h`

  return {
    predictedValue: parseFloat(Math.max(0, predictedValue).toFixed(2)),
    confidence,
    slope: slopePerHour,
    trendLabel,
  }
}

const calculateRiskScore = (currentValues, predictions2h, predictions4h) => {
  let currentScore = 0
  let score2h = 0
  let score4h = 0
  const breakdown = {}

  Object.entries(MODEL_CONFIG).forEach(([key, cfg]) => {
    const currentVal = currentValues[key] ?? 0
    const pred2h = predictions2h[key]?.predictedValue ?? currentVal
    const pred4h = predictions4h[key]?.predictedValue ?? currentVal

    const riskCurrent = cfg.riskFn(currentVal)
    const risk2h      = cfg.riskFn(pred2h)
    const risk4h      = cfg.riskFn(pred4h)

    currentScore += riskCurrent * cfg.weight
    score2h      += risk2h      * cfg.weight
    score4h      += risk4h      * cfg.weight

    breakdown[key] = {
      current: riskCurrent,
      at2h:    risk2h,
      at4h:    risk4h,
      trend:   predictions2h[key]?.slope ?? 0,
    }
  })

  return {
    current: Math.round(currentScore),
    at2h:    Math.round(score2h),
    at4h:    Math.round(score4h),
    breakdown,
  }
}

const getRiskLevel = (score) => {
  if (score >= 75) return { label: "Crítico",   strokeColor: "#ef4444", textColor: "#ef4444", lightBg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)'   }
  if (score >= 50) return { label: "Alto",       strokeColor: "#f97316", textColor: "#f97316", lightBg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.3)'  }
  if (score >= 25) return { label: "Moderado",   strokeColor: "#eab308", textColor: "#eab308", lightBg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.3)'   }
  return               { label: "Bajo",         strokeColor: "#22c55e", textColor: "#22c55e", lightBg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)'   }
}

const getRecommendations = (scores, currentValues) => {
  const recs = []
  const temp = currentValues.temperatura ?? 0
  const tempTrend = scores.breakdown?.temperatura?.trend ?? 0
  if (temp > 33 || (temp > 30 && tempTrend > 0.5))
    recs.push({ priority: "alta",    icon: "🌡️", text: "Activar sistema de enfriamiento o aireación. Temperatura en ascenso." })
  if (temp < 26)
    recs.push({ priority: "alta",    icon: "🌡️", text: "Temperatura por debajo del óptimo. Considera calentadores o cubre el estanque." })

  const ph = currentValues.ph ?? 7
  const phTrend = scores.breakdown?.ph?.trend ?? 0
  if (ph < 6.5 || (ph < 7 && phTrend < -0.1))
    recs.push({ priority: "alta",    icon: "⚗️", text: "pH ácido detectado. Aplicar cal agrícola para elevar el pH gradualmente." })
  if (ph > 8.5)
    recs.push({ priority: "media",   icon: "⚗️", text: "pH alcalino. Realizar recambio parcial de agua (20–30%)." })

  const turb = currentValues.turbidez ?? 0
  if (turb > 50)
    recs.push({ priority: "media",   icon: "💧", text: "Turbidez elevada. Revisar filtros y reducir densidad de siembra si persiste." })
  if (turb > 80)
    recs.push({ priority: "alta",    icon: "💧", text: "Turbidez crítica. Cambio de agua urgente y revisión del sistema de filtración." })

  if (scores.at2h >= 50)
    recs.push({ priority: "alta",    icon: "🚨", text: "Riesgo de mortalidad proyectado en 2h. Inspección física inmediata del estanque." })
  if (scores.at4h >= 75)
    recs.push({ priority: "urgente", icon: "🆘", text: "ALERTA: Condiciones críticas proyectadas en 4h. Actuar ahora." })

  if (recs.length === 0)
    recs.push({ priority: "ok", icon: "✅", text: "Todos los parámetros dentro del rango óptimo. Sistema estable." })

  return recs.sort((a, b) => {
    const order = { urgente: 0, alta: 1, media: 2, ok: 3 }
    return order[a.priority] - order[b.priority]
  })
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const ScoreGauge = ({ score, label }) => {
  const { D } = useTheme()
  const risk = getRiskLevel(score)
  const circumference = 2 * Math.PI * 45
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div style={{
      borderRadius: 12,
      border: `2px solid ${risk.border}`,
      padding: 20,
      background: risk.lightBg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: D.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, marginTop: 0 }}>
        {label}
      </p>
      <div style={{ position: 'relative', width: 112, height: 112 }}>
        <svg style={{ width: 112, height: 112, transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke={D.dim} strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke={risk.strokeColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: risk.textColor, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 11, color: D.muted }}>/ 100</span>
        </div>
      </div>
      <span style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: risk.textColor }}>{risk.label}</span>
    </div>
  )
}

const ParameterRow = ({ sensorKey, breakdown, currentValue, pred2h, pred4h }) => {
  const { D } = useTheme()
  const cfg = MODEL_CONFIG[sensorKey]
  const Icon = cfg.icon
  const risk = breakdown[sensorKey]
  const trendSlope = pred2h[sensorKey]?.slope ?? 0
  const conf = pred2h[sensorKey]?.confidence ?? 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: 12, borderRadius: 8,
      background: D.surface, border: `1px solid ${D.border}`,
    }}>
      <div style={{ padding: 8, borderRadius: 8, background: D.card, border: `1px solid ${D.border}`, flexShrink: 0 }}>
        <Icon style={{ width: 16, height: 16, color: cfg.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: D.text }}>{cfg.label}</span>
          <span style={{ fontSize: 11, color: D.muted }}>Confianza: {conf}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: D.muted }}>
          <span>Ahora: <strong style={{ color: D.text }}>{currentValue?.toFixed(1)}{cfg.unit}</strong></span>
          <span style={{ color: '#22C55E' }}>+2h: <strong>{pred2h[sensorKey]?.predictedValue ?? "--"}{cfg.unit}</strong></span>
          <span style={{ color: '#a78bfa' }}>+4h: <strong>{pred4h[sensorKey]?.predictedValue ?? "--"}{cfg.unit}</strong></span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: cfg.color, flexShrink: 0 }}>
        {Math.abs(trendSlope) < 0.05 ? <Minus style={{ width: 12, height: 12 }} />
          : trendSlope > 0 ? <TrendingUp style={{ width: 12, height: 12 }} />
          : <TrendingDown style={{ width: 12, height: 12 }} />}
        <span>Riesgo: {risk?.current ?? 0}%</span>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
const PrediccionRiesgo = ({ sensorsData, historicalData, isConnected }) => {
  const { D } = useTheme()
  const [scores, setScores] = useState(null)
  const [predictions2h, setPredictions2h] = useState({})
  const [predictions4h, setPredictions4h] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [modelRunAt, setModelRunAt] = useState(null)

  const currentValues = useMemo(() => {
    if (!sensorsData) return {}
    return {
      temperatura: parseFloat(sensorsData.temperatura?.raw ?? sensorsData.temperatura?.value ?? 0),
      ph:          parseFloat(sensorsData.ph?.raw          ?? sensorsData.ph?.value          ?? 7),
      turbidez:    parseFloat(sensorsData.turbidez?.raw    ?? sensorsData.turbidez?.value    ?? 0),
    }
  }, [sensorsData])

  useEffect(() => {
    if (!isConnected && !historicalData?.length) return

    const history = historicalData || []
    const preds2h = {}
    const preds4h = {}

    Object.keys(MODEL_CONFIG).forEach(key => {
      preds2h[key] = predictValue(history, key, 2)
      preds4h[key] = predictValue(history, key, 4)
    })

    const computed = calculateRiskScore(currentValues, preds2h, preds4h)
    const recs = getRecommendations(computed, currentValues)

    setPredictions2h(preds2h)
    setPredictions4h(preds4h)
    setScores(computed)
    setRecommendations(recs)
    setModelRunAt(new Date())
  }, [currentValues, historicalData, isConnected])

  const radarData = useMemo(() => {
    if (!scores?.breakdown) return []
    return Object.entries(MODEL_CONFIG).map(([key, cfg]) => ({
      parameter: cfg.label,
      "Ahora":    scores.breakdown[key]?.current ?? 0,
      "+2 horas": scores.breakdown[key]?.at2h    ?? 0,
      "+4 horas": scores.breakdown[key]?.at4h    ?? 0,
    }))
  }, [scores])

  const timelineData = useMemo(() => {
    if (!scores) return []
    return [
      { time: "Ahora", riesgo: scores.current },
      { time: "+2h",   riesgo: scores.at2h    },
      { time: "+4h",   riesgo: scores.at4h    },
    ]
  }, [scores])

  const REC_STYLES = {
    urgente: { background: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: '#fca5a5' },
    alta:    { background: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)',  color: '#fdba74' },
    media:   { background: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.3)',   color: '#fde047' },
    ok:      { background: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: '#86efac' },
  }

  const cardSt = {
    background: D.card,
    border: `1px solid ${D.border}`,
    borderRadius: 12,
    padding: 20,
  }

  if (!isConnected && !sensorsData) {
    return (
      <div style={{
        background: D.surface, borderRadius: 12,
        border: `2px dashed ${D.border}`, padding: 32,
        textAlign: 'center',
      }}>
        <Brain style={{ width: 40, height: 40, color: D.dim, margin: '0 auto 12px' }} />
        <p style={{ color: D.text, fontWeight: 500, margin: '0 0 4px' }}>Modelo sin datos</p>
        <p style={{ color: D.muted, fontSize: 13, margin: 0 }}>Conecta los sensores IoT para activar la predicción</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Encabezado */}
      <div style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', borderRadius: 12, padding: 24, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Brain style={{ width: 24, height: 24 }} />
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Predicción de Riesgo de Mortalidad</h3>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(221,214,254,0.9)', maxWidth: 480, margin: 0 }}>
              Algoritmo de scoring ponderado multivariable. Analiza tendencias de temperatura,
              pH y turbidez para proyectar el riesgo de mortalidad en las próximas horas.
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, color: 'rgba(221,214,254,0.8)' }}>
            {modelRunAt && (
              <>
                <p style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', margin: '0 0 2px' }}>
                  <Activity style={{ width: 12, height: 12 }} /> Modelo ejecutado
                </p>
                <p style={{ margin: 0 }}>{modelRunAt.toLocaleTimeString("es-BO")}</p>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {Object.entries(MODEL_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.18)', borderRadius: 8,
              padding: '6px 12px', fontSize: 13,
            }}>
              <cfg.icon style={{ width: 14, height: 14 }} />
              <span>{cfg.label}</span>
              <span style={{ fontWeight: 700 }}>{(cfg.weight * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gauges */}
      {scores && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <ScoreGauge score={scores.current} label="Riesgo actual"   />
          <ScoreGauge score={scores.at2h}    label="Proyección +2 h" />
          <ScoreGauge score={scores.at4h}    label="Proyección +4 h" />
        </div>
      )}

      {/* Timeline */}
      {timelineData.length > 0 && (
        <div style={cardSt}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: D.text, marginBottom: 16, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock style={{ width: 18, height: 18, color: D.muted }} />
            Evolución proyectada del riesgo
          </h4>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={timelineData} margin={{ top: 5, right: 20, left: -30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={D.border} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: D.muted }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: D.muted }} />
              <Tooltip
                contentStyle={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text }}
                formatter={(v) => [`${v}%`, "Riesgo"]}
              />
              <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Crítico",  fontSize: 10, fill: "#ef4444" }} />
              <ReferenceLine y={50} stroke="#f97316" strokeDasharray="4 4" label={{ value: "Alto",     fontSize: 10, fill: "#f97316" }} />
              <ReferenceLine y={25} stroke="#eab308" strokeDasharray="4 4" label={{ value: "Moderado", fontSize: 10, fill: "#eab308" }} />
              <Line type="monotone" dataKey="riesgo" stroke="#7c3aed" strokeWidth={3}
                dot={{ fill: "#7c3aed", r: 6 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Desglose por parámetro */}
      {scores && (
        <div style={cardSt}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: D.text, marginBottom: 16, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap style={{ width: 18, height: 18, color: D.muted }} />
            Contribución por parámetro
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.keys(MODEL_CONFIG).map(key => (
              <ParameterRow
                key={key}
                sensorKey={key}
                breakdown={scores.breakdown}
                currentValue={currentValues[key]}
                pred2h={predictions2h}
                pred4h={predictions4h}
              />
            ))}
          </div>

          {radarData.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 11, color: D.muted, textAlign: 'center', marginBottom: 8, marginTop: 0 }}>
                Distribución de riesgo por parámetro
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={D.border} />
                  <PolarAngleAxis dataKey="parameter" tick={{ fontSize: 12, fill: D.muted }} />
                  <Radar name="Ahora"    dataKey="Ahora"    stroke={D.muted}   fill={D.muted}   fillOpacity={0.1} />
                  <Radar name="+2 horas" dataKey="+2 horas" stroke="#3b82f6"   fill="#3b82f6"   fillOpacity={0.2} />
                  <Radar name="+4 horas" dataKey="+4 horas" stroke="#ef4444"   fill="#ef4444"   fillOpacity={0.2} />
                  <Tooltip contentStyle={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Recomendaciones */}
      <div style={cardSt}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: D.text, marginBottom: 16, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield style={{ width: 18, height: 18, color: D.muted }} />
          Recomendaciones accionables
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recommendations.map((rec, i) => {
            const s = REC_STYLES[rec.priority] || REC_STYLES.ok
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 8,
                background: s.background, border: `1px solid ${s.border}`,
              }}>
                <span style={{ fontSize: 18, lineHeight: 1, marginTop: 2 }}>{rec.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: s.color, margin: 0 }}>{rec.text}</p>
                  {rec.priority === "urgente" && (
                    <p style={{ fontSize: 11, marginTop: 4, opacity: 0.75, color: s.color, margin: '4px 0 0' }}>Prioridad: URGENTE</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Nota metodológica */}
      <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.25)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Info style={{ width: 20, height: 20, color: '#60a5fa', marginTop: 2, flexShrink: 0 }} />
          <div>
            <h5 style={{ fontSize: 14, fontWeight: 600, color: D.text, marginBottom: 8, marginTop: 0 }}>Metodología del modelo predictivo</h5>
            <p style={{ fontSize: 13, color: D.muted, lineHeight: 1.6, margin: '0 0 8px' }}>
              El algoritmo aplica <strong style={{ color: D.text }}>regresión lineal simple</strong> (mínimos cuadrados) sobre
              los últimos registros de cada sensor para estimar la tasa de cambio (δ/hora). Con esa
              pendiente extrapola el valor a +2h y +4h. El score de riesgo final se calcula como la
              suma ponderada de las funciones de riesgo individuales:
            </p>
            <div style={{
              padding: 8, background: D.surface, borderRadius: 8,
              fontFamily: 'monospace', fontSize: 12, color: D.text, marginBottom: 8,
            }}>
              Score = Σ (peso_i × riesgo_i(valor_proyectado_i))
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, fontSize: 12, color: D.muted }}>
              <div>• Temperatura: 40%</div>
              <div>• pH: 35%</div>
              <div>• Turbidez: 25%</div>
            </div>
            <p style={{ fontSize: 11, color: D.muted, marginTop: 8, marginBottom: 0 }}>
              El coeficiente R² mide la confianza de cada predicción individual basándose
              en la linealidad de la tendencia observada.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default PrediccionRiesgo
