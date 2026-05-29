"use client"
import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X,
  AlertCircle, Trash2, Clock, Plus, RefreshCw, MousePointerSquareDashed,
  CheckCircle2, Ban, Sparkles, CalendarDays, CalendarOff, CalendarRange,
} from "lucide-react"
import api from "../../api/config/axios"
import { useTheme } from "../../contexts/ThemeContext"

const DIAS_SEMANA = [
  { key: "lunes",     short: "L", label: "Lunes" },
  { key: "martes",    short: "M", label: "Martes" },
  { key: "miercoles", short: "X", label: "Miércoles" },
  { key: "jueves",    short: "J", label: "Jueves" },
  { key: "viernes",   short: "V", label: "Viernes" },
  { key: "sabado",    short: "S", label: "Sábado" },
  { key: "domingo",   short: "D", label: "Domingo" },
]
const NOMBRE_MES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

const ymd = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Calendario de disponibilidad del productor.
 * Si `embedded=true`, se renderiza sin padding/maxWidth (para meterse dentro de otra página, e.g. PerfilProductor).
 */
export default function Calendario({ embedded = false }) {
  const { D, isDark } = useTheme()
  const qc = useQueryClient()

  const [cursor, setCursor] = useState(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })
  const [excepcionModal, setExcepcionModal] = useState(null)

  // Selección de rango
  const [rangeMode,  setRangeMode]  = useState(false)
  const [rangeStart, setRangeStart] = useState(null)
  const [rangeEnd,   setRangeEnd]   = useState(null)
  const [bulkOpen,   setBulkOpen]   = useState(false)

  // Rango del mes visible
  const desde = useMemo(() => {
    const d = new Date(cursor)
    d.setDate(1)
    const dow = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - dow)
    return d
  }, [cursor])

  const hasta = useMemo(() => {
    const d = new Date(desde)
    d.setDate(d.getDate() + 41)
    return d
  }, [desde])

  const { data: misDias = [], isLoading: loadingDias } = useQuery({
    queryKey: ["disp", "dias"],
    queryFn: () => api.get("/disponibilidad/dias").then(r => r.data?.data ?? []),
  })

  const { data: excepciones = [], refetch: refetchExc } = useQuery({
    queryKey: ["disp", "exc", ymd(desde), ymd(hasta)],
    queryFn: () => api.get("/disponibilidad/excepciones", {
      params: { desde: ymd(desde), hasta: ymd(hasta) },
    }).then(r => r.data?.data ?? []),
  })

  const excByFecha = useMemo(() => {
    const map = new Map()
    for (const e of excepciones) {
      const f = typeof e.fecha === "string" ? e.fecha.slice(0, 10) : ymd(new Date(e.fecha))
      map.set(f, e)
    }
    return map
  }, [excepciones])

  const diasHabilitadosSet = useMemo(() =>
    new Set(misDias.map(d => d.dia)),
  [misDias])

  // ─── Mutaciones ─────────────────────────────────────────────────
  const guardarDia = useMutation({
    mutationFn: (body) => api.put("/disponibilidad/dias", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disp", "dias"] }),
  })
  const borrarDia = useMutation({
    mutationFn: (dia) => api.delete(`/disponibilidad/dias/${dia}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disp", "dias"] }),
  })
  const guardarExcepcion = useMutation({
    mutationFn: (body) => api.put("/disponibilidad/excepciones", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disp", "exc"] }),
  })
  const borrarExcepcion = useMutation({
    mutationFn: (fecha) => api.delete(`/disponibilidad/excepciones/${fecha}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disp", "exc"] }),
  })
  const bulkExcepciones = useMutation({
    mutationFn: (body) => api.put("/disponibilidad/excepciones/bulk", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disp", "exc"] }),
  })

  const limpiarRango = () => { setRangeStart(null); setRangeEnd(null); setBulkOpen(false) }
  const salirRange   = () => { setRangeMode(false); limpiarRango() }

  const rangoOrdenado = useMemo(() => {
    if (!rangeStart) return null
    const a = rangeStart, b = rangeEnd ?? rangeStart
    return a <= b ? [a, b] : [b, a]
  }, [rangeStart, rangeEnd])

  const enRango = (fecha) => {
    if (!rangoOrdenado) return false
    return fecha >= rangoOrdenado[0] && fecha <= rangoOrdenado[1]
  }

  const toggleDia = (diaKey) => {
    const ya = misDias.find(d => d.dia === diaKey)
    if (ya) borrarDia.mutate(diaKey)
    else    guardarDia.mutate({ dia: diaKey, hora_inicio: "08:00", hora_fin: "18:00", venta_directa: true })
  }

  // ─── Construir días del calendario ──────────────────────────────
  const dias = useMemo(() => {
    const arr = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(desde)
      d.setDate(desde.getDate() + i)
      const f = ymd(d)
      const exc = excByFecha.get(f)
      const dowKey = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"][d.getDay()]
      const enMes = d.getMonth() === cursor.getMonth()

      let estado
      if (exc?.tipo === "bloqueado")           estado = "bloqueado"
      else if (exc?.tipo === "disponible")     estado = "disponible"
      else if (diasHabilitadosSet.has(dowKey)) estado = "disponible"
      else                                     estado = "inactivo"

      arr.push({ date: d, fecha: f, exc, enMes, estado })
    }
    return arr
  }, [desde, excByFecha, diasHabilitadosSet, cursor])

  // ─── Mini-stats (calculadas sobre el mes visible) ──────────────
  const stats = useMemo(() => {
    const hoy = new Date()
    const enMes = dias.filter(d => d.enMes)
    const futuros = enMes.filter(d => d.date >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))
    return {
      diasHabilitados:    diasHabilitadosSet.size,
      diasDisponibles:    enMes.filter(d => d.estado === 'disponible').length,
      diasBloqueados:     enMes.filter(d => d.estado === 'bloqueado').length,
      excepcionesActivas: enMes.filter(d => d.exc).length,
      proximaDisponible:  futuros.find(d => d.estado === 'disponible')?.date ?? null,
    }
  }, [dias, diasHabilitadosSet])

  const colorEstado = (estado) => {
    if (estado === "disponible") return { bg: "rgba(34,197,94,.16)",  text: "#4ade80", border: "rgba(34,197,94,.4)",  dot: "#22C55E" }
    if (estado === "bloqueado")  return { bg: "rgba(239,68,68,.14)",  text: "#f87171", border: "rgba(239,68,68,.4)",  dot: "#ef4444" }
    return { bg: "rgba(255,255,255,.02)", text: D.muted, border: D.border, dot: D.muted }
  }

  const clickDia = (d) => {
    if (!rangeMode) {
      setExcepcionModal({ fecha: d.fecha, exc: d.exc, estado: d.estado })
      return
    }
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(d.fecha); setRangeEnd(null); setBulkOpen(false)
    } else {
      setRangeEnd(d.fecha); setBulkOpen(true)
    }
  }

  const aplicarRango = (tipo, extras = {}) => {
    if (!rangoOrdenado) return
    bulkExcepciones.mutate(
      { desde: rangoOrdenado[0], hasta: rangoOrdenado[1], tipo, ...extras },
      { onSuccess: () => limpiarRango() }
    )
  }

  const hoy = ymd(new Date())
  const wrapperStyle = embedded
    ? { display: 'flex', flexDirection: 'column', gap: 18 }
    : { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }

  return (
    <div style={wrapperStyle}>
      {/* ═══ HEADER (solo página completa) ═══ */}
      {!embedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `linear-gradient(135deg, ${D.primary}, #16a34a)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 24px ${D.primary}40`,
          }}>
            <CalendarDays size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: D.text, fontFamily: "'Fira Code', monospace", letterSpacing: '-0.02em' }}>
              Calendario de reservas
            </h1>
            <p style={{ margin: '4px 0 0', color: D.muted, fontSize: 13 }}>
              Configura qué días aceptas reservas y bloquea fechas puntuales
            </p>
          </div>
        </div>
      )}

      {/* ═══ BENTO MINI-STATS ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
      }}>
        <StatCard
          D={D}
          icon={CheckCircle2}
          label="Días recurrentes"
          value={`${stats.diasHabilitados}`}
          unit="/ 7"
          color="#22C55E"
          glow="rgba(34,197,94,0.18)"
        />
        <StatCard
          D={D}
          icon={Sparkles}
          label="Disponibles este mes"
          value={`${stats.diasDisponibles}`}
          color="#4ade80"
          glow="rgba(74,222,128,0.16)"
        />
        <StatCard
          D={D}
          icon={Ban}
          label="Bloqueados este mes"
          value={`${stats.diasBloqueados}`}
          color="#f87171"
          glow="rgba(239,68,68,0.14)"
        />
        <StatCard
          D={D}
          icon={CalendarRange}
          label="Excepciones activas"
          value={`${stats.excepcionesActivas}`}
          color="#fbbf24"
          glow="rgba(251,191,36,0.14)"
        />
      </div>

      {/* ═══ DÍAS RECURRENTES (chips compactos) ═══ */}
      <div className="glass" style={{
        borderRadius: 14, padding: 18,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <CalendarDays size={16} style={{ color: D.primary }} />
          <h3 style={{ margin: 0, color: D.text, fontSize: 14, fontWeight: 700 }}>Días recurrentes</h3>
          <span style={{ fontSize: 11, color: D.muted, marginLeft: 'auto' }}>Se repiten cada semana</span>
        </div>
        <p style={{ fontSize: 12, color: D.muted, margin: '0 0 12px' }}>
          Selecciona los días en que aceptas reservas por defecto. Horario base: 08:00 – 18:00.
        </p>
        {loadingDias ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {DIAS_SEMANA.map(d => (
              <div key={d.key} className="np-skeleton-green" style={{ width: 56, height: 36, borderRadius: 10 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DIAS_SEMANA.map(d => {
              const activo = diasHabilitadosSet.has(d.key)
              return (
                <motion.button
                  key={d.key}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleDia(d.key)}
                  disabled={guardarDia.isPending || borrarDia.isPending}
                  className="np-focus-ring"
                  style={{
                    padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    border: `1.5px solid ${activo ? "rgba(34,197,94,.45)" : D.border}`,
                    background: activo ? "rgba(34,197,94,.16)" : "transparent",
                    color: activo ? "#4ade80" : D.muted,
                    display: "flex", alignItems: "center", gap: 6,
                    boxShadow: activo ? '0 0 0 1px rgba(34,197,94,0.15), 0 4px 12px rgba(34,197,94,0.12)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                  {activo ? <Check size={14} /> : <Plus size={14} />}
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: "'Fira Code', monospace", fontWeight: 700 }}>{d.short}</span>
                    <span style={{ fontSize: 12, opacity: 0.85 }}>{d.label.slice(1)}</span>
                  </span>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══ HEADER MES + RANGO TOGGLE ═══ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            aria-label="Mes anterior"
            className="np-focus-ring"
            style={{
              width: 36, height: 36, background: D.card, border: `1px solid ${D.border}`,
              borderRadius: 10, cursor: "pointer", color: D.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = D.primary; e.currentTarget.style.color = D.primary }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.text }}>
            <ChevronLeft size={18} />
          </button>
          <h2 style={{
            margin: 0, color: D.text, fontSize: 16, fontWeight: 700,
            fontFamily: "'Fira Code', monospace", letterSpacing: '-0.02em',
            minWidth: 180, textAlign: 'center',
          }}>
            {NOMBRE_MES[cursor.getMonth()]}{' '}
            <span style={{ color: D.muted, fontWeight: 500 }}>{cursor.getFullYear()}</span>
          </h2>
          <button
            onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            aria-label="Mes siguiente"
            className="np-focus-ring"
            style={{
              width: 36, height: 36, background: D.card, border: `1px solid ${D.border}`,
              borderRadius: 10, cursor: "pointer", color: D.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = D.primary; e.currentTarget.style.color = D.primary }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.text }}>
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            className="np-focus-ring"
            style={{
              marginLeft: 4,
              padding: '6px 12px', background: 'transparent', border: `1px solid ${D.border}`,
              borderRadius: 10, color: D.muted, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = D.primary; e.currentTarget.style.borderColor = `${D.primary}50` }}
            onMouseLeave={e => { e.currentTarget.style.color = D.muted; e.currentTarget.style.borderColor = D.border }}>
            Hoy
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => rangeMode ? salirRange() : setRangeMode(true)}
          className="np-focus-ring"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: `1.5px solid ${rangeMode ? D.primary : D.border}`,
            background: rangeMode ? `${D.primary}18` : D.card,
            color: rangeMode ? D.primary : D.text,
            boxShadow: rangeMode ? `0 0 0 3px ${D.primary}15` : 'none',
            transition: 'all 0.2s',
          }}>
          <MousePointerSquareDashed size={14} />
          {rangeMode ? "Salir de selección" : "Seleccionar rango"}
        </motion.button>
      </div>

      {/* Hint del modo rango */}
      <AnimatePresence>
        {rangeMode && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            style={{
              padding: '10px 14px',
              background: `${D.primary}10`,
              border: `1px dashed ${D.primary}40`,
              borderRadius: 10,
              color: D.primary, fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
            <Sparkles size={14} />
            {!rangeStart && "Click en el día de inicio del rango"}
            {rangeStart && !rangeEnd && `Inicio: ${rangeStart} — ahora click en el día final`}
            {rangeStart && rangeEnd && rangoOrdenado && `Rango seleccionado: ${rangoOrdenado[0]} → ${rangoOrdenado[1]}`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ GRID MENSUAL ═══ */}
      <div className="glass" style={{
        borderRadius: 14, padding: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}>
        {/* Encabezado días semana */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 10 }}>
          {DIAS_SEMANA.map((d) => (
            <div key={d.key} style={{
              textAlign: "center", color: D.muted, fontSize: 11, fontWeight: 700,
              padding: "6px 0", letterSpacing: '0.06em',
              fontFamily: "'Fira Code', monospace",
            }}>
              {d.short}
            </div>
          ))}
        </div>

        {/* Días */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {dias.map((d, i) => {
            const c = colorEstado(d.estado)
            const esHoy = d.fecha === hoy
            const selec = enRango(d.fecha)
            const borderColor = selec ? D.primary : esHoy ? D.primary : c.border
            const borderWidth = selec || esHoy ? '2px' : '1.5px'

            return (
              <motion.button
                key={i}
                whileHover={d.enMes ? { y: -2, scale: 1.04 } : {}}
                whileTap={d.enMes ? { scale: 0.96 } : {}}
                onClick={() => clickDia(d)}
                className="np-focus-ring"
                style={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  border: `${borderWidth} solid ${borderColor}`,
                  borderRadius: 10,
                  background: selec ? `${D.primary}25` : c.bg,
                  color: selec ? D.primary : c.text,
                  fontWeight: esHoy || selec ? 800 : 600,
                  fontSize: 13,
                  fontFamily: "'Fira Code', monospace",
                  cursor: d.enMes ? "pointer" : "default",
                  opacity: d.enMes ? 1 : 0.32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: selec
                    ? `0 0 0 3px ${D.primary}20, 0 4px 12px ${D.primary}30`
                    : esHoy
                      ? `0 0 0 2px ${D.primary}25`
                      : "none",
                  transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
                }}>
                <span>{d.date.getDate()}</span>

                {/* Indicador "hoy" */}
                {esHoy && !d.exc && (
                  <span style={{
                    position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: '50%', background: D.primary,
                    boxShadow: `0 0 8px ${D.primary}`,
                  }} />
                )}

                {/* Marcador de excepción puntual */}
                {d.exc && (
                  <span style={{
                    position: "absolute", top: 4, right: 4,
                    width: 7, height: 7, borderRadius: "50%",
                    background: selec ? D.primary : c.dot,
                    boxShadow: `0 0 6px ${selec ? D.primary : c.dot}`,
                    border: `1.5px solid ${D.bg}`,
                  }} />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Leyenda */}
        <div style={{
          display: "flex", gap: 16, marginTop: 14, fontSize: 11, color: D.muted,
          flexWrap: "wrap", paddingTop: 12, borderTop: `1px solid ${D.border}`,
        }}>
          <Legend dot="#22C55E" label="Disponible" />
          <Legend dot="#ef4444" label="Bloqueado" />
          <Legend dot={D.muted} label="Inactivo" />
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: D.primary, boxShadow: `0 0 6px ${D.primary}`,
            }} />
            Excepción puntual
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 'auto' }}>
            <span style={{
              width: 12, height: 12, borderRadius: 4,
              border: `2px solid ${D.primary}`, boxShadow: `0 0 0 2px ${D.primary}25`,
            }} />
            Hoy
          </span>
        </div>
      </div>

      {/* Modales */}
      <AnimatePresence>
        {bulkOpen && rangoOrdenado && (
          <BulkRangoModal
            D={D}
            desde={rangoOrdenado[0]}
            hasta={rangoOrdenado[1]}
            loading={bulkExcepciones.isPending}
            onClose={() => setBulkOpen(false)}
            onBlock={(motivo) => aplicarRango("bloqueado", { motivo: motivo || null })}
            onAllow={(cap) => aplicarRango("disponible", { capacidad_max: cap ? parseInt(cap, 10) : null })}
            onClear={() => aplicarRango("limpiar")}
          />
        )}

        {excepcionModal && (
          <ExcepcionModal
            D={D}
            fecha={excepcionModal.fecha}
            excepcionActual={excepcionModal.exc}
            estadoActual={excepcionModal.estado}
            onClose={() => setExcepcionModal(null)}
            onBlock={(motivo) => {
              guardarExcepcion.mutate({ fecha: excepcionModal.fecha, tipo: "bloqueado", motivo },
                { onSuccess: () => { setExcepcionModal(null); refetchExc() } })
            }}
            onAllow={(capacidad_max) => {
              guardarExcepcion.mutate({
                fecha: excepcionModal.fecha,
                tipo: "disponible",
                capacidad_max: capacidad_max ? parseInt(capacidad_max, 10) : null,
              }, { onSuccess: () => { setExcepcionModal(null); refetchExc() } })
            }}
            onClear={() => {
              borrarExcepcion.mutate(excepcionModal.fecha,
                { onSuccess: () => { setExcepcionModal(null); refetchExc() } })
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════

function StatCard({ D, icon: Icon, label, value, unit, color, glow }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="glass np-hover"
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 12, padding: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
      }}>
      {/* Glow orb top-right */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 64, height: 64, borderRadius: '50%',
        background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, position: 'relative' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: glow, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span style={{ fontSize: 11, color: D.muted, fontWeight: 600, letterSpacing: '0.02em' }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: 24, fontWeight: 800, color: D.text,
          fontFamily: "'Fira Code', monospace",
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 12, color: D.muted, fontWeight: 600 }}>{unit}</span>
        )}
      </div>
    </motion.div>
  )
}

function Legend({ dot, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: dot, opacity: 0.55 }} />
      {label}
    </span>
  )
}

function BulkRangoModal({ D, desde, hasta, loading, onClose, onBlock, onAllow, onClear }) {
  const [motivo, setMotivo] = useState("")
  const [capMax, setCapMax] = useState("")
  const totalDias = Math.round((new Date(hasta) - new Date(desde)) / (1000 * 60 * 60 * 24)) + 1
  const inp = {
    background: D.surface, border: `1px solid ${D.border}`, color: D.text,
    borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && !loading && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.65)", backdropFilter: 'blur(8px)',
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }}
        className="glass-strong"
        style={{
          borderRadius: 16, padding: 24, width: "100%", maxWidth: 420,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${D.primary}20`, border: `1px solid ${D.primary}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CalendarRange size={18} style={{ color: D.primary }} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: D.text, fontSize: 15, fontWeight: 700 }}>
              Aplicar a {totalDias} día{totalDias !== 1 ? "s" : ""}
            </h3>
            <p style={{ color: D.muted, fontSize: 12, margin: '2px 0 0', fontFamily: "'Fira Code', monospace" }}>
              {desde} → {hasta}
            </p>
          </div>
          <button onClick={onClose} disabled={loading}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: D.muted, cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ height: 1, background: D.border, margin: '14px 0 18px' }} />

        {/* Bloquear */}
        <div style={{ marginBottom: 18 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, color: "#f87171", fontSize: 13, margin: "0 0 8px", fontWeight: 700 }}>
            <Ban size={14} /> Bloquear todo el rango
          </h4>
          <input style={inp} placeholder="Motivo (opcional, ej. vacaciones)"
                 value={motivo} onChange={e => setMotivo(e.target.value)} />
          <button onClick={() => onBlock(motivo)} disabled={loading}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 10, marginTop: 8,
              background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff",
              border: "none", fontWeight: 700, fontSize: 13,
              cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
            }}>
            Bloquear {totalDias} día{totalDias !== 1 ? "s" : ""}
          </button>
        </div>

        {/* Habilitar */}
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, color: "#4ade80", fontSize: 13, margin: "0 0 8px", fontWeight: 700 }}>
            <CheckCircle2 size={14} /> Habilitar todo el rango
          </h4>
          <input style={inp} type="number" placeholder="Cupo máximo por día (opcional)"
                 value={capMax} onChange={e => setCapMax(e.target.value)} />
          <button onClick={() => onAllow(capMax)} disabled={loading}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 10, marginTop: 8,
              background: `linear-gradient(135deg, ${D.primary}, #16a34a)`, color: "#fff",
              border: "none", fontWeight: 700, fontSize: 13,
              cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
              boxShadow: `0 4px 12px ${D.primary}40`,
            }}>
            Habilitar {totalDias} día{totalDias !== 1 ? "s" : ""}
          </button>
        </div>

        <button onClick={onClear} disabled={loading}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 10,
            background: "transparent", color: D.muted, border: `1px solid ${D.border}`,
            fontWeight: 600, fontSize: 13,
            cursor: loading ? "wait" : "pointer", marginTop: 16,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
          <Trash2 size={14} /> Quitar excepciones del rango
        </button>
      </motion.div>
    </motion.div>
  )
}

function ExcepcionModal({ D, fecha, excepcionActual, estadoActual, onClose, onBlock, onAllow, onClear }) {
  const [motivo, setMotivo] = useState(excepcionActual?.motivo ?? "")
  const [capMax, setCapMax] = useState(excepcionActual?.capacidad_max ?? "")
  const inp = {
    background: D.surface, border: `1px solid ${D.border}`, color: D.text,
    borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box",
  }

  const estadoColor = estadoActual === "disponible" ? "#4ade80"
                    : estadoActual === "bloqueado"  ? "#f87171"
                    : D.muted

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.65)", backdropFilter: 'blur(8px)',
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }}
        className="glass-strong"
        style={{
          borderRadius: 16, padding: 24, width: "100%", maxWidth: 400,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${D.primary}20`, border: `1px solid ${D.primary}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CalendarDays size={18} style={{ color: D.primary }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, color: D.text, fontSize: 15, fontWeight: 700, fontFamily: "'Fira Code', monospace" }}>
              {fecha}
            </h3>
            <p style={{ color: D.muted, fontSize: 12, margin: '2px 0 0' }}>
              Estado: <b style={{ color: estadoColor }}>{estadoActual}</b>
              {excepcionActual && " · excepción puntual"}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: D.muted, cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ height: 1, background: D.border, margin: '14px 0 18px' }} />

        {/* Bloquear */}
        <div style={{ marginBottom: 18 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, color: "#f87171", fontSize: 13, margin: "0 0 8px", fontWeight: 700 }}>
            <Ban size={14} /> Bloquear este día
          </h4>
          <input style={inp} placeholder="Motivo (opcional, ej. vacaciones)"
                 value={motivo} onChange={e => setMotivo(e.target.value)} />
          <button onClick={() => onBlock(motivo || null)}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 10, marginTop: 8,
              background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff",
              border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
            }}>
            Bloquear fecha
          </button>
        </div>

        {/* Habilitar */}
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, color: "#4ade80", fontSize: 13, margin: "0 0 8px", fontWeight: 700 }}>
            <CheckCircle2 size={14} /> Habilitar este día
          </h4>
          <p style={{ fontSize: 11, color: D.muted, margin: '0 0 6px' }}>
            Ignora la configuración semanal recurrente
          </p>
          <input style={inp} type="number" placeholder="Cupo máximo (opcional)"
                 value={capMax} onChange={e => setCapMax(e.target.value)} />
          <button onClick={() => onAllow(capMax)}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 10, marginTop: 8,
              background: `linear-gradient(135deg, ${D.primary}, #16a34a)`, color: "#fff",
              border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
              boxShadow: `0 4px 12px ${D.primary}40`,
            }}>
            Habilitar fecha
          </button>
        </div>

        {excepcionActual && (
          <button onClick={onClear}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 10,
              background: "transparent", color: D.muted, border: `1px solid ${D.border}`,
              fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 16,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            <Trash2 size={14} /> Quitar excepción
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
