import { useState, useEffect, useRef } from 'react'

const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

const useCountUp = (target, { duration = 1400, decimals = 0, prefix = '', suffix = '', startDelay = 0 } = {}) => {
  const [display, setDisplay] = useState(prefix + (0).toFixed(decimals) + suffix)
  const rafRef  = useRef(null)
  const prevRef = useRef(0)

  useEffect(() => {
    const num = parseFloat(target)
    if (isNaN(num)) { setDisplay(target); return }

    const timeout = setTimeout(() => {
      const startVal = prevRef.current
      const startT   = performance.now()

      const tick = now => {
        const t   = Math.min((now - startT) / duration, 1)
        const cur = startVal + (num - startVal) * easeOutExpo(t)
        setDisplay(prefix + cur.toFixed(decimals) + suffix)
        if (t < 1) rafRef.current = requestAnimationFrame(tick)
        else { prevRef.current = num; setDisplay(prefix + num.toFixed(decimals) + suffix) }
      }

      rafRef.current = requestAnimationFrame(tick)
    }, startDelay)

    return () => { clearTimeout(timeout); cancelAnimationFrame(rafRef.current) }
  }, [target, duration, decimals, prefix, suffix, startDelay])

  return display
}

export default useCountUp
