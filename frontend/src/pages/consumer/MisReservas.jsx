"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarCheck, Clock, CheckCircle, XCircle, Package, X,
  AlertCircle, RefreshCw, User, MessageSquare, Hourglass,
} from "lucide-react"
import api from "../../api/config/axios"
import { useTheme } from "../../contexts/ThemeContext"

const ESTADOS = [
  { key: "pendiente", label: "Pendientes", color: "#fbbf24", icon: Hourglass },
  { key: "aceptada",  label: "Aceptadas",  color: "#22c55e", icon: CheckCircle },
  { key: "rechazada", label: "Rechazadas", color: "#ef4444", icon: XCircle },
  { key: "expirada",  label: "Expiradas",  color: "#94a3b8", icon: Clock },
  { key: "cancelada", label: "Canceladas", color: "#94a3b8", icon: X },
]

const fmtFecha = (s) => {
  if (!s) return ""
  return new Date(`${String(s).slice(0, 10)}T00:00:00`).toLocaleDateString("es-BO", {
    weekday: "long", day: "2-digit", month: "long",
  })
}

const fmtFechaHora = (s) => {
  if (!s) return ""
  return new Date(s).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" })
}

export default function MisReservas() {
  const { D } = useTheme()
  const qc = useQueryClient()
  const [filtro, setFiltro] = useState("pendiente")

  const { data: reservas = [], isLoading, refetch } = useQuery({
    queryKey: ["reservas", "consumidor", filtro],
    queryFn: () => api.get("/reservas", { params: { estado: filtro } }).then(r => r.data?.data ?? []),
    refetchInterval: 30000,
  })

  const cancelar = useMutation({
    mutationFn: (id) => api.patch(`/reservas/${id}/cancelar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservas"] }),
  })

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: D.text, display: "flex", alignItems: "center", gap: 10 }}>
            <CalendarCheck size={24} style={{ color: D.primary }} /> Mis reservas
          </h1>
          <p style={{ margin: "6px 0 0", color: D.muted, fontSize: 14 }}>
            Aquí ves el estado de tus solicitudes. El productor tiene 24 h para responder.
          </p>
        </div>
        <button onClick={() => refetch()}
          style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 10, padding: "9px 14px", color: D.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refrescar
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {ESTADOS.map(e => {
          const Icon = e.icon
          return (
            <button key={e.key} onClick={() => setFiltro(e.key)}
              style={{
                padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: "pointer", border: `1.5px solid ${filtro === e.key ? e.color : D.border}`,
                background: filtro === e.key ? `${e.color}1f` : D.card,
                color: filtro === e.key ? e.color : D.muted,
                display: "flex", alignItems: "center", gap: 6,
              }}>
              <Icon size={13} /> {e.label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: D.muted }}>Cargando reservas…</div>
      ) : reservas.length === 0 ? (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 48, textAlign: "center" }}>
          <AlertCircle size={42} style={{ color: D.dim, margin: "0 auto 12px", opacity: 0.5 }} />
          <p style={{ color: D.muted, fontSize: 15, margin: 0 }}>No tienes reservas {filtro}.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reservas.map(r => {
            const total = r.precio_estimado ? Number(r.precio_estimado) :
              (r.producto_precio ? Number(r.producto_precio) * Number(r.cantidad) : null)
            const conf = ESTADOS.find(e => e.key === r.estado)
            const StatusIcon = conf?.icon || Clock
            return (
              <div key={r.id} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", background: `${conf?.color}1f`, color: conf?.color, borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        <StatusIcon size={11} /> {conf?.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <User size={14} style={{ color: D.muted }} />
                      <span style={{ color: D.muted, fontSize: 13 }}>
                        Productor: <b style={{ color: D.text }}>{r.productor_nombre || "—"}</b>
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Package size={14} style={{ color: D.primary }} />
                      <span style={{ color: D.text, fontSize: 14 }}>
                        <b>{r.cantidad}</b> × {r.producto_nombre || "producto"}
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
                        Motivo: {r.motivo_rechazo}
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    {total !== null && (
                      <>
                        <div style={{ fontSize: 11, color: D.muted }}>{r.estado === "aceptada" ? "Estimado final" : "Estimado"}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: D.text }}>Bs {total.toFixed(2)}</div>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 11, color: D.dim }}>
                  Solicitada: {fmtFechaHora(r.fecha_creacion)}
                </div>

                {r.pedido_codigo_retiro && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: D.muted }}>Código de retiro</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#22c55e', letterSpacing: '0.05em' }}>{r.pedido_codigo_retiro}</div>
                    </div>
                    {r.pedido_estado && (
                      <span style={{ fontSize: 11, padding: '3px 10px', background: '#22c55e', color: '#fff', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                        {String(r.pedido_estado).replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                )}

                {r.estado === "pendiente" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => {
                        if (window.confirm("¿Seguro que quieres cancelar esta reserva?")) cancelar.mutate(r.id)
                      }}
                      disabled={cancelar.isPending}
                      style={{ background: "rgba(239,68,68,.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, padding: "8px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      <X size={13} /> Cancelar reserva
                    </button>
                  </div>
                )}

                {r.estado === "aceptada" && r.pedido_codigo_retiro && (
                  <p style={{ marginTop: 10, fontSize: 11, color: D.muted, fontStyle: "italic" }}>
                    La reserva ya fue aceptada y se creó tu pedido. Si necesitas cancelarlo, hazlo desde Mis Pedidos.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
