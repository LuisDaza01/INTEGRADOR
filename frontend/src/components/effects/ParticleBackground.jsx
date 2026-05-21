import { useEffect, useRef } from 'react'

// Fish particle that swims across the canvas
class Fish {
  constructor(canvas) {
    this.reset(canvas)
    // Start at random x position (not just left edge)
    this.x = Math.random() * canvas.width
  }

  reset(canvas) {
    this.canvas  = canvas
    this.x       = -60
    this.y       = Math.random() * canvas.height
    this.size    = Math.random() * 10 + 5
    this.speed   = Math.random() * 0.6 + 0.2
    this.opacity = Math.random() * 0.25 + 0.05
    this.waveAmp = Math.random() * 18 + 6
    this.waveFreq= Math.random() * 0.015 + 0.008
    this.phase   = Math.random() * Math.PI * 2
    this.flip    = Math.random() > 0.5 ? 1 : -1
    this.color   = Math.random() > 0.6 ? '#22C55E' : Math.random() > 0.5 ? '#4ade80' : '#86efac'
  }

  update(t) {
    this.x += this.speed
    this.y  = this.y + Math.sin(t * this.waveFreq + this.phase) * 0.4
    if (this.x > this.canvas.width + 80) this.reset(this.canvas)
  }

  draw(ctx, t) {
    ctx.save()
    ctx.globalAlpha = this.opacity
    ctx.translate(this.x, this.y + Math.sin(t * this.waveFreq + this.phase) * this.waveAmp)
    ctx.scale(this.flip, 1)

    const s = this.size
    ctx.strokeStyle = this.color
    ctx.fillStyle   = this.color
    ctx.lineWidth   = 0.8

    // Body
    ctx.beginPath()
    ctx.ellipse(0, 0, s * 1.5, s * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()

    // Tail
    ctx.beginPath()
    ctx.moveTo(-s * 1.4, 0)
    ctx.lineTo(-s * 2.4, -s * 0.7)
    ctx.lineTo(-s * 2.4, s * 0.7)
    ctx.closePath()
    ctx.fill()

    // Eye
    ctx.fillStyle = '#0a1220'
    ctx.beginPath()
    ctx.arc(s * 0.8, -s * 0.1, s * 0.18, 0, Math.PI * 2)
    ctx.fill()

    // Fin
    ctx.fillStyle = this.color
    ctx.globalAlpha = this.opacity * 0.6
    ctx.beginPath()
    ctx.moveTo(0, -s * 0.5)
    ctx.lineTo(s * 0.3, -s * 1.1)
    ctx.lineTo(-s * 0.3, -s * 0.5)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }
}

// Floating bubble particle
class Bubble {
  constructor(canvas) {
    this.reset(canvas)
    this.y = Math.random() * canvas.height
  }

  reset(canvas) {
    this.canvas  = canvas
    this.x       = Math.random() * canvas.width
    this.y       = canvas.height + 20
    this.r       = Math.random() * 3 + 1
    this.speed   = Math.random() * 0.5 + 0.15
    this.drift   = (Math.random() - 0.5) * 0.3
    this.opacity = Math.random() * 0.15 + 0.04
    this.color   = Math.random() > 0.5 ? '#22C55E' : '#38bdf8'
  }

  update() {
    this.y -= this.speed
    this.x += this.drift
    if (this.y < -20) this.reset(this.canvas)
  }

  draw(ctx) {
    ctx.save()
    ctx.globalAlpha = this.opacity
    ctx.strokeStyle = this.color
    ctx.lineWidth   = 0.6
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

// Mouse-reactive nodes
class Node {
  constructor(canvas) {
    this.canvas  = canvas
    this.x       = Math.random() * canvas.width
    this.y       = Math.random() * canvas.height
    this.vx      = (Math.random() - 0.5) * 0.3
    this.vy      = (Math.random() - 0.5) * 0.3
    this.r       = Math.random() * 1.5 + 0.5
    this.opacity = Math.random() * 0.18 + 0.05
    this.color   = Math.random() > 0.5 ? '#22C55E' : '#4ade80'
  }

  update(mouseX, mouseY) {
    const dx = this.x - mouseX
    const dy = this.y - mouseY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 120) {
      this.x += dx / dist * 0.8
      this.y += dy / dist * 0.8
    }
    this.x += this.vx
    this.y += this.vy
    if (this.x < 0 || this.x > this.canvas.width)  this.vx *= -1
    if (this.y < 0 || this.y > this.canvas.height)  this.vy *= -1
  }

  draw(ctx) {
    ctx.save()
    ctx.globalAlpha = this.opacity
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

const FISH_COUNT   = 18
const BUBBLE_COUNT = 35
const NODE_COUNT   = 60
const LINE_DIST    = 110

const ParticleBackground = ({ style = {} }) => {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ fishes: [], bubbles: [], nodes: [], mouse: { x: -999, y: -999 }, t: 0, raf: null })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s   = stateRef.current

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      s.fishes  = Array.from({ length: FISH_COUNT },   () => new Fish(canvas))
      s.bubbles = Array.from({ length: BUBBLE_COUNT }, () => new Bubble(canvas))
      s.nodes   = Array.from({ length: NODE_COUNT },   () => new Node(canvas))
    }

    const onMouse = e => {
      const rect = canvas.getBoundingClientRect()
      s.mouse.x = e.clientX - rect.left
      s.mouse.y = e.clientY - rect.top
    }

    const draw = () => {
      s.t++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw node connections
      for (let i = 0; i < s.nodes.length; i++) {
        for (let j = i + 1; j < s.nodes.length; j++) {
          const dx = s.nodes[i].x - s.nodes[j].x
          const dy = s.nodes[i].y - s.nodes[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < LINE_DIST) {
            ctx.save()
            ctx.globalAlpha = (1 - d / LINE_DIST) * 0.06
            ctx.strokeStyle = '#22C55E'
            ctx.lineWidth   = 0.5
            ctx.beginPath()
            ctx.moveTo(s.nodes[i].x, s.nodes[i].y)
            ctx.lineTo(s.nodes[j].x, s.nodes[j].y)
            ctx.stroke()
            ctx.restore()
          }
        }
      }

      s.nodes.forEach(n => { n.update(s.mouse.x, s.mouse.y); n.draw(ctx) })
      s.bubbles.forEach(b => { b.update(); b.draw(ctx) })
      s.fishes.forEach(f => { f.update(s.t); f.draw(ctx, s.t) })

      s.raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    canvas.addEventListener('mousemove', onMouse)
    s.raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(s.raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
    />
  )
}

export default ParticleBackground
