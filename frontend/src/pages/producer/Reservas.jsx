"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarCheck, Clock, Check, X, User, Phone, Package,
  AlertCircle, RefreshCw, MessageSquare,
} from "lucide-react"
import api from "../../api/config/axios"
import { useTheme } from "../../contexts/ThemeContext"

const ESTADOS = [
  { key: "pendiente", label: "Pendientes", color: "#fbbf24" },
  { key: "aceptada",  label: "Aceptadas",  color: "#22c55e" },
  { key: "rechazada", label: "Rechazadas", color: "#ef4444" },
  { key: "expirada",  label: "Expiradas",  color: "#94a3b8" },
  { key: "cancelada", label: "Canceladas", color: "#94a3b8" },
]

const fmtFechaHora = (s) => {
  if (!s) return ""
  return new Date(s).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" })
}

const fmtFecha = (s) => {
  if (!s) return ""
  return new Date(`${String(s).slice(0, 10)}T00:00:00`).toLocaleDateString("es-BO", { weekday: "long", day: "2-digit", month: "long" })
}

const tiempoRestante = (expires_at) => {
  if (!expires_at) return null
  const ms = new Date(expires_at) - new Date()
  if (ms <= 0) return { texto: "Expirada", color: "#ef4444" }
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return { texto: `${mins} min`, color: mins < 30 ? "#ef4444" : "#fbbf24" }
  const hrs = Math.floor(mins / 60)
  return { texto: `${hrs} h`, color: hrs < 6 ? "#fbbf24" : "#22c55e" }
}

export default function Reservas() {
  const { D } = useTheme()
  const qc = useQueryClient()
  const [filtro,    setFiltro]    = useState("pendiente")
  const [rechazoFor, setRechazoFor] = useState(null)
  const [motivo,    setMotivo]    = useState("")

  const { data: reservas = [], isLoading, refetch } = useQuery({
    queryKey: ["reservas", "productor", filtro],
    queryFn: () => api.get("/reservas", { params: { estado: filtro } }).then(r => r.data?.data ?? []),
    refetchInterval: 30000,
  })

  const aceptar = useMutation({
    mutationFn: (id) => api.patch(`/reservas/${id}/aceptar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservas"] }),
  })
  const rechazar = useMutation({
    mutationFn: ({ id, motivo }) => api.patch(`/reservas/${id}/rechazar`, { motivo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservas"] }),
  })

  const counts = ESTADOS.reduce((acc, e) => ({ ...acc, [e.key]: 0 }), {})
  reservas.forEach(r => { counts[r.estado] = (counts[r.estado] || 0) + 1 })

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: D.text, display: "flex", alignItems: "center", gap: 10 }}>
            <CalendarCheck size={24} style={{ color: D.primary }} /> Reservas
          </h1>
          <p style={{ margin: "6px 0 0", color: D.muted, fontSize: 14 }}>
            Acepta o rechaza solicitudes. Tienes 24 h para responder antes de que expiren.
          </p>
        </div>
        <button onClick={() => refetch()}
          style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 10, padding: "9px 14px", color: D.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refrescar
        </button>
      </div>

      {/* Tabs por estado */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {ESTADOS.map(e => (
          <button key={e.key} onClick={() => setFiltro(e.key)}
            style={{
              padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: "pointer", border: `1.5px solid ${filtro === e.key ? e.color : D.border}`,
              background: filtro === e.key ? `${e.color}1f` : D.card,
              color: filtro === e.key ? e.color : D.muted,
              display: "flex", alignItems: "center", gap: 6,
            }}>
            {e.label}
            {filtro === e.key && reservas.length > 0 && (
              <span style={{ background: e.color, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                {reservas.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: D.muted }}>Cargando reservas…</div>
      ) : reservas.length === 0 ? (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 48, textAlign: "center" }}>
          <AlertCircle size={42} style={{ color: D.dim, margin: "0 auto 12px", opacity: 0.5 }} />
          <p style={{ color: D.muted, fontSize: 15, margin: 0 }}>No hay reservas {filtro}.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reservas.map(r => {
            const restante = filtro === "pendiente" ? tiempoRestante(r.expires_at) : null
            const total = r.precio_estimado ? Number(r.precio_estimado) : (r.producto_precio ? Number(r.producto_precio) * Number(r.cantidad) : null)
            return (
              <div key={r.id} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <User size={16} style={{ color: D.muted }} />
                      <span style={{ fontWeight: 700, color: D.text, fontSize: 15 }}>{r.consumidor_nombre || "Consumidor"}</span>
                      {r.consumidor_telefono && (
                        <span style={{ color: D.muted, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone size={11} /> {r.consumidor_telefono}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Package size={14} style={{ color: D.primary }} />
                      <span style={{ color: D.text, fontSize: 14 }}>
                        <b>{r.cantidad}</b> × {r.producto_nombre || "producto"}
                        {r.es_cocinado && <span style={{ color: "#fb923c", marginLeft: 6, fontSize: 11 }}>· cocinado</span>}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0", color: D.muted, fontSize: 13, textTransform: "capitalize" }}>
                      Para: <b style={{ color: D.text }}>{fmtFecha(r.fecha_reserva)}</b>
                      {r.hora_reserva && <span> · {String(r.hora_reserva).slice(0, 5)}</span>}
                    </p>
                    {r.notas && (
                      <p style={{ margin: "8px 0 0", padding: "8px 10px", background: D.background, borderRadius: 8, fontSize: 12, color: D.muted, fontStyle: "italic", display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <MessageSquare size={12} style={{ color: D.dim, flexShrink: 0, marginTop: 2 }} />
                        {r.notas}
                      </p>
                    )}
                    {r.motivo_rechazo && (
                      <p style={{ margin: "8px 0 0", color: "#ef4444", fontSize: 12 }}>
                        Motivo del rechazo: {r.motivo_rechazo}
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    {total !== null && (
                      <div>
                        <div style={{ fontSize: 11, color: D.muted }}>Estimado</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: D.text }}>Bs {total.toFixed(2)}</div>
                      </div>
                    )}
                    {restante && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: `${restante.color}1f`, color: restante.color, borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        <Clock size={11} /> {restante.texto}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 11, color: D.dim }}>
                  Solicitada: {fmtFechaHora(r.fecha_creacion)}
                </div>

                {filtro === "pendiente" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button onClick={() => aceptar.mutate(r.id)} disabled={aceptar.isPending}
                      style={{ flex: 1, background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Check size={15} /> Aceptar
                    </button>
                    <button onClick={() => { setRechazoFor(r); setMotivo("") }}
                      style={{ flex: 1, background: "rgba(239,68,68,.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, padding: "10px 0", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <X size={15} /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal rechazo */}
      {rechazoFor && (
        <div onClick={e => e.target === e.currentTarget && setRechazoFor(null)}
          style={{ position: "fixed", inset: 0, background: "#00000080", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: D.background, borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}>
            <h3 style={{ margin: "0 0 6px", color: D.text }}>Rechazar reserva</h3>
            <p style={{ margin: "0 0 14px", color: D.muted, fontSize: 13 }}>
              Reserva de <b>{rechazoFor.consumidor_nombre}</b> para el <b>{fmtFecha(rechazoFor.fecha_reserva)}</b>
            </p>
            <label style={{ fontSize: 12, color: D.muted, display: "block", marginBottom: 6 }}>Motivo (opcional, lo verá el consumidor)</label>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
              placeholder="Ej. No tengo stock para esa fecha"
              style={{ width: "100%", boxSizing: "border-box", background: D.card, border: `1px solid ${D.border}`, color: D.text, borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setRechazoFor(null)}
                style={{ flex: 1, background: "transparent", color: D.muted, border: `1px solid ${D.border}`, borderRadius: 10, padding: "10px 0", fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={() => rechazar.mutate({ id: rechazoFor.id, motivo: motivo || null }, {
                onSuccess: () => setRechazoFor(null),
              })} disabled={rechazar.isPending}
                style={{ flex: 1, background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 700, cursor: "pointer" }}>
                {rechazar.isPending ? "Enviando…" : "Confirmar rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
