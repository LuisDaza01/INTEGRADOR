import { useEffect, useRef } from 'react'

// Animated circular HUD gauge using SVG
const HUDGauge = ({
  value   = 0,
  min     = 0,
  max     = 100,
  optMin  = 30,
  optMax  = 70,
  label   = '',
  unit    = '',
  color   = '#22C55E',
  size    = 140,
  icon: Icon,
}) => {
  const prevRef    = useRef(0)
  const frameRef   = useRef(null)
  const circleRef  = useRef(null)
  const valueRef   = useRef(null)

  const R      = size * 0.38
  const cx     = size / 2
  const cy     = size / 2
  const stroke = size * 0.065
  const circ   = 2 * Math.PI * R

  // Map value to 0-1
  const pct      = Math.min(1, Math.max(0, (value - min) / (max - min)))
  const optMinPct = (optMin - min) / (max - min)
  const optMaxPct = (optMax - min) / (max - min)

  // Is value in optimal range?
  const inRange  = value >= optMin && value <= optMax
  const critical = value < min * 0.9 || value > max * 1.1

  const activeColor = critical ? '#f87171' : inRange ? color : '#fbbf24'
  const glowColor   = critical ? 'rgba(248,113,113,0.5)' : inRange ? `${color}80` : 'rgba(251,191,36,0.5)'

  // Animate the arc
  useEffect(() => {
    const target = pct
    const start  = prevRef.current
    const startT = performance.now()
    const dur    = 900

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

  // Arc start: 135° clockwise, span 270°
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

  // Tick marks
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const angle = startAngle + (i / 8) * totalSpan
    const inner = R - stroke * 0.9
    const outer = R - stroke * 0.1
    const s = polarToCart(angle, inner)
    const e = polarToCart(angle, outer)
    return { s, e, major: i % 4 === 0 }
  })

  // Needle tip
  const needleAngle = startAngle + pct * totalSpan
  const needleTip   = polarToCart(needleAngle, R * 0.72)
  const needleBase1 = polarToCart(needleAngle - Math.PI / 2, 4)
  const needleBase2 = polarToCart(needleAngle + Math.PI / 2, 4)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Track background */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={circ * 0}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />

        {/* Optimal range arc */}
        <path
          d={arcPath(optMinAngle, optMaxAngle)}
          fill="none"
          stroke={`${color}22`}
          strokeWidth={stroke + 2}
        />

        {/* Active arc */}
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
            transition: 'stroke 0.5s ease',
            filter: `drop-shadow(0 0 ${stroke * 0.8}px ${glowColor})`,
          }}
        />

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line key={i}
            x1={t.s.x} y1={t.s.y} x2={t.e.x} y2={t.e.y}
            stroke={t.major ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}
            strokeWidth={t.major ? 1.5 : 0.8}
          />
        ))}

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={activeColor}
          opacity={0.9}
          style={{ filter: `drop-shadow(0 0 4px ${activeColor})` }}
        />
        <circle cx={cx} cy={cy} r={4} fill={activeColor} />

        {/* Center value */}
        <text
          ref={valueRef}
          x={cx} y={cy + R * 0.12}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.155}
          fontWeight="700"
          fontFamily="'Fira Code', monospace"
          fill={activeColor}
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        >
          {value.toFixed(value % 1 === 0 ? 0 : 1)}
        </text>
        <text
          x={cx} y={cy + R * 0.38}
          textAnchor="middle"
          fontSize={size * 0.08}
          fontFamily="'Fira Sans', sans-serif"
          fill="rgba(255,255,255,0.45)"
        >
          {unit}
        </text>

        {/* Label */}
        <text
          x={cx} y={size - size * 0.08}
          textAnchor="middle"
          fontSize={size * 0.09}
          fontWeight="600"
          fontFamily="'Fira Sans', sans-serif"
          fill="rgba(255,255,255,0.65)"
          letterSpacing="0.05em"
        >
          {label.toUpperCase()}
        </text>

        {/* Min / Max labels */}
        <text x={cx - R + 2} y={cy + R * 0.55} fontSize={size * 0.07} fill="rgba(255,255,255,0.3)" fontFamily="'Fira Code', monospace">{min}</text>
        <text x={cx + R - 2} y={cy + R * 0.55} fontSize={size * 0.07} fill="rgba(255,255,255,0.3)" fontFamily="'Fira Code', monospace" textAnchor="end">{max}</text>
      </svg>

      {/* Status ring glow */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        pointerEvents: 'none',
        boxShadow: `inset 0 0 ${size * 0.15}px ${glowColor}`,
        transition: 'box-shadow 0.5s ease',
      }} />
    </div>
  )
}

export default HUDGauge
