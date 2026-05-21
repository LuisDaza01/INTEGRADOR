import { useEffect, useRef } from 'react'

const GLITCH_CHARS = '!<>-_\\/[]{}—=+*^?#█▓▒░|'

const GlitchText = ({
  children,
  as: Tag = 'span',
  className = '',
  style = {},
  intensity = 'low',   // 'low' | 'medium' | 'high'
  continuous = false,  // keep glitching or only on hover
}) => {
  const ref       = useRef(null)
  const rafRef    = useRef(null)
  const activeRef = useRef(false)

  const glitch = () => {
    const el = ref.current
    if (!el) return
    const original = el.dataset.original || el.textContent
    el.dataset.original = original

    const iterations = intensity === 'high' ? original.length : intensity === 'medium' ? Math.floor(original.length / 2) : 3
    let i = 0

    const step = () => {
      el.textContent = original
        .split('')
        .map((ch, idx) => {
          if (ch === ' ') return ' '
          if (idx < i) return original[idx]
          if (Math.random() < 0.25) return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
          return ch
        })
        .join('')

      if (i < original.length) {
        i += 0.35
        rafRef.current = requestAnimationFrame(step)
      } else {
        el.textContent = original
        activeRef.current = false
        if (continuous) {
          setTimeout(glitch, 3500 + Math.random() * 2000)
        }
      }
    }

    if (!activeRef.current) {
      activeRef.current = true
      rafRef.current = requestAnimationFrame(step)
    }
  }

  useEffect(() => {
    if (continuous) {
      const delay = setTimeout(glitch, 1200 + Math.random() * 1000)
      return () => { clearTimeout(delay); cancelAnimationFrame(rafRef.current) }
    }
  }, [continuous, children])

  const cssStr = `
    .np-glitch-wrap { position: relative; display: inline-block; }
    .np-glitch-wrap::before,
    .np-glitch-wrap::after {
      content: attr(data-text);
      position: absolute;
      inset: 0;
      clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
      animation: none;
    }
    .np-glitch-active::before {
      animation: glitchTop 0.3s steps(1) infinite;
      color: #22C55E;
      transform: translateX(-2px);
    }
    .np-glitch-active::after {
      clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
      animation: glitchBot 0.4s steps(1) infinite;
      color: #a78bfa;
      transform: translateX(2px);
    }
    @keyframes glitchTop {
      0%,100% { clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%); transform: translateX(-2px); }
      25% { clip-path: polygon(0 15%, 100% 15%, 100% 40%, 0 40%); transform: translateX(2px); }
      50% { clip-path: polygon(0 5%, 100% 5%, 100% 25%, 0 25%); transform: translateX(-1px); }
      75% { clip-path: polygon(0 20%, 100% 20%, 100% 30%, 0 30%); transform: translateX(1px); }
    }
    @keyframes glitchBot {
      0%,100% { clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%); transform: translateX(2px); }
      25% { clip-path: polygon(0 70%, 100% 70%, 100% 85%, 0 85%); transform: translateX(-2px); }
      50% { clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); transform: translateX(1px); }
      75% { clip-path: polygon(0 75%, 100% 75%, 100% 95%, 0 95%); transform: translateX(-1px); }
    }
  `

  return (
    <>
      <style>{cssStr}</style>
      <Tag
        ref={ref}
        className={`np-glitch-wrap ${className}`}
        data-text={typeof children === 'string' ? children : ''}
        style={{ cursor: 'default', ...style }}
        onMouseEnter={continuous ? undefined : glitch}
      >
        {children}
      </Tag>
    </>
  )
}

export default GlitchText
