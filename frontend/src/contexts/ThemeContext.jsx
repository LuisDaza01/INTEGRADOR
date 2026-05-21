import { createContext, useContext, useState, useEffect } from 'react'

export const DARK = {
  // Backgrounds — design system: #0F172A base
  bg:      '#0a1220',
  surface: '#111e33',
  card:    'rgba(17,30,51,0.75)',
  border:  'rgba(34,197,94,0.15)',
  // Brand — green CTA (#22C55E) as primary accent
  primary: '#22C55E',
  cyan:    '#38bdf8',
  teal:    '#14b8a6',
  green:   '#22C55E',
  red:     '#f87171',
  orange:  '#fb923c',
  yellow:  '#fbbf24',
  purple:  '#a78bfa',
  indigo:  '#6366f1',
  // Text
  text:    '#f8fafc',
  sub:     '#94a3b8',
  muted:   '#64748b',
  dim:     '#334155',
  // Semantic
  inputBg:   'rgba(255,255,255,0.05)',
  sidebarBg: 'rgba(10,18,32,0.55)',
  headerBg:  'rgba(10,18,32,0.6)',
  shimmer:   'rgba(34,197,94,0.3)',
  // Glow tokens
  glowCyan:   '0 0 24px rgba(56,189,248,0.3),  0 0 64px rgba(56,189,248,0.1)',
  glowPurple: '0 0 24px rgba(139,92,246,0.3),  0 0 64px rgba(139,92,246,0.1)',
  glowGreen:  '0 0 24px rgba(34,197,94,0.35),  0 0 64px rgba(34,197,94,0.12)',
  glowTeal:   '0 0 24px rgba(20,184,166,0.3),  0 0 64px rgba(20,184,166,0.1)',
}

export const LIGHT = {
  // Backgrounds
  bg:      '#f0f9f4',
  surface: '#ffffff',
  card:    'rgba(255,255,255,0.82)',
  border:  'rgba(34,197,94,0.2)',
  // Brand — green (#16a34a) for light mode
  primary: '#16a34a',
  cyan:    '#0284c7',
  teal:    '#0d9488',
  green:   '#16a34a',
  red:     '#dc2626',
  orange:  '#ea580c',
  yellow:  '#d97706',
  purple:  '#7c3aed',
  indigo:  '#4f46e5',
  // Text
  text:    '#0f172a',
  sub:     '#334155',
  muted:   '#64748b',
  dim:     '#cbd5e1',
  // Semantic
  inputBg:   'rgba(34,197,94,0.05)',
  sidebarBg: 'rgba(240,249,244,0.72)',
  headerBg:  'rgba(240,249,244,0.78)',
  shimmer:   'rgba(22,163,74,0.2)',
  // Glow tokens
  glowCyan:   '0 0 20px rgba(2,132,199,0.2),   0 0 48px rgba(2,132,199,0.08)',
  glowPurple: '0 0 20px rgba(124,58,237,0.2),  0 0 48px rgba(124,58,237,0.08)',
  glowGreen:  '0 0 20px rgba(22,163,74,0.25),  0 0 48px rgba(22,163,74,0.1)',
  glowTeal:   '0 0 20px rgba(13,148,136,0.2),  0 0 48px rgba(13,148,136,0.08)',
}

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('np_theme') !== 'light'
  })

  // Apply CSS variables and document class when theme changes
  useEffect(() => {
    const d = isDark ? DARK : LIGHT
    const root = document.documentElement
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    root.style.setProperty('--np-bg',       d.bg)
    root.style.setProperty('--np-surface',  d.surface)
    root.style.setProperty('--np-border',   d.border)
    root.style.setProperty('--np-primary',  d.primary)
    root.style.setProperty('--np-text',     d.text)
    root.style.setProperty('--np-muted',    d.muted)
    root.style.setProperty('--np-card',     d.card)
    root.style.setProperty('--np-green',    d.green)
    root.style.setProperty('--np-shimmer',  d.shimmer)
    root.style.backgroundColor = d.bg
    root.style.color = d.text
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem('np_theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ D: isDark ? DARK : LIGHT, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
