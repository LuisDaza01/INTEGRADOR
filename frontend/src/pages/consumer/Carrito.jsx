// ============================================================
// src/pages/consumer/Carrito.jsx
// Flujo de 3 pasos — igual que la app mobile:
//   Paso 1: Reserva (carrito) + modo pedido (pescados / kilos)
//   Paso 2: Elegir fecha de venta del productor (calendario)
//   Paso 3: Confirmar — crea una reserva por productor (sin pago;
//           el precio final se fija al pesar). Devuelve código NP-XXXXX
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Check, RefreshCw, ArrowLeft, ArrowRight,
  Calendar, Fish, Trash2, Plus, Minus, Package,
  CheckCircle, AlertCircle, Info, Scale, Tag,
} from 'lucide-react'
import {
  obtenerCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
} from '../../api/services/carrito.service'
import api from '../../api/config/axios'
import { useTheme } from '../../contexts/ThemeContext'

const PRECIO_KG_REF        = 35     // Bs/kg — referencia si el item no trae precio
const PESO_PROMEDIO        = 0.9    // kg estimado por pescado
const PESO_MIN_KG          = 0.8    // mínimo por pedido (un pescado)

// ── Indicador de pasos ────────────────────────────────────────
const StepIndicator = ({ step }) => {
  const { D } = useTheme()
  const steps = ['Reserva', 'Fecha', 'Confirmar']
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((label, i) => {
        const num     = i + 1
        const done    = step > num
        const current = step === num
        return (
          <div key={num} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: done ? D.teal : 'transparent',
                border: `2px solid ${done ? D.teal : current ? D.primary : D.dim}`,
                color: done ? '#fff' : current ? D.primary : D.dim,
                boxShadow: current ? `0 0 14px rgba(56,189,248,0.4)` : 'none',
                transition: 'all 0.3s',
              }}>
                {done ? <Check size={16} /> : num}
              </div>
              <span style={{ fontSize: 11, marginTop: 5, fontWeight: 600,
                color: current ? D.primary : done ? D.teal : D.dim }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 64, height: 2, margin: '0 4px', marginBottom: 16,
                background: step > num
                  ? `linear-gradient(90deg, ${D.teal}, ${D.primary})`
                  : D.dim,
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Toggle modo (Por pescados / Por kilos) ────────────────────
const ModoToggle = ({ modo, onModo }) => {
  const { D } = useTheme()
  return (
  <div style={{
    display: 'flex', borderRadius: 10, overflow: 'hidden',
    background: 'rgba(56,189,248,0.05)',
    border: `1px solid ${D.border}`,
    marginTop: 12,
  }}>
    {[
      { key: 'cantidad', label: 'Por pescados', icon: <Fish size={13} /> },
      { key: 'peso',     label: 'Por kilos',    icon: <Scale size={13} /> },
    ].map(({ key, label, icon }) => (
      <button key={key} onClick={() => onModo(key)} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '8px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12,
        background: modo === key
          ? (key === 'cantidad' ? D.primary : D.teal)
          : 'transparent',
        color: modo === key ? '#fff' : D.muted,
        transition: 'all 0.2s',
      }}>
        {icon}{label}
      </button>
    ))}
  </div>
  )
}

// ── Item del carrito ──────────────────────────────────────────
const CartItemRow = ({ item, modo, pesoKg, onModo, onPesoKg, onQuantity, onRemove }) => {
  const { D } = useTheme()
  const precioKg   = parseFloat(item.precio) || PRECIO_KG_REF
  const kgNum      = parseFloat(pesoKg) || 0
  const pesoValido = kgNum >= PESO_MIN_KG
  const precioEst  = modo === 'peso'
    ? (pesoValido ? kgNum * precioKg : null)
    : precioKg * PESO_PROMEDIO * item.cantidad

  return (
    <div style={{
      background: D.card, borderRadius: 14,
      border: `1px solid ${D.border}`,
      padding: 16, marginBottom: 12,
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Imagen */}
        {item.imagen ? (
          <img src={item.imagen} alt={item.nombre}
            style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: 10, flexShrink: 0,
            background: 'rgba(56,189,248,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Fish size={26} color={D.primary} />
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ fontWeight: 700, color: D.text, fontSize: 15, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.nombre || item.producto_nombre}
            </p>
            <button onClick={() => onRemove(item.id)} style={{
              background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8,
              padding: '4px 6px', cursor: 'pointer', color: D.red, marginLeft: 8, flexShrink: 0,
            }}>
              <Trash2 size={14} />
            </button>
          </div>
          <p style={{ color: D.muted, fontSize: 12, margin: '3px 0 0' }}>
            Bs. {precioKg}/kg · {item.productor_nombre || 'productor'}
          </p>
        </div>
      </div>

      {/* Toggle modo */}
      <ModoToggle modo={modo} onModo={onModo} />

      {/* Control según modo */}
      <div style={{ marginTop: 12 }}>
        {modo === 'cantidad' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(56,189,248,0.06)', borderRadius: 10, padding: '6px 12px',
              border: `1px solid ${D.border}`,
            }}>
              <button onClick={() => onQuantity(item.id, item.cantidad - 1)}
                disabled={item.cantidad <= 1}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: D.muted, padding: 0, opacity: item.cantidad <= 1 ? 0.4 : 1,
                }}>
                <Minus size={15} />
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: D.text, minWidth: 28, textAlign: 'center' }}>
                {item.cantidad} 🐟
              </span>
              <button onClick={() => onQuantity(item.id, item.cantidad + 1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.muted, padding: 0 }}>
                <Plus size={15} />
              </button>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: D.primary, margin: 0 }}>
                ~Bs. {precioEst.toFixed(2)} estimado
              </p>
              <p style={{ fontSize: 11, color: D.dim, margin: '2px 0 0' }}>
                ~{PESO_PROMEDIO} kg/pescado · confirmado al pesar
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1.5px solid ${pesoKg && !pesoValido ? D.red : D.border}`,
              borderRadius: 10, padding: '8px 12px',
              background: 'rgba(56,189,248,0.04)',
              flex: 1,
            }}>
              <Scale size={15} color={D.muted} />
              <input
                type="number" min="0.8" step="0.1"
                placeholder="ej: 1.5"
                value={pesoKg}
                onChange={e => onPesoKg(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: 15, fontWeight: 700, color: D.text, width: 0,
                }}
              />
              <span style={{ fontSize: 13, color: D.muted, fontWeight: 600 }}>kg</span>
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              {!pesoKg && (
                <p style={{ fontSize: 12, color: D.dim, margin: 0 }}>Mínimo 0.8 kg</p>
              )}
              {pesoKg && !pesoValido && (
                <p style={{ fontSize: 12, color: D.red, fontWeight: 600, margin: 0 }}>
                  Mínimo 0.8 kg (1 pescado)
                </p>
              )}
              {pesoValido && (
                <>
                  <p style={{ fontSize: 16, fontWeight: 700, color: D.teal, margin: 0 }}>
                    Bs. {precioEst.toFixed(2)}
                  </p>
                  <p style={{ fontSize: 11, color: D.dim, margin: '2px 0 0' }}>
                    {kgNum.toFixed(2)} kg × Bs. {precioKg}/kg
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fmtFechaCorta = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtFechaLarga = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })

// ── Componente principal ──────────────────────────────────────
const Carrito = () => {
  const navigate = useNavigate()
  const { D } = useTheme()

  const [step, setStep]               = useState(1)
  const [carrito, setCarrito]         = useState([])
  const [modos, setModos]             = useState({})
  const [pesosKg, setPesosKg]         = useState({})
  const [loading, setLoading]         = useState(true)
  const [procesando, setProcesando]   = useState(false)
  const [error, setError]             = useState(null)

  // Reserva
  const [fechaSel, setFechaSel]           = useState(null)
  const [fechasDisp, setFechasDisp]       = useState([])
  const [cargandoFechas, setCargandoFechas] = useState(false)
  const [reservasCreadas, setReservasCreadas] = useState(null) // [{ codigo, productor, total }]

  const getModo = id => modos[id] || 'cantidad'

  const precioItem = item => {
    const precioKg = parseFloat(item.precio) || PRECIO_KG_REF
    if (getModo(item.id) === 'peso') {
      const kg = parseFloat(pesosKg[item.id]) || 0
      return kg * precioKg
    }
    return precioKg * PESO_PROMEDIO * item.cantidad
  }

  const fetchCarrito = useCallback(async () => {
    try {
      setLoading(true)
      const data = await obtenerCarrito()
      setCarrito(data?.items || [])
    } catch { setCarrito([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCarrito() }, [fetchCarrito])

  const updateQuantity = async (id, qty) => {
    if (qty < 1) return
    await actualizarCantidadCarrito(id, qty)
    setCarrito(prev => prev.map(i => i.id === id ? { ...i, cantidad: qty } : i))
  }

  const removeItem = async (id) => {
    if (!window.confirm('¿Eliminar este producto de la reserva?')) return
    await eliminarDelCarrito(id)
    setCarrito(prev => prev.filter(i => i.id !== id))
    setModos(prev => { const n = { ...prev }; delete n[id]; return n })
    setPesosKg(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const subtotal    = carrito.reduce((s, i) => s + precioItem(i), 0)
  const hayEstimado = carrito.some(i => getModo(i.id) === 'cantidad')

  // ── Paso 1 → 2: validar pesos y cargar fechas del productor ──
  const handleIrAFecha = async () => {
    for (const item of carrito) {
      if (getModo(item.id) === 'peso') {
        const kg = parseFloat(pesosKg[item.id]) || 0
        if (kg < PESO_MIN_KG) {
          setError(`Mínimo 0.8 kg por item. Revisa "${item.nombre || item.producto_nombre}".`)
          return
        }
      }
    }
    setError(null)
    setStep(2)
    cargarFechas()
  }

  // Carga las fechas disponibles del calendario público del productor
  const cargarFechas = async () => {
    const pids = [...new Set(carrito.map(i => i.productor_id).filter(Boolean))]
    if (pids.length === 0) { setFechasDisp([]); return }
    setCargandoFechas(true)
    try {
      const hoy = new Date()
      const hasta = new Date(); hasta.setDate(hasta.getDate() + 30)
      // Negocio mono-productor en la práctica: usamos el calendario del primer productor
      const res = await api.get(`/productores/${pids[0]}/calendario`, {
        params: { desde: ymd(hoy), hasta: ymd(hasta) },
      })
      const dias = (res.data?.data || res.data || []).filter(d => d.disponible)
      setFechasDisp(dias)
    } catch {
      setFechasDisp([])
    } finally {
      setCargandoFechas(false)
    }
  }

  // ── Paso 3: confirmar → crea una reserva por productor ───────
  const handleConfirmarReserva = async () => {
    if (procesando || reservasCreadas) return
    if (!fechaSel) { setError('Elige una fecha para tu reserva'); setStep(2); return }

    setProcesando(true)
    setError(null)
    try {
      // Agrupar por productor → una reserva por productor
      const grupos = {}
      for (const item of carrito) {
        const pid = item.productor_id
        ;(grupos[pid] = grupos[pid] || []).push(item)
      }

      const creadas = []
      for (const [pid, items] of Object.entries(grupos)) {
        const payload = {
          productor_id: Number(pid),
          fecha_reserva: fechaSel,
          items: items.map(it => {
            const modo = getModo(it.id)
            if (modo === 'peso') {
              return { producto_id: it.producto_id || it.id, modo: 'peso', peso_solicitado_kg: parseFloat(pesosKg[it.id]) || 0 }
            }
            return { producto_id: it.producto_id || it.id, modo: 'cantidad', cantidad: it.cantidad }
          }),
        }
        const res = await api.post('/reservas', payload)
        const r = res.data?.data || res.data
        creadas.push({
          codigo: r.codigo,
          productor: items[0].productor_nombre || 'Productor',
          total: r.precio_estimado,
        })
      }

      // Vaciar carrito (best-effort)
      await Promise.allSettled(carrito.map(it => eliminarDelCarrito(it.id)))
      setCarrito([])
      setReservasCreadas(creadas)
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo crear la reserva. Intenta de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  // ── Resumen sidebar ───────────────────────────────────────────
  const ResumenCard = ({ ctaLabel, ctaIcon, onCta, ctaDisabled }) => (
    <div style={{
      background: D.card, borderRadius: 16,
      border: `1px solid ${D.border}`, padding: 20,
      height: 'fit-content', position: 'sticky', top: 20,
    }}>
      <h3 style={{ color: D.text, fontWeight: 700, margin: '0 0 16px', fontSize: 16 }}>Resumen</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: D.muted }}>{carrito.length} producto{carrito.length !== 1 ? 's' : ''}</span>
          <span style={{ color: D.dim, fontStyle: 'italic' }}>Bs. {subtotal.toFixed(2)}</span>
        </div>
        <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: 10, marginTop: 4,
          display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span style={{ color: D.text }}>Total estimado</span>
          <span style={{ color: D.primary }}>Bs. {subtotal.toFixed(2)}*</span>
        </div>
        <p style={{ fontSize: 11, color: D.dim, fontStyle: 'italic', margin: 0 }}>
          *Estimado con {PESO_PROMEDIO} kg/pescado. El precio final se confirma tras el pesaje.
        </p>
      </div>
      <button onClick={onCta} disabled={ctaDisabled} style={{
        width: '100%', marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: ctaDisabled ? D.dim : `linear-gradient(135deg, ${D.teal}, ${D.primary})`,
        color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0',
        fontSize: 15, fontWeight: 700, cursor: ctaDisabled ? 'not-allowed' : 'pointer',
        boxShadow: ctaDisabled ? 'none' : `0 0 20px rgba(56,189,248,0.3)`,
        transition: 'all 0.2s',
      }}>
        {ctaLabel}
        {ctaIcon}
      </button>
    </div>
  )

  // ── PASO 1: Carrito / Reserva ─────────────────────────────────
  const renderPaso1 = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: D.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Mi reserva</h2>
        <button onClick={fetchCarrito} style={{
          background: 'rgba(56,189,248,0.08)', border: `1px solid ${D.border}`,
          borderRadius: 10, padding: '7px 10px', cursor: 'pointer', color: D.muted,
        }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div style={{
          background: D.card, borderRadius: 16, border: `1px solid ${D.border}`,
          padding: 48, textAlign: 'center',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `3px solid transparent`, borderTopColor: D.primary,
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: D.muted, margin: 0 }}>Cargando reserva...</p>
        </div>
      ) : carrito.length === 0 ? (
        <div style={{
          background: D.card, borderRadius: 16, border: `1px solid ${D.border}`,
          padding: 48, textAlign: 'center',
        }}>
          <ShoppingBag size={52} color={D.dim} style={{ margin: '0 auto 14px', display: 'block' }} />
          <p style={{ color: D.text, fontWeight: 700, fontSize: 17, margin: '0 0 6px' }}>Tu reserva está vacía</p>
          <p style={{ color: D.muted, fontSize: 13, margin: '0 0 20px' }}>Agrega productos desde la tienda para reservar</p>
          <button onClick={() => navigate('/dashboard-consumidor/tienda')} style={{
            background: `linear-gradient(135deg, ${D.teal}, ${D.primary})`,
            color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Ver tienda
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          <div>
            {/* Banner info */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
              background: 'rgba(56,189,248,0.06)', border: `1px solid rgba(56,189,248,0.2)`,
              borderRadius: 12, marginBottom: 16, fontSize: 13, color: D.muted,
            }}>
              <Info size={16} color={D.primary} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Reservas una fecha de venta. El precio es <strong style={{ color: D.primary }}>estimado</strong>;
                el productor pesa tu pedido el día de la venta y confirma el monto final.
                Elige <strong style={{ color: D.primary }}>Por pescados</strong> o <strong style={{ color: D.teal }}>Por kilos</strong>.
              </span>
            </div>

            {carrito.map(item => (
              <CartItemRow
                key={item.id}
                item={item}
                modo={getModo(item.id)}
                pesoKg={pesosKg[item.id] || ''}
                onModo={modo => setModos(p => ({ ...p, [item.id]: modo }))}
                onPesoKg={v => setPesosKg(p => ({ ...p, [item.id]: v }))}
                onQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`,
                borderRadius: 10, fontSize: 13, color: D.red, marginTop: 8,
              }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
          </div>

          <ResumenCard
            ctaLabel="Elegir fecha"
            ctaIcon={<ArrowRight size={16} />}
            onCta={handleIrAFecha}
          />
        </div>
      )}
    </div>
  )

  // ── PASO 2: Elegir fecha ──────────────────────────────────────
  const renderPaso2 = () => (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => setStep(1)} style={{
          background: 'rgba(56,189,248,0.08)', border: `1px solid ${D.border}`,
          borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: D.muted,
        }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ color: D.text, fontWeight: 800, fontSize: 22, margin: 0 }}>¿Para qué día?</h2>
      </div>
      <p style={{ color: D.muted, fontSize: 14, margin: '0 0 20px', paddingLeft: 44 }}>
        Elige un día de venta del productor. Te recordaremos cuando se acerque.
      </p>

      {cargandoFechas ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `3px solid transparent`, borderTopColor: D.primary,
            animation: 'spin 0.8s linear infinite', margin: '0 auto',
          }} />
        </div>
      ) : fechasDisp.length === 0 ? (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <Calendar size={42} color={D.dim} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: D.text, fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>Sin fechas disponibles</p>
          <p style={{ color: D.muted, fontSize: 13, margin: 0 }}>
            Este productor no tiene días de venta próximos configurados.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {fechasDisp.map(d => {
            const sel = fechaSel === d.fecha
            return (
              <button key={d.fecha} onClick={() => { setFechaSel(d.fecha); setError(null) }}
                style={{
                  minWidth: 120, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${sel ? D.primary : D.border}`,
                  background: sel ? D.primary : D.card,
                  color: sel ? '#fff' : D.text, textAlign: 'center', transition: 'all 0.2s',
                  textTransform: 'capitalize', fontWeight: 700, fontSize: 13,
                }}>
                {fmtFechaCorta(d.fecha)}
                {d.cupo_restante != null && (
                  <div style={{ fontSize: 10, fontWeight: 500, marginTop: 3, color: sel ? 'rgba(255,255,255,0.85)' : D.muted }}>
                    {d.cupo_restante} cupos
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`,
          borderRadius: 10, fontSize: 13, color: D.red, marginBottom: 14,
        }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <button onClick={() => fechaSel ? setStep(3) : setError('Selecciona un día para continuar')}
        disabled={!fechaSel}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: fechaSel ? `linear-gradient(135deg, ${D.teal}, ${D.primary})` : D.dim,
          color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0',
          fontSize: 16, fontWeight: 700, cursor: fechaSel ? 'pointer' : 'not-allowed',
          boxShadow: fechaSel ? `0 0 24px rgba(56,189,248,0.3)` : 'none', transition: 'all 0.2s',
        }}>
        Continuar <ArrowRight size={20} />
      </button>
    </div>
  )

  // ── PASO 3: Confirmar ─────────────────────────────────────────
  const renderPaso3 = () => {
    if (reservasCreadas) {
      return (
        <div style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: D.card, borderRadius: 24,
            border: `1px solid rgba(34,197,94,0.3)`, padding: 36,
            boxShadow: '0 0 40px rgba(34,197,94,0.15)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(34,197,94,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
              boxShadow: '0 0 24px rgba(34,197,94,0.3)',
            }}>
              <CheckCircle size={42} color={D.green} />
            </div>
            <h2 style={{ color: D.text, fontWeight: 800, fontSize: 24, margin: '0 0 8px' }}>¡Reserva creada!</h2>
            <p style={{ color: D.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 22px' }}>
              Guarda tu código: identifica tu reserva y lo muestras al recoger.
            </p>

            {reservasCreadas.map((r, i) => (
              <div key={i} style={{
                background: 'rgba(56,189,248,0.06)', border: `1px solid ${D.border}`,
                borderRadius: 16, padding: 16, marginBottom: 12,
              }}>
                <div style={{ fontSize: 12, color: D.muted, marginBottom: 4 }}>{r.productor}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Tag size={18} color={D.primary} />
                  <span style={{ fontSize: 28, fontWeight: 900, color: D.primary, letterSpacing: '0.08em' }}>{r.codigo}</span>
                </div>
                {r.total != null && (
                  <div style={{ fontSize: 13, color: D.muted, marginTop: 4 }}>≈ Bs. {Number(r.total).toFixed(2)} (estimado)</div>
                )}
              </div>
            ))}

            <button onClick={() => navigate('/dashboard-consumidor/mis-reservas')} style={{
              width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: `linear-gradient(135deg, ${D.teal}, ${D.primary})`,
              color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 0 20px rgba(56,189,248,0.3)`,
            }}>
              <Package size={18} /> Ver mis reservas
            </button>
          </div>
        </div>
      )
    }

    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setStep(2)} style={{
            background: 'rgba(56,189,248,0.08)', border: `1px solid ${D.border}`,
            borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: D.muted,
          }}>
            <ArrowLeft size={18} />
          </button>
          <h2 style={{ color: D.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Confirmar reserva</h2>
        </div>

        {/* Fecha elegida */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: 16,
          background: 'rgba(56,189,248,0.08)', border: `1px solid rgba(56,189,248,0.25)`,
          borderRadius: 14, marginBottom: 14,
        }}>
          <Calendar size={20} color={D.primary} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: D.muted }}>Reservas para:</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: D.primary, textTransform: 'capitalize' }}>{fmtFechaLarga(fechaSel)}</div>
          </div>
          <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: D.primary, fontSize: 13, cursor: 'pointer' }}>
            Cambiar
          </button>
        </div>

        {/* Aviso del flujo */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
          background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.25)`,
          borderRadius: 12, marginBottom: 14, fontSize: 13, color: '#fbbf24',
        }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Sin pago por ahora.</strong> El día de la venta el productor pesa tu pedido y te avisa el precio final. Recién ahí pagas por QR.
          </span>
        </div>

        {/* Resumen estimado */}
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
          <h3 style={{ color: D.text, fontWeight: 700, margin: '0 0 12px', fontSize: 15 }}>Resumen estimado</h3>
          {carrito.map(it => (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 14 }}>
              <span style={{ color: D.muted }}>
                {it.nombre || it.producto_nombre} · {getModo(it.id) === 'peso' ? `${parseFloat(pesosKg[it.id]) || 0} kg` : `${it.cantidad} 🐟`}
              </span>
              <span style={{ color: D.text, fontWeight: 600 }}>Bs. {precioItem(it).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${D.border}`, marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span style={{ color: D.text }}>Total estimado</span>
            <span style={{ color: D.primary }}>Bs. {subtotal.toFixed(2)}</span>
          </div>
          <p style={{ fontSize: 11, color: D.dim, fontStyle: 'italic', margin: '8px 0 0' }}>
            *Estimado con {PESO_PROMEDIO} kg por pescado. El precio final se calcula al pesar.
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`,
            borderRadius: 10, fontSize: 13, color: D.red, marginBottom: 14,
          }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <button onClick={handleConfirmarReserva} disabled={procesando} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: procesando ? D.dim : `linear-gradient(135deg, #16a34a, ${D.green})`,
          color: '#fff', border: 'none', borderRadius: 14, padding: '16px 0',
          fontSize: 16, fontWeight: 700, cursor: procesando ? 'not-allowed' : 'pointer',
          boxShadow: procesando ? 'none' : `0 0 28px rgba(34,197,94,0.35)`, transition: 'all 0.2s',
        }}>
          {procesando ? (
            <><RefreshCw size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Creando reserva...</>
          ) : (
            <><CheckCircle size={20} /> Confirmar reserva</>
          )}
        </button>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 40, background: D.bg }}>
      {/* Fondo con orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-15%', left: '10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '32px 24px 0' }}>
        <StepIndicator step={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            {step === 1 && renderPaso1()}
            {step === 2 && renderPaso2()}
            {step === 3 && renderPaso3()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CSS animations */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default Carrito
