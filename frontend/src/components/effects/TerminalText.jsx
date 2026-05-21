import { useState, useEffect, useRef } from 'react'

const TerminalText = ({
  lines = [],
  typingSpeed = 38,
  lineDelay   = 320,
  style       = {},
  className   = '',
  onComplete  = null,
}) => {
  const [rendered, setRendered] = useState([])
  const [cursor, setCursor]     = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    let lineIdx = 0
    let charIdx = 0
    setRendered([])

    const nextChar = () => {
      if (lineIdx >= lines.length) {
        onComplete?.()
        return
      }

      const line = lines[lineIdx]

      if (charIdx === 0) {
        setRendered(prev => [...prev, { text: '', color: line.color, prefix: line.prefix || '> ' }])
      }

      if (charIdx < line.text.length) {
        setRendered(prev => {
          const next = [...prev]
          next[lineIdx] = { ...next[lineIdx], text: line.text.slice(0, charIdx + 1) }
          return next
        })
        charIdx++
        timerRef.current = setTimeout(nextChar, typingSpeed + Math.random() * 20)
      } else {
        lineIdx++
        charIdx = 0
        timerRef.current = setTimeout(nextChar, lineDelay)
      }
    }

    timerRef.current = setTimeout(nextChar, 200)
    return () => clearTimeout(timerRef.current)
  }, [lines.length])

  useEffect(() => {
    const blink = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(blink)
  }, [])

  return (
    <div
      className={className}
      style={{
        fontFamily: "'Fira Code', monospace",
        fontSize: 14,
        lineHeight: 1.8,
        ...style,
      }}
    >
      {rendered.map((line, i) => (
        <div key={i}>
          <span style={{ color: '#22C55E', opacity: 0.5 }}>{line.prefix}</span>
          <span style={{ color: line.color || 'rgba(255,255,255,0.85)' }}>{line.text}</span>
          {i === rendered.length - 1 && (
            <span
              style={{
                display: 'inline-block',
                width: 8, height: '1em',
                background: '#22C55E',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                opacity: cursor ? 1 : 0,
                transition: 'opacity 0.1s',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default TerminalText
