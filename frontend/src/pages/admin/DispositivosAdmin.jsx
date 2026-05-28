"use client"
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Cpu, Plus, Trash2, Edit2, Copy, Check, X, AlertCircle,
  Search, RefreshCw, Link2, Unlink, Power, ToggleLeft, ToggleRight,
} from "lucide-react"
import axios from "../../api/config/axios"
import { useTheme } from "../../contexts/ThemeContext"

const DispositivosAdmin = () => {
  const { D } = useTheme()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filterEstado, setFilterEstado] = useState("todos") // todos | libres | asignados | inactivos

  const [adding, setAdding] = useState(false)
  const [newCodigo, setNewCodigo] = useState("")
  const [newNotas, setNewNotas] = useState("")

  const [editId, setEditId] = useState(null)
  const [editNotas, setEditNotas] = useState("")

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      setLoading(true)
      const res = await axios.get("/dispositivos")
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setItems(data)
    } catch (err) {
      notify(err.response?.data?.message || "Error cargando dispositivos", "error")
    } finally {
      setLoading(false)
    }
  }

  const notify = (msg, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = async () => {
    try {
      const payload = {}
      if (newCodigo.trim()) payload.codigo = newCodigo.trim().toUpperCase()
      if (newNotas.trim())  payload.notas  = newNotas.trim()
      const res = await axios.post("/dispositivos", payload)
      const creado = res.data?.data || res.data
      setItems(prev => [creado, ...prev])
      setAdding(false); setNewCodigo(""); setNewNotas("")
      notify(`Código creado: ${creado.codigo}`)
    } catch (err) {
      notify(err.response?.data?.message || "Error al crear", "error")
    }
  }

  const handleSaveEdit = async (id) => {
    try {
      const res = await axios.patch(`/dispositivos/${id}`, { notas: editNotas.trim() || null })
      const upd = res.data?.data || res.data
      setItems(prev => prev.map(d => d.id === id ? { ...d, ...upd } : d))
      setEditId(null); setEditNotas("")
      notify("Notas actualizadas")
    } catch (err) {
      notify(err.response?.data?.message || "Error al actualizar", "error")
    }
  }

  const handleToggleActivo = async (d) => {
    try {
      const res = await axios.patch(`/dispositivos/${d.id}`, { activo: !d.activo })
      const upd = res.data?.data || res.data
      setItems(prev => prev.map(x => x.id === d.id ? { ...x, ...upd } : x))
      notify(upd.activo ? "Dispositivo activado" : "Dispositivo desactivado")
    } catch (err) {
      notify(err.response?.data?.message || "Error", "error")
    }
  }

  const handleLiberar = async (d) => {
    try {
      const res = await axios.post(`/dispositivos/${d.id}/liberar`)
      const upd = res.data?.data || res.data
      setItems(prev => prev.map(x => x.id === d.id ? {
        ...x,
        asignado_a_laguna_id: null,
        fecha_asignacion:     null,
        laguna_nombre:        null,
        productor_nombre:     null,
        productor_email:      null,
        ...upd,
      } : x))
      notify("Dispositivo liberado")
    } catch (err) {
      notify(err.response?.data?.message || "Error al liberar", "error")
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/dispositivos/${id}`)
      setItems(prev => prev.filter(d => d.id !== id))
      setConfirmDelete(null)
      notify("Dispositivo eliminado")
    } catch (err) {
      notify(err.response?.data?.message || "No se pudo eliminar", "error")
      setConfirmDelete(null)
    }
  }

  const copiar = async (codigo, id) => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {/* noop */}
  }

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(d => {
      if (filterEstado === "libres"     && d.asignado_a_laguna_id)  return false
      if (filterEstado === "asignados"  && !d.asignado_a_laguna_id) return false
      if (filterEstado === "inactivos"  && d.activo)                return false
      if (!q) return true
      return (
        d.codigo?.toLowerCase().includes(q) ||
        d.notas?.toLowerCase().includes(q) ||
        d.laguna_nombre?.toLowerCase().includes(q) ||
        d.productor_nombre?.toLowerCase().includes(q) ||
        d.productor_email?.toLowerCase().includes(q)
      )
    })
  }, [items, query, filterEstado])

  const stats = useMemo(() => ({
    total:     items.length,
    libres:    items.filter(d => !d.asignado_a_laguna_id && d.activo).length,
    asignados: items.filter(d => d.asignado_a_laguna_id).length,
    inactivos: items.filter(d => !d.activo).length,
  }), [items])

  return (
    <div style={{ padding: 24, color: D.text }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: 10, borderRadius: 12,
            background: 'linear-gradient(135deg,#06b6d4,#0891b2)',
            boxShadow: '0 0 18px rgba(6,182,212,0.35)',
          }}>
            <Cpu size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Dispositivos IoT
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: D.muted }}>
              Genera códigos para los sensores y entrégaselos a los productores
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={cargar}
            style={btnSecundario(D)}>
            <RefreshCw size={16} /> Recargar
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setAdding(true)}
            style={btnPrimario(D)}>
            <Plus size={16} /> Nuevo código
          </motion.button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
        <StatBox label="Total"      value={stats.total}     color="#94a3b8" D={D} />
        <StatBox label="Libres"     value={stats.libres}    color="#22C55E" D={D} />
        <StatBox label="Asignados"  value={stats.asignados} color="#06b6d4" D={D} />
        <StatBox label="Inactivos"  value={stats.inactivos} color="#ef4444" D={D} />
      </div>

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10,
          border: `1px solid ${D.border}`, background: D.card, flex: '1 1 240px',
        }}>
          <Search size={16} color={D.muted} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por código, productor, laguna…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: D.text, fontSize: 14 }} />
        </div>
        {[
          { v: 'todos',     l: 'Todos' },
          { v: 'libres',    l: 'Libres' },
          { v: 'asignados', l: 'Asignados' },
          { v: 'inactivos', l: 'Inactivos' },
        ].map(f => (
          <button key={f.v} onClick={() => setFilterEstado(f.v)}
            style={{
              padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${filterEstado === f.v ? D.primary : D.border}`,
              background: filterEstado === f.v ? 'rgba(34,197,94,0.12)' : D.card,
              color: filterEstado === f.v ? D.primary : D.muted,
              transition: 'all 0.15s',
            }}>
            {f.l}
          </button>
        ))}
      </div>

      {/* ── Form crear ──────────────────────────────────────────── */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{
              padding: 16, borderRadius: 14, marginBottom: 14,
              border: `1px solid ${D.border}`, background: D.card,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Plus size={16} color={D.primary} />
              <strong style={{ fontSize: 14 }}>Nuevo dispositivo</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, alignItems: 'center' }}>
              <input value={newCodigo} onChange={e => setNewCodigo(e.target.value.toUpperCase())}
                placeholder="Código (vacío = auto)"
                style={inputStyle(D)} />
              <input value={newNotas} onChange={e => setNewNotas(e.target.value)}
                placeholder="Notas (ej. 'Sensor de Juan Pérez')"
                style={inputStyle(D)} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleCreate} style={btnPrimario(D)}><Check size={16} /></button>
                <button onClick={() => { setAdding(false); setNewCodigo(""); setNewNotas("") }} style={btnSecundario(D)}><X size={16} /></button>
              </div>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: D.muted }}>
              Si dejas el código vacío, se genera uno tipo <code>NP-A1B2C3</code> automáticamente.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lista ───────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: D.muted }}>
          <RefreshCw size={28} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 10 }}>Cargando…</p>
          <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 50, borderRadius: 14,
          border: `1px dashed ${D.border}`, color: D.muted,
        }}>
          <Cpu size={32} style={{ opacity: 0.4 }} />
          <p style={{ marginTop: 10, fontSize: 14 }}>
            {items.length === 0 ? "Aún no hay dispositivos. Crea el primero." : "Ningún dispositivo coincide con el filtro."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrados.map(d => {
            const asignado = !!d.asignado_a_laguna_id
            const estadoColor = !d.activo ? '#ef4444' : asignado ? '#06b6d4' : '#22C55E'
            const estadoLabel = !d.activo ? 'Inactivo' : asignado ? 'Asignado' : 'Libre'

            return (
              <motion.div key={d.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: 14, borderRadius: 14,
                  border: `1px solid ${D.border}`, background: D.card,
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
                }}>
                <div style={{ minWidth: 0 }}>
                  {/* Línea 1: código + estado */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <code style={{
                      fontSize: 15, fontWeight: 700, fontFamily: "'Fira Code', monospace",
                      color: D.text, padding: '4px 10px', borderRadius: 8,
                      background: 'rgba(34,197,94,0.08)', border: `1px solid ${D.border}`,
                      letterSpacing: '0.04em',
                    }}>{d.codigo}</code>

                    <button onClick={() => copiar(d.codigo, d.id)}
                      title="Copiar código"
                      style={{
                        padding: 6, border: `1px solid ${D.border}`, borderRadius: 8,
                        background: 'transparent', cursor: 'pointer', color: D.muted,
                        display: 'flex', alignItems: 'center',
                      }}>
                      {copiedId === d.id ? <Check size={14} color={D.primary} /> : <Copy size={14} />}
                    </button>

                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: `${estadoColor}1A`, color: estadoColor,
                      border: `1px solid ${estadoColor}55`,
                    }}>
                      {estadoLabel}
                    </span>
                  </div>

                  {/* Línea 2: notas (editable) */}
                  <div style={{ marginTop: 6 }}>
                    {editId === d.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input value={editNotas} onChange={e => setEditNotas(e.target.value)}
                          placeholder="Notas"
                          style={{ ...inputStyle(D), padding: '6px 10px', fontSize: 13 }} />
                        <button onClick={() => handleSaveEdit(d.id)} style={btnPrimario(D)}><Check size={14} /></button>
                        <button onClick={() => { setEditId(null); setEditNotas("") }} style={btnSecundario(D)}><X size={14} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: D.muted, fontSize: 13 }}>
                        <span style={{ fontStyle: d.notas ? 'normal' : 'italic' }}>
                          {d.notas || '— sin notas —'}
                        </span>
                        <button onClick={() => { setEditId(d.id); setEditNotas(d.notas || "") }}
                          title="Editar notas"
                          style={{
                            padding: 4, border: 'none', background: 'transparent',
                            cursor: 'pointer', color: D.muted, display: 'flex',
                          }}>
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Línea 3: asignación */}
                  {asignado && (
                    <div style={{
                      marginTop: 8, padding: 8, borderRadius: 8,
                      background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)',
                      fontSize: 12, color: D.muted,
                      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                    }}>
                      <Link2 size={12} color="#06b6d4" />
                      <span>
                        <strong style={{ color: D.text }}>{d.laguna_nombre || `Laguna #${d.asignado_a_laguna_id}`}</strong>
                        {d.productor_nombre && <> · {d.productor_nombre}</>}
                        {d.productor_email && <> · {d.productor_email}</>}
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleToggleActivo(d)}
                    title={d.activo ? 'Desactivar' : 'Activar'}
                    style={iconBtn(D, d.activo ? '#22C55E' : '#94a3b8')}>
                    {d.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>

                  {asignado && (
                    <button onClick={() => handleLiberar(d)}
                      title="Liberar (desvincular de laguna)"
                      style={iconBtn(D, '#f59e0b')}>
                      <Unlink size={16} />
                    </button>
                  )}

                  <button onClick={() => setConfirmDelete(d.id)}
                    title="Eliminar"
                    disabled={asignado}
                    style={{
                      ...iconBtn(D, '#ef4444'),
                      opacity: asignado ? 0.4 : 1,
                      cursor: asignado ? 'not-allowed' : 'pointer',
                    }}>
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Confirm delete */}
                <AnimatePresence>
                  {confirmDelete === d.id && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{
                        gridColumn: '1 / -1', padding: 10, borderRadius: 10,
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 13 }}>
                        <AlertCircle size={16} />
                        ¿Eliminar <code>{d.codigo}</code>? Esto no se puede deshacer.
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleDelete(d.id)}
                          style={{ ...btnPrimario(D), background: '#ef4444', boxShadow: 'none' }}>
                          Sí, eliminar
                        </button>
                        <button onClick={() => setConfirmDelete(null)} style={btnSecundario(D)}>Cancelar</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 100,
              padding: '12px 18px', borderRadius: 12,
              background: toast.type === 'error' ? '#ef4444' : '#22C55E',
              color: '#fff', fontWeight: 600, fontSize: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
            {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ───────── helpers de estilo ─────────
const inputStyle = (D) => ({
  padding: '8px 12px', borderRadius: 10,
  border: `1px solid ${D.border}`, background: D.bg,
  color: D.text, fontSize: 14, outline: 'none', width: '100%',
})

const btnPrimario = (D) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg,#16a34a,#22C55E)',
  color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  boxShadow: '0 0 14px rgba(34,197,94,0.3)',
})

const btnSecundario = (D) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 10,
  border: `1px solid ${D.border}`, background: D.card,
  color: D.text, fontWeight: 600, fontSize: 13, cursor: 'pointer',
})

const iconBtn = (D, color) => ({
  padding: 8, borderRadius: 10,
  border: `1px solid ${color}55`, background: `${color}12`,
  color, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
})

const StatBox = ({ label, value, color, D }) => (
  <div style={{
    padding: 14, borderRadius: 12,
    border: `1px solid ${D.border}`, background: D.card,
    display: 'flex', flexDirection: 'column', gap: 4,
  }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {label}
    </span>
    <span style={{ fontSize: 24, fontWeight: 800, color }}>{value}</span>
  </div>
)

export default DispositivosAdmin
