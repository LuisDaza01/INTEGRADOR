import { createContext, useContext, useState, useEffect } from 'react'

export const DARK = {
  bg:      '#060d1f',
  surface: '#0c1628',
  card:    'rgba(11,21,37,0.6)',
  border:  'rgba(56,189,248,0.18)',
  primary: '#38bdf8',
  teal:    '#14b8a6',
  green:   '#4ade80',
  red:     '#f87171',
  orange:  '#fb923c',
  yellow:  '#fbbf24',
  purple:  '#a78bfa',
  indigo:  '#6366f1',
  text:    '#e2e8f0',
  sub:     '#94a3b8',
  muted:   '#64748b',
  dim:     '#334155',
  // semantic
  inputBg:   'rgba(255,255,255,0.05)',
  sidebarBg: 'rgba(6,13,31,0.5)',
  headerBg:  'rgba(6,13,31,0.55)',
  shimmer:   'rgba(56,189,248,0.3)',
  // glow tokens
  glowCyan:   '0 0 24px rgba(56,189,248,0.3),  0 0 64px rgba(56,189,248,0.1)',
  glowPurple: '0 0 24px rgba(139,92,246,0.3),  0 0 64px rgba(139,92,246,0.1)',
  glowGreen:  '0 0 24px rgba(74,222,128,0.3),  0 0 64px rgba(74,222,128,0.1)',
  glowTeal:   '0 0 24px rgba(20,184,166,0.3),  0 0 64px rgba(20,184,166,0.1)',
}

export const LIGHT = {
  bg:      '#f0f7ff',
  surface: '#ffffff',
  card:    'rgba(255,255,255,0.75)',
  border:  'rgba(14,116,193,0.2)',
  primary: '#0284c7',
  teal:    '#0d9488',
  green:   '#16a34a',
  red:     '#dc2626',
  orange:  '#ea580c',
  yellow:  '#d97706',
  purple:  '#7c3aed',
  indigo:  '#4f46e5',
  text:    '#0f172a',
  sub:     '#334155',
  muted:   '#64748b',
  dim:     '#cbd5e1',
  // semantic
  inputBg:   'rgba(14,116,193,0.06)',
  sidebarBg: 'rgba(240,247,255,0.65)',
  headerBg:  'rgba(240,247,255,0.7)',
  shimmer:   'rgba(14,116,193,0.2)',
  // glow tokens
  glowCyan:   '0 0 20px rgba(14,116,193,0.2),  0 0 48px rgba(14,116,193,0.08)',
  glowPurple: '0 0 20px rgba(124,58,237,0.2),  0 0 48px rgba(124,58,237,0.08)',
  glowGreen:  '0 0 20px rgba(22,163,74,0.2),   0 0 48px rgba(22,163,74,0.08)',
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
