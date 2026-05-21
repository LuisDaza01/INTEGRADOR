import { motion } from 'framer-motion'
import { CheckCircle, Clock, Package, Truck, Home, XCircle } from 'lucide-react'

const STEPS = [
  { key: 'pendiente',   label: 'Pendiente',   icon: Clock,        color: '#fbbf24' },
  { key: 'confirmado',  label: 'Confirmado',  icon: CheckCircle,  color: '#22C55E' },
  { key: 'preparando',  label: 'Preparando',  icon: Package,      color: '#a78bfa' },
  { key: 'listo',       label: 'Listo',       icon: CheckCircle,  color: '#4ade80' },
  { key: 'en_camino',   label: 'En camino',   icon: Truck,        color: '#38bdf8' },
  { key: 'entregado',   label: 'Entregado',   icon: Home,         color: '#22C55E' },
]

const OrderTimeline = ({ currentStatus = 'pendiente', compact = false }) => {
  if (currentStatus === 'cancelado') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
        <XCircle size={16} style={{ color: '#f87171' }} />
        <span style={{ color: '#f87171', fontSize: 13, fontFamily: "'Fira Sans', sans-serif", fontWeight: 600 }}>Pedido Cancelado</span>
      </div>
    )
  }

  const currentIdx = STEPS.findIndex(s => s.key === currentStatus)

  if (compact) {
    const cur = STEPS[currentIdx] ?? STEPS[0]
    const Icon = cur.icon
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: `${cur.color}22`, border: `1px solid ${cur.color}55` }}>
          <Icon size={12} style={{ color: cur.color }} />
        </div>
        <span style={{ fontSize: 12, color: cur.color, fontFamily: "'Fira Sans', sans-serif", fontWeight: 600 }}>
          {cur.label}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto" style={{ minWidth: 0 }}>
      {STEPS.map((step, idx) => {
        const Icon     = step.icon
        const done     = idx <= currentIdx
        const active   = idx === currentIdx
        const isLast   = idx === STEPS.length - 1

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            {/* Node */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <motion.div
                initial={false}
                animate={active
                  ? { scale: [1, 1.15, 1], transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } }
                  : { scale: 1 }}
                style={{
                  width: active ? 34 : 28,
                  height: active ? 34 : 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: done ? `${step.color}22` : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${done ? step.color : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: active ? `0 0 14px ${step.color}66` : 'none',
                  transition: 'all 0.4s ease',
                  flexShrink: 0,
                }}
              >
                <Icon size={active ? 15 : 12} style={{ color: done ? step.color : 'rgba(255,255,255,0.25)' }} />
              </motion.div>
              <span style={{
                fontSize: 9,
                fontFamily: "'Fira Sans', sans-serif",
                fontWeight: active ? 700 : 500,
                color: done ? step.color : 'rgba(255,255,255,0.3)',
                whiteSpace: 'nowrap',
                letterSpacing: '0.03em',
              }}>
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {!isLast && (
              <div style={{ flex: 1, height: 2, margin: '0 2px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.07)', borderRadius: 1 }} />
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: idx < currentIdx ? 1 : 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(90deg, ${step.color}, ${STEPS[idx + 1]?.color || step.color})`,
                    transformOrigin: 'left',
                    borderRadius: 1,
                    boxShadow: `0 0 6px ${step.color}66`,
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default OrderTimeline
