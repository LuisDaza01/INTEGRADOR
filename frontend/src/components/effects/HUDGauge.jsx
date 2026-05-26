import { useEffect, useRef } from 'react'

// Componente HUDGauge — Dial cuántico de monitoreo con órbitas giratorias dobles y resplandor neón
const HUDGauge = ({
  value   = 0,
  min     = 0,
  max     = 100,
  optMin  = 30,
  optMax  = 70,
  label   = '',
  unit    = '',
  color   = '#22C55E',
  size    = 150,
}) => {
  const prevRef    = useRef(0)
  const frameRef   = useRef(null)
  const circleRef  = useRef(null)
  const valueRef   = useRef(null)

  const R      = size * 0.36
  const cx     = size / 2
  const cy     = size / 2
  const stroke = size * 0.062
  const circ   = 2 * Math.PI * R

  // Mapear valor a 0-1
  const pct      = Math.min(1, Math.max(0, (value - min) / (max - min)))
  const optMinPct = (optMin - min) / (max - min)
  const optMaxPct = (optMax - min) / (max - min)

  // ¿Parámetros en rango óptimo o crítico?
  const inRange  = value >= optMin && value <= optMax
  const critical = value < min * 0.95 || value > max * 1.05

  const activeColor = critical ? '#f87171' : inRange ? color : '#facc15'
  const glowColor   = critical ? 'rgba(248,113,113,0.45)' : inRange ? `${color}70` : 'rgba(250,204,21,0.45)'

  // Animación del arco circular
  useEffect(() => {
    const target = pct
    const start  = prevRef.current
    const startT = performance.now()
    const dur    = 1000

    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    const animate = now => {
      const elapsed = Math.min((now - startT) / dur, 1)
      const cur = start + (target - start) * ease(elapsed)
      prevRef.current = cur

      if (circleRef.current) {
        const offset = circ * (1 - cur * 0.75)
        circleRef.current.style.strokeDashoffset = offset
      }
      if (valueRef.current) {
        const displayed = (min + cur * (max - min)).toFixed(value % 1 === 0 ? 0 : 1)
        valueRef.current.textContent = displayed
      }
      if (elapsed < 1) frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, pct, min, max, circ])

  const startAngle = 135 * (Math.PI / 180)
  const polarToCart = (angle, r = R) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  })

  const arcPath = (from, to, r = R) => {
    const s = polarToCart(from, r)
    const e = polarToCart(to, r)
    const large = to - from > Math.PI ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const totalSpan = 270 * (Math.PI / 180)
  const optMinAngle = startAngle + optMinPct * totalSpan
  const optMaxAngle = startAngle + optMaxPct * totalSpan

  // Ticks de escala HUD
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const angle = startAngle + (i / 8) * totalSpan
    const inner = R - stroke * 0.8
    const outer = R - stroke * 0.1
    const s = polarToCart(angle, inner)
    const e = polarToCart(angle, outer)
    return { s, e, major: i % 4 === 0 }
  })

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      
      {/* Órbita exterior girando a la derecha */}
      <div 
        className="absolute rounded-full border border-dashed animate-[spin_20s_linear_infinite]"
        style={{
          width: `${size - 4}px`,
          height: `${size - 4}px`,
          borderColor: `${activeColor}22`,
        }}
      />

      {/* Órbita interior girando a la izquierda */}
      <div 
        className="absolute rounded-full border border-dotted animate-[spin_14s_linear_infinite_reverse]"
        style={{
          width: `${size - 18}px`,
          height: `${size - 18}px`,
          borderColor: `${activeColor}15`,
        }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute z-10">
        <defs>
          <filter id={`neon-glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Pista de cristal traslúcido */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={stroke}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />

        {/* Zona del rango óptimo delineada */}
        <path
          d={arcPath(optMinAngle, optMaxAngle)}
          fill="none"
          stroke={`${color}18`}
          strokeWidth={stroke + 3}
          strokeLinecap="round"
        />

        {/* Arco de progreso de neón activo */}
        <circle
          ref={circleRef}
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={activeColor}
          strokeWidth={stroke}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{
            transition: 'stroke 0.4s ease',
            filter: `url(#neon-glow-${label})`,
          }}
        />

        {/* Marcas de Ticks de escala */}
        {ticks.map((t, i) => (
          <line key={i}
            x1={t.s.x} y1={t.s.y} x2={t.e.x} y2={t.e.y}
            stroke={t.major ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={t.major ? 1.5 : 0.8}
          />
        ))}

        {/* Valor central grande */}
        <text
          ref={valueRef}
          x={cx} y={cy + R * 0.12}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.16}
          fontWeight="800"
          fontFamily="'Fira Code', monospace"
          fill={activeColor}
          style={{ filter: `drop-shadow(0 0 5px ${glowColor})` }}
        >
          {value.toFixed(value % 1 === 0 ? 0 : 1)}
        </text>
        
        {/* Unidad en Fira Sans */}
        <text
          x={cx} y={cy + R * 0.38}
          textAnchor="middle"
          fontSize={size * 0.085}
          fontWeight="500"
          fontFamily="'Fira Sans', sans-serif"
          fill="rgba(255,255,255,0.4)"
        >
          {unit || 'pH'}
        </text>

        {/* Nombre del biosensor abajo */}
        <text
          x={cx} y={size - size * 0.08}
          textAnchor="middle"
          fontSize={size * 0.082}
          fontWeight="700"
          fontFamily="'Fira Code', monospace"
          fill="rgba(255,255,255,0.5)"
          letterSpacing="0.08em"
        >
          {label.toUpperCase()}
        </text>
      </svg>

      {/* Halo de luz posterior de cristal */}
      <div 
        className="absolute rounded-full pointer-events-none transition-all duration-500"
        style={{
          width: `${size - 10}px`,
          height: `${size - 10}px`,
          boxShadow: `inset 0 0 16px ${glowColor}`,
        }}
      />
    </div>
  )
}

export default HUDGauge
