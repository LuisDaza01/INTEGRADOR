"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"

const SensorCard = ({
  title,
  value,
  unit,
  icon: Icon,
  iconColor,
  iconBg,
  data,
  isOutOfRange,
  minValue,
  maxValue,
  trend,
  lastUpdated,
}) => {
  const { D } = useTheme()
  const [showDetails, setShowDetails] = useState(false)

  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0
  const safeMinValue = typeof minValue === 'number' ? minValue : 0
  const safeMaxValue = typeof maxValue === 'number' ? maxValue : 100

  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight
  const trendColor = trend === "up" ? "#f87171" : "#4ade80"

  const percentage = Math.min(Math.max(
    ((numericValue - safeMinValue) / (safeMaxValue - safeMinValue || 1)) * 100, 0
  ), 100)

  const calculateSafeAverage = () => (numericValue + (Math.random() * 2 - 1)).toFixed(1)
  const calculateSafeTrend = () => Math.abs(Math.random() * 2).toFixed(1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="np-hover"
      style={{
        background: D.card,
        borderRadius: 12,
        border: `1px solid ${isOutOfRange ? '#f87171' : D.border}`,
        boxShadow: isOutOfRange ? '0 0 16px rgba(248,113,113,0.25), 0 0 0 1px rgba(248,113,113,0.3)' : 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flexShrink: 0, borderRadius: 8, padding: 12, background: iconBg || 'rgba(56,189,248,0.12)' }}>
              <Icon style={{ width: 24, height: 24, color: iconColor || D.primary }} />
            </div>
            <div style={{ marginLeft: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: D.muted, margin: 0 }}>{title}</p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: D.text, margin: 0 }}>
                  {numericValue} {unit}
                </h3>
                {isOutOfRange && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                    style={{ marginLeft: 8 }}
                  >
                    <AlertTriangle style={{ width: 20, height: 20, color: '#f87171' }} />
                  </motion.div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
                  <TrendIcon style={{ width: 16, height: 16, color: trendColor }} />
                  <span style={{ fontSize: 12, color: trendColor }}>
                    {trend === "up" ? "+" : "-"}{calculateSafeTrend()} {unit}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowDetails(!showDetails)}
            style={{ padding: 4, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <svg
              style={{
                width: 20, height: 20, color: D.muted,
                transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16, position: 'relative', height: 8, background: D.dim, borderRadius: 9999, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              background: isOutOfRange ? '#f87171' : D.primary,
              borderRadius: 9999,
            }}
          />
        </div>

        <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: D.muted }}>
          <span>{safeMinValue} {unit}</span>
          <span>{safeMaxValue} {unit}</span>
        </div>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', fontSize: 11, color: D.muted }}>
          <Clock style={{ width: 12, height: 12, marginRight: 4 }} />
          <span>Actualizado: {lastUpdated || 'Hace un momento'}</span>
        </div>
      </div>

      {/* Expandable details */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: showDetails ? "auto" : 0, opacity: showDetails ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden', background: D.surface, borderTop: `1px solid ${D.border}` }}
      >
        <div style={{ padding: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 500, color: D.text, marginBottom: 8, marginTop: 0 }}>Detalles del sensor</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: D.muted }}>Rango óptimo:</span>
              <span style={{ fontWeight: 600, color: D.text }}>{safeMinValue} - {safeMaxValue} {unit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: D.muted }}>Promedio 24h:</span>
              <span style={{ fontWeight: 600, color: D.text }}>{calculateSafeAverage()} {unit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: D.muted }}>Estado:</span>
              <span style={{ fontWeight: 600, color: isOutOfRange ? '#f87171' : '#4ade80' }}>
                {isOutOfRange ? "Fuera de rango" : "Normal"}
              </span>
            </div>
          </div>

          {/* Mini chart */}
          <div style={{
            marginTop: 12, height: 64, background: D.card,
            borderRadius: 8, border: `1px solid ${D.border}`,
            padding: 4, display: 'flex', alignItems: 'flex-end', gap: 4,
          }}>
            {[...Array(12)].map((_, i) => {
              const h = 30 + Math.random() * 50
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  style={{
                    flex: 1, borderRadius: '4px 4px 0 0',
                    background: h > 80 ? '#f87171' : h > 60 ? '#facc15' : D.primary,
                  }}
                />
              )
            })}
          </div>
        </div>
      </motion.div>

      <div style={{ background: D.surface, padding: '12px 20px', borderTop: `1px solid ${D.border}` }}>
        <a
          href="#"
          style={{ fontSize: 13, fontWeight: 500, color: D.primary, textDecoration: 'none' }}
          onMouseOver={e => e.target.style.opacity = '0.8'}
          onMouseOut={e => e.target.style.opacity = '1'}
        >
          Ver historial completo
        </a>
      </div>
    </motion.div>
  )
}

export default SensorCard
