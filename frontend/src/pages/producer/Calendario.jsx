"use client"
import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X,
  AlertCircle, Trash2, Clock, Plus, RefreshCw, MousePointerSquareDashed,
} from "lucide-react"
import api from "../../api/config/axios"
import { useTheme } from "../../contexts/ThemeContext"

const DIAS_SEMANA = [
  { key: "lunes",     label: "Lunes" },
  { key: "martes",    label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves",    label: "Jueves" },
  { key: "viernes",   label: "Viernes" },
  { key: "sabado",    label: "Sábado" },
  { key: "domingo",   label: "Domingo" },
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

export default function Calendario() {
  const { D, isDark } = useTheme()
  const qc = useQueryClient()

  const [cursor, setCursor] = useState(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })
  const [excepcionModal, setExcepcionModal] = useState(null) // { fecha }

  // Selección de rango: rangeMode activo, primer click setea rangeStart, segundo rangeEnd.
  const [rangeMode,  setRangeMode]  = useState(false)
  const [rangeStart, setRangeStart] = useState(null) // ymd
  const [rangeEnd,   setRangeEnd]   = useState(null) // ymd
  const [bulkOpen,   setBulkOpen]   = useState(false)

  // Rango del mes visible (incluye cuadrícula con padding semanas previa/siguiente)
  const desde = useMemo(() => {
    const d = new Date(cursor)
    d.setDate(1)
    // retrocede al lunes (getDay: 1=lunes; 0=domingo)
    const dow = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - dow)
    return d
  }, [cursor])

  const hasta = useMemo(() => {
    const d = new Date(desde)
    d.setDate(d.getDate() + 41) // 6 semanas
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

  // Devuelve [inicio, fin] ordenados, o null si no hay selección completa.
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
    if (ya) {
      borrarDia.mutate(diaKey)
    } else {
      guardarDia.mutate({ dia: diaKey, hora_inicio: "08:00", hora_fin: "18:00", venta_directa: true })
    }
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

      let estado // 'disponible' | 'bloqueado' | 'inactivo'
      if (exc?.tipo === "bloqueado")        estado = "bloqueado"
      else if (exc?.tipo === "disponible")  estado = "disponible"
      else if (diasHabilitadosSet.has(dowKey)) estado = "disponible"
      else estado = "inactivo"

      arr.push({ date: d, fecha: f, exc, enMes, estado })
    }
    return arr
  }, [desde, excByFecha, diasHabilitadosSet, cursor])

  const colorEstado = (estado) => {
    if (estado === "disponible") return { bg: "rgba(34,197,94,.18)",  text: "#22c55e", border: "rgba(34,197,94,.4)" }
    if (estado === "bloqueado")  return { bg: "rgba(239,68,68,.18)",  text: "#ef4444", border: "rgba(239,68,68,.4)" }
    return { bg: D.card,                                   text: D.muted,    border: D.border }
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

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: D.text, display: "flex", alignItems: "center", gap: 10 }}>
          <CalendarIcon size={24} style={{ color: D.primary }} /> Calendario de reservas
        </h1>
        <p style={{ margin: "6px 0 0", color: D.muted, fontSize: 14 }}>
          Configura qué días aceptas reservas. Las fechas en rojo están bloqueadas, las verdes disponibles.
        </p>
      </div>

      {/* Días de la semana habilitados */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 18, marginBottom: 22 }}>
        <h3 style={{ margin: "0 0 12px", color: D.text, fontSize: 15 }}>Días habilitados (semanal)</h3>
        {loadingDias ? (
          <p style={{ color: D.muted, fontSize: 13 }}>Cargando…</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {DIAS_SEMANA.map(d => {
              const activo = diasHabilitadosSet.has(d.key)
              return (
                <button key={d.key} onClick={() => toggleDia(d.key)}
                  disabled={guardarDia.isPending || borrarDia.isPending}
                  style={{
                    padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", border: `1.5px solid ${activo ? "rgba(34,197,94,.4)" : D.border}`,
                    background: activo ? "rgba(34,197,94,.18)" : D.card,
                    color: activo ? "#22c55e" : D.muted,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                  {activo ? <Check size={14} /> : <Plus size={14} />}
                  {d.label}
                </button>
              )
            })}
          </div>
        )}
        <p style={{ fontSize: 12, color: D.muted, margin: "10px 0 0" }}>
          Por defecto: 08:00 – 18:00. Para personalizar horarios usa la API directa.
        </p>
      </div>

      {/* Header del mes + toggle rango */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 10, padding: 8, cursor: "pointer", color: D.text }}>
            <ChevronLeft size={18} />
          </button>
          <h2 style={{ margin: 0, color: D.text, fontSize: 18 }}>
            {NOMBRE_MES[cursor.getMonth()]} {cursor.getFullYear()}
          </h2>
          <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 10, padding: 8, cursor: "pointer", color: D.text }}>
            <ChevronRight size={18} />
          </button>
        </div>
        <button onClick={() => rangeMode ? salirRange() : setRangeMode(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: `1.5px solid ${rangeMode ? "rgba(59,130,246,.5)" : D.border}`,
            background: rangeMode ? "rgba(59,130,246,.15)" : D.card,
            color: rangeMode ? "#3b82f6" : D.text,
          }}>
          <MousePointerSquareDashed size={14} />
          {rangeMode ? "Salir de selección" : "Seleccionar rango"}
        </button>
      </div>

      {rangeMode && (
        <p style={{ margin: "0 0 10px", color: D.muted, fontSize: 12 }}>
          {!rangeStart && "Haz click en el día de inicio del rango."}
          {rangeStart && !rangeEnd && `Inicio: ${rangeStart}. Ahora haz click en el día final.`}
          {rangeStart && rangeEnd && `Rango: ${rangoOrdenado[0]} → ${rangoOrdenado[1]}`}
        </p>
      )}

      {/* Grid de días */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
          {["L","M","X","J","V","S","D"].map((l, i) => (
            <div key={i} style={{ textAlign: "center", color: D.muted, fontSize: 11, fontWeight: 700, padding: "6px 0" }}>{l}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {dias.map((d, i) => {
            const c = colorEstado(d.estado)
            const esHoy = d.fecha === hoy
            const selec = enRango(d.fecha)
            return (
              <button key={i} onClick={() => clickDia(d)}
                style={{
                  position: "relative", aspectRatio: "1 / 1",
                  border: `1.5px solid ${selec ? "#3b82f6" : esHoy ? D.primary : c.border}`,
                  borderRadius: 10,
                  background: selec ? "rgba(59,130,246,.25)" : c.bg,
                  color: selec ? "#3b82f6" : c.text,
                  fontWeight: esHoy || selec ? 800 : 600, fontSize: 13, cursor: "pointer",
                  opacity: d.enMes ? 1 : 0.35,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: selec ? "0 0 0 2px rgba(59,130,246,.25) inset" : "none",
                }}>
                {d.date.getDate()}
                {d.exc && (
                  <span style={{ position: "absolute", top: 3, right: 5, width: 6, height: 6, borderRadius: "50%", background: selec ? "#3b82f6" : c.text }} />
                )}
              </button>
            )
          })}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 11, color: D.muted, flexWrap: "wrap" }}>
          <Legend color="#22c55e" label="Disponible" />
          <Legend color="#ef4444" label="Bloqueado" />
          <Legend color={D.muted}  label="Inactivo (día no habilitado)" />
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} /> Excepción puntual
          </span>
        </div>
      </div>

      {/* Modal acciones bulk sobre el rango */}
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

      {/* Modal de excepción */}
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
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color, opacity: .4 }} />
      {label}
    </span>
  )
}

function BulkRangoModal({ D, desde, hasta, loading, onClose, onBlock, onAllow, onClear }) {
  const [motivo, setMotivo] = useState("")
  const [capMax, setCapMax] = useState("")
  const totalDias = Math.round((new Date(hasta) - new Date(desde)) / (1000 * 60 * 60 * 24)) + 1
  const inp = { background: D.card, border: `1px solid ${D.border}`, color: D.text, borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }

  return (
    <div onClick={e => e.target === e.currentTarget && !loading && onClose()}
      style={{ position: "fixed", inset: 0, background: "#00000080", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: D.background, borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}>
        <h3 style={{ margin: 0, color: D.text, display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarIcon size={18} style={{ color: "#3b82f6" }} /> Aplicar a {totalDias} día{totalDias !== 1 ? "s" : ""}
        </h3>
        <p style={{ color: D.muted, fontSize: 13, margin: "6px 0 16px" }}>
          {desde} → {hasta}
        </p>

        <h4 style={{ color: "#ef4444", fontSize: 13, margin: "0 0 6px" }}>🚫 Bloquear todo el rango</h4>
        <input style={{ ...inp, marginBottom: 8 }} placeholder="Motivo (opcional, ej. vacaciones)"
               value={motivo} onChange={e => setMotivo(e.target.value)} />
        <button onClick={() => onBlock(motivo)} disabled={loading}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: "#ef4444", color: "#fff", border: "none", fontWeight: 600, cursor: loading ? "wait" : "pointer", marginBottom: 16, opacity: loading ? 0.7 : 1 }}>
          Bloquear {totalDias} día{totalDias !== 1 ? "s" : ""}
        </button>

        <h4 style={{ color: "#22c55e", fontSize: 13, margin: "0 0 6px" }}>✅ Habilitar todo el rango</h4>
        <input style={{ ...inp, marginBottom: 8 }} type="number" placeholder="Cupo máximo por día (opcional)"
               value={capMax} onChange={e => setCapMax(e.target.value)} />
        <button onClick={() => onAllow(capMax)} disabled={loading}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: "#22c55e", color: "#fff", border: "none", fontWeight: 600, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
          Habilitar {totalDias} día{totalDias !== 1 ? "s" : ""}
        </button>

        <button onClick={onClear} disabled={loading}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: "transparent", color: D.muted, border: `1px solid ${D.border}`, fontWeight: 600, cursor: loading ? "wait" : "pointer", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Trash2 size={14} /> Quitar excepciones del rango
        </button>

        <button onClick={onClose} disabled={loading}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: "transparent", color: D.muted, border: "none", cursor: loading ? "wait" : "pointer", marginTop: 6, fontSize: 13 }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function ExcepcionModal({ D, fecha, excepcionActual, estadoActual, onClose, onBlock, onAllow, onClear }) {
  const [motivo, setMotivo]       = useState(excepcionActual?.motivo ?? "")
  const [capMax, setCapMax]       = useState(excepcionActual?.capacidad_max ?? "")
  const inp = { background: D.card, border: `1px solid ${D.border}`, color: D.text, borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "#00000080", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: D.background, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380 }}>
        <h3 style={{ margin: 0, color: D.text, display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarIcon size={18} style={{ color: D.primary }} /> {fecha}
        </h3>
        <p style={{ color: D.muted, fontSize: 13, margin: "6px 0 14px" }}>
          Estado actual: <b style={{ color: estadoActual === "disponible" ? "#22c55e" : estadoActual === "bloqueado" ? "#ef4444" : D.muted }}>{estadoActual}</b>
          {excepcionActual && " · excepción puntual"}
        </p>

        <h4 style={{ color: "#ef4444", fontSize: 13, margin: "0 0 6px" }}>🚫 Bloquear este día</h4>
        <input style={{ ...inp, marginBottom: 8 }} placeholder="Motivo (opcional, ej. vacaciones)"
               value={motivo} onChange={e => setMotivo(e.target.value)} />
        <button onClick={() => onBlock(motivo || null)}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: "#ef4444", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>
          Bloquear fecha
        </button>

        <h4 style={{ color: "#22c55e", fontSize: 13, margin: "0 0 6px" }}>✅ Habilitar este día (ignora días semanales)</h4>
        <input style={{ ...inp, marginBottom: 8 }} type="number" placeholder="Cupo máximo (opcional)"
               value={capMax} onChange={e => setCapMax(e.target.value)} />
        <button onClick={() => onAllow(capMax)}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: "#22c55e", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
          Habilitar fecha
        </button>

        {excepcionActual && (
          <button onClick={onClear}
            style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: "transparent", color: D.muted, border: `1px solid ${D.border}`, fontWeight: 600, cursor: "pointer", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Trash2 size={14} /> Quitar excepción
          </button>
        )}

        <button onClick={onClose}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: "transparent", color: D.muted, border: "none", cursor: "pointer", marginTop: 6, fontSize: 13 }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
