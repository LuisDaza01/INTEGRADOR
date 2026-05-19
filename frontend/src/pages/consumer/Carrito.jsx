// ============================================================
// src/pages/consumer/Carrito.jsx
// Flujo de 3 pasos — igual que la app mobile:
//   Paso 1: Carrito + modo pedido (pescados / kilos)
//   Paso 2: Selección de parada de entrega (con mapa Leaflet)
//   Paso 3: Pago QR BCP — el pedido se crea AL CONFIRMAR PAGO
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Check, RefreshCw, ArrowLeft, ArrowRight,
  MapPin, Fish, Trash2, Plus, Minus, Package, QrCode,
  CheckCircle, AlertCircle, CreditCard, Info, Scale, Upload,
} from 'lucide-react'
import {
  obtenerCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
} from '../../api/services/carrito.service'
import api from '../../api/config/axios'
import { useTheme } from '../../contexts/ThemeContext'
import CuponInput from '../../components/features/CuponInput'

const API_BASE = import.meta.env.VITE_API_URL || 'https://naturapiscis-backend-production.up.railway.app/api'

const TITULAR              = 'Luis Gustavo Daza Jimenez'
const CUENTA               = '201-51679466-3-61'
const BANCO                = 'BCP Bolivia'
const PRECIO_KG            = 35
const PESO_PROMEDIO        = 0.9   // kg estimado por pescado
const PESO_MIN_KG          = 0.8   // mínimo por pedido

// ── Indicador de pasos ────────────────────────────────────────
const StepIndicator = ({ step }) => {
  const { D } = useTheme()
  const steps = ['Carrito', 'Parada', 'Pago']
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
                background: done ? D.teal : current ? 'transparent' : 'transparent',
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
  const kgNum     = parseFloat(pesoKg) || 0
  const pesoValido = kgNum >= PESO_MIN_KG
  const precioEst  = modo === 'peso'
    ? (pesoValido ? kgNum * PRECIO_KG : null)
    : PRECIO_KG * PESO_PROMEDIO * item.cantidad

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
            Bs. {PRECIO_KG}/kg · referencial
          </p>
        </div>
      </div>

      {/* Toggle modo */}
      <ModoToggle modo={modo} onModo={onModo} />

      {/* Control según modo */}
      <div style={{ marginTop: 12 }}>
        {modo === 'cantidad' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Selector cantidad */}
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
            {/* Info estimado */}
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
            {/* Input kg */}
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
            {/* Info precio */}
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
                    {kgNum.toFixed(2)} kg × Bs. {PRECIO_KG}/kg
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

// ── Mapa Leaflet para paradas ─────────────────────────────────
const MapaParadas = ({ paradas, onSelect }) => {
  const { D } = useTheme()
  const mapRef = useRef(null)
  const mapObj = useRef(null)

  useEffect(() => {
    if (mapObj.current || !paradas.length) return

    const loadLeaflet = () => new Promise(resolve => {
      if (window.L) { resolve(window.L); return }
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => resolve(window.L)
      document.head.appendChild(script)
    })

    loadLeaflet().then(L => {
      if (!mapRef.current || mapObj.current) return
      const primera = paradas[0]
      mapObj.current = L.map(mapRef.current).setView([primera.lat, primera.lng], 8)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(mapObj.current)

      paradas.forEach(parada => {
        const icon = L.divIcon({
          html: `<div style="background:#14b8a6;width:30px;height:30px;border-radius:50%;border:3px solid #0f172a;box-shadow:0 0 12px rgba(20,184,166,0.5);display:flex;align-items:center;justify-content:center;font-size:13px;">📍</div>`,
          iconSize: [30, 30], iconAnchor: [15, 15], className: '',
        })
        L.marker([parada.lat, parada.lng], { icon })
          .addTo(mapObj.current)
          .bindPopup(`<strong>${parada.nombre}</strong><br>${parada.descripcion || ''}`)
          .on('click', () => onSelect(parada))
      })

      const bounds = L.latLngBounds(paradas.map(p => [p.lat, p.lng]))
      mapObj.current.fitBounds(bounds, { padding: [40, 40] })
    })

    return () => { if (mapObj.current) { mapObj.current.remove(); mapObj.current = null } }
  }, [paradas])

  if (!paradas.length) return null
  return (
    <div ref={mapRef} style={{
      height: 200, borderRadius: 14, overflow: 'hidden',
      border: `1px solid ${D.border}`, marginBottom: 16,
    }} />
  )
}

// ── Componente principal ──────────────────────────────────────
const Carrito = () => {
  const navigate = useNavigate()
  const { D } = useTheme()

  const [step, setStep]                             = useState(1)
  const [carrito, setCarrito]                       = useState([])
  const [paradas, setParadas]                       = useState([])
  const [paradaSeleccionada, setParadaSeleccionada] = useState(null)
  const [modos, setModos]                           = useState({})
  const [pesosKg, setPesosKg]                       = useState({})
  const [loading, setLoading]                       = useState(true)
  const [procesando, setProcesando]                 = useState(false)
  const [pedidoCreado, setPedidoCreado]             = useState(null)
  const [error, setError]                           = useState(null)
  const [pedidoData, setPedidoData]                 = useState(null)
  const [subiendoComp, setSubiendoComp]             = useState(false)
  const [comprobanteSubido, setComprobanteSubido]   = useState(false)

  const getModo = id => modos[id] || 'cantidad'

  const precioItem = item => {
    if (getModo(item.id) === 'peso') {
      const kg = parseFloat(pesosKg[item.id]) || 0
      return kg * PRECIO_KG
    }
    return PRECIO_KG * PESO_PROMEDIO * item.cantidad
  }

  const fetchCarrito = useCallback(async () => {
    try {
      setLoading(true)
      const data = await obtenerCarrito()
      setCarrito(data?.items || [])
    } catch { setCarrito([]) }
    finally { setLoading(false) }
  }, [])

  const fetchParadas = useCallback(async () => {
    try {
      const res = await api.get(`${API_BASE}/paradas`)
      const data = res.data.data || res.data || []
      setParadas(Array.isArray(data) && data.length ? data : PARADAS_FALLBACK)
    } catch {
      setParadas(PARADAS_FALLBACK)
    }
  }, [])

  useEffect(() => { fetchCarrito(); fetchParadas() }, [])

  const updateQuantity = async (id, qty) => {
    if (qty < 1) return
    await actualizarCantidadCarrito(id, qty)
    setCarrito(prev => prev.map(i => i.id === id ? { ...i, cantidad: qty } : i))
  }

  const removeItem = async (id) => {
    if (!window.confirm('¿Eliminar este producto del carrito?')) return
    await eliminarDelCarrito(id)
    setCarrito(prev => prev.filter(i => i.id !== id))
    setModos(prev => { const n = { ...prev }; delete n[id]; return n })
    setPesosKg(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const [cuponAplicado, setCuponAplicado] = useState(null) // { cupon, descuento, total }

  const subtotal    = carrito.reduce((s, i) => s + precioItem(i), 0)
  const costoEnvio  = subtotal > 100 ? 0 : 15
  const descuento   = cuponAplicado?.descuento ?? 0
  const total       = subtotal + costoEnvio - descuento
  const hayEstimado = carrito.some(i => getModo(i.id) === 'cantidad')

  const productorQR     = carrito[0]?.productor_qr_pago_url || null
  const productorNombre = carrito[0]?.productor_nombre || TITULAR

  // ── Paso 1 → 2 ───────────────────────────────────────────────
  const handleIrAParada = () => {
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
  }

  // ── Paso 2 → 3: prepara pedidoData SIN crearlo todavía ───────
  const handleIrAPago = () => {
    if (!paradaSeleccionada) {
      setError('Por favor selecciona una parada de entrega')
      return
    }
    setError(null)
    const data = {
      items: carrito.map(i => {
        const modo = getModo(i.id)
        return {
          producto_id:  i.producto_id || i.id,
          cantidad:     modo === 'peso' ? parseFloat(pesosKg[i.id]) : i.cantidad,
          tipo_pedido:  modo,
          precio:       PRECIO_KG,
        }
      }),
      metodo_envio:   'parada',
      subtotal,
      costo_envio:    costoEnvio,
      total,
      notas:          `Entrega en: ${paradaSeleccionada.nombre}`,
      parada_id:      paradaSeleccionada.id,
      metodo_pago_id: 7,
      direccion: {
        nombre:        paradaSeleccionada.nombre,
        direccion:     paradaSeleccionada.descripcion || paradaSeleccionada.nombre,
        ciudad:        'Cochabamba',
        codigo_postal: '0000',
        telefono:      '',
      },
    }
    setPedidoData(data)
    setStep(3)
  }

  // ── Confirmar pago → crear pedido ─────────────────────────────
  const handleConfirmarPago = async () => {
    if (procesando || pedidoCreado) return
    if (!window.confirm(
      `¿Confirmas que transferiste al productor ${productorNombre}?\n\nRecuerda: el monto final será determinado después de que el productor pese tu pedido.`
    )) return

    setProcesando(true)
    setError(null)
    try {
      const res = await api.post(`${API_BASE}/pedidos`, pedidoData)
      setPedidoCreado(res.data.data || res.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al confirmar el pedido. Intenta de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  // ── Subir comprobante de pago ─────────────────────────────────
  const handleSubirComprobante = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file || !pedidoCreado?.id) return
    setSubiendoComp(true)
    try {
      const fd = new FormData()
      fd.append('comprobante', file)
      await api.post(`${API_BASE}/pedidos/${pedidoCreado.id}/comprobante`, fd)
      setComprobanteSubido(true)
    } catch (e) {
      alert(e.response?.data?.message || 'No se pudo subir el comprobante.')
    } finally {
      setSubiendoComp(false)
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
          <span style={{ color: D.dim, fontStyle: 'italic' }}>
            {hayEstimado ? 'Al pesar' : `Bs. ${subtotal.toFixed(2)}`}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: D.muted }}>Costo de envío</span>
          {costoEnvio === 0
            ? <span style={{ color: D.green, fontWeight: 600 }}>Gratis</span>
            : <span style={{ color: D.text }}>Bs. {costoEnvio.toFixed(2)}</span>
          }
        </div>
        {descuento > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
            <span>Descuento ({cuponAplicado.cupon.codigo})</span>
            <span style={{ fontWeight: 600 }}>−Bs. {descuento.toFixed(2)}</span>
          </div>
        )}
        <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: 10, marginTop: 4,
          display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span style={{ color: D.text }}>{hayEstimado ? 'Total estimado' : 'Total'}</span>
          <span style={{ color: D.primary }}>Bs. {total.toFixed(2)}{hayEstimado ? '*' : ''}</span>
        </div>
        {hayEstimado && (
          <p style={{ fontSize: 11, color: D.dim, fontStyle: 'italic', margin: 0 }}>
            *El monto exacto se confirma tras el pesaje
          </p>
        )}
      </div>
      {/* Coupon input — only show in step 1 */}
      {step === 1 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, color: D.muted, margin: '0 0 8px' }}>¿Tienes un cupón?</p>
          <CuponInput
            subtotal={subtotal + costoEnvio}
            onApply={data => setCuponAplicado(data)}
            onRemove={() => setCuponAplicado(null)}
          />
        </div>
      )}
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

  // ── PASO 1: Carrito ───────────────────────────────────────────
  const renderPaso1 = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: D.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Mi carrito</h2>
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
          <p style={{ color: D.muted, margin: 0 }}>Cargando carrito...</p>
        </div>
      ) : carrito.length === 0 ? (
        <div style={{
          background: D.card, borderRadius: 16, border: `1px solid ${D.border}`,
          padding: 48, textAlign: 'center',
        }}>
          <ShoppingBag size={52} color={D.dim} style={{ margin: '0 auto 14px', display: 'block' }} />
          <p style={{ color: D.text, fontWeight: 700, fontSize: 17, margin: '0 0 6px' }}>Tu carrito está vacío</p>
          <p style={{ color: D.muted, fontSize: 13, margin: '0 0 20px' }}>Agrega productos desde la tienda</p>
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
          {/* Items */}
          <div>
            {/* Banner info */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
              background: 'rgba(56,189,248,0.06)', border: `1px solid rgba(56,189,248,0.2)`,
              borderRadius: 12, marginBottom: 16, fontSize: 13, color: D.muted,
            }}>
              <Info size={16} color={D.primary} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                El precio final se calcula según el peso real. Elige <strong style={{ color: D.primary }}>Por pescados</strong> para
                estimado por unidad, o <strong style={{ color: D.teal }}>Por kilos</strong> si sabes exactamente cuánto quieres.
                Bs. {PRECIO_KG}/kg.
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

          {/* Sidebar */}
          <ResumenCard
            ctaLabel="Elegir parada"
            ctaIcon={<ArrowRight size={16} />}
            onCta={handleIrAParada}
          />
        </div>
      )}
    </div>
  )

  // ── PASO 2: Selección de parada ───────────────────────────────
  const renderPaso2 = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setStep(1)} style={{
          background: 'rgba(56,189,248,0.08)', border: `1px solid ${D.border}`,
          borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: D.muted,
        }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ color: D.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Elige tu parada de entrega</h2>
      </div>

      <MapaParadas paradas={paradas} onSelect={p => { setParadaSeleccionada(p); setError(null) }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {paradas.map(parada => {
          const sel = paradaSeleccionada?.id === parada.id
          return (
            <button key={parada.id}
              onClick={() => { setParadaSeleccionada(parada); setError(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: 16,
                borderRadius: 14, border: `2px solid ${sel ? D.teal : D.border}`,
                background: sel ? 'rgba(20,184,166,0.08)' : D.card,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                boxShadow: sel ? `0 0 16px rgba(20,184,166,0.2)` : 'none',
              }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: sel ? D.teal : 'rgba(56,189,248,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: sel ? `0 0 12px rgba(20,184,166,0.4)` : 'none',
              }}>
                <MapPin size={20} color={sel ? '#fff' : D.muted} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: sel ? D.teal : D.text, margin: '0 0 3px', fontSize: 15 }}>
                  {parada.nombre}
                </p>
                <p style={{ fontSize: 13, color: D.muted, margin: 0 }}>{parada.descripcion}</p>
              </div>
              {sel && <CheckCircle size={20} color={D.teal} />}
            </button>
          )
        })}
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

      <button onClick={handleIrAPago} disabled={!paradaSeleccionada} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: paradaSeleccionada
          ? `linear-gradient(135deg, ${D.teal}, ${D.primary})`
          : D.dim,
        color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0',
        fontSize: 16, fontWeight: 700, cursor: paradaSeleccionada ? 'pointer' : 'not-allowed',
        boxShadow: paradaSeleccionada ? `0 0 24px rgba(56,189,248,0.3)` : 'none',
        transition: 'all 0.2s',
      }}>
        <QrCode size={20} /> Ver QR de pago
      </button>
    </div>
  )

  // ── PASO 3: QR de pago ────────────────────────────────────────
  const renderPaso3 = () => {
    if (pedidoCreado) {
      return (
        <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: D.card, borderRadius: 24,
            border: `1px solid rgba(34,197,94,0.3)`, padding: 40,
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
            <h2 style={{ color: D.text, fontWeight: 800, fontSize: 24, margin: '0 0 10px' }}>¡Pedido confirmado!</h2>
            <p style={{ color: D.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 18px' }}>
              Tu pedido fue registrado. El productor lo preparará y pesará tus pescados.
              Recibirás una notificación con el precio exacto para confirmar.
            </p>
            {paradaSeleccionada && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                background: 'rgba(56,189,248,0.08)', borderRadius: 10, padding: '10px 16px',
                marginBottom: 14, fontSize: 13, color: D.primary,
                border: `1px solid rgba(56,189,248,0.2)`,
              }}>
                <MapPin size={15} />
                Entrega en: <strong style={{ marginLeft: 4 }}>{paradaSeleccionada.nombre}</strong>
              </div>
            )}
            {pedidoCreado?.id && (
              <p style={{ fontSize: 12, color: D.dim, margin: '0 0 20px' }}>
                N° Pedido: PED-{pedidoCreado.id}
              </p>
            )}

            {/* Comprobante */}
            {!comprobanteSubido ? (
              <label style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(139,92,246,0.15)', border: `1px solid rgba(139,92,246,0.3)`,
                color: '#c084fc', borderRadius: 12, padding: '13px 0',
                fontSize: 15, fontWeight: 700, cursor: subiendoComp ? 'not-allowed' : 'pointer',
                marginBottom: 12, opacity: subiendoComp ? 0.7 : 1, boxSizing: 'border-box',
              }}>
                {subiendoComp
                  ? <><div style={{ width: 16, height: 16, border: '2px solid #c084fc', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Subiendo…</>
                  : <><Upload size={18} /> Subir comprobante de pago</>}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSubirComprobante} disabled={subiendoComp} />
              </label>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                color: D.green, fontSize: 14, fontWeight: 600, marginBottom: 12, padding: '10px 0',
              }}>
                <CheckCircle size={18} /> Comprobante enviado al productor
              </div>
            )}

            <button onClick={() => navigate('/dashboard-consumidor/mis-pedidos')} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: `linear-gradient(135deg, ${D.teal}, ${D.primary})`,
              color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 0 20px rgba(56,189,248,0.3)`,
            }}>
              <Package size={18} /> Ver mis pedidos
            </button>
          </div>
        </div>
      )
    }

    return (
      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setStep(2)} style={{
            background: 'rgba(56,189,248,0.08)', border: `1px solid ${D.border}`,
            borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: D.muted,
          }}>
            <ArrowLeft size={18} />
          </button>
          <h2 style={{ color: D.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Pago con QR</h2>
        </div>

        {/* Card monto */}
        <div style={{
          background: `linear-gradient(135deg, #1e3a5f, #0f2a4a)`,
          borderRadius: 20, padding: 24, textAlign: 'center', marginBottom: 16,
          border: `1px solid rgba(56,189,248,0.25)`,
          boxShadow: `0 0 32px rgba(56,189,248,0.15)`,
        }}>
          <p style={{ color: 'rgba(148,163,184,0.9)', fontSize: 13, margin: '0 0 6px' }}>
            Monto de reserva estimado
          </p>
          <p style={{ color: '#fff', fontSize: 42, fontWeight: 800, margin: '0 0 6px',
            textShadow: `0 0 20px rgba(56,189,248,0.5)` }}>
            Bs. {total.toFixed(2)}
          </p>
          <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: 12, margin: 0 }}>
            El monto exacto se determina tras el pesaje (Bs. {PRECIO_KG}/kg)
          </p>
        </div>

        {/* QR de pago del productor */}
        <div style={{
          background: D.card, borderRadius: 20,
          border: `1px solid ${D.border}`, padding: 24, marginBottom: 14, textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <CreditCard size={20} color={D.primary} />
            <span style={{ fontWeight: 800, color: D.text, fontSize: 18 }}>QR de Pago</span>
          </div>
          <div style={{
            display: 'inline-block', padding: 12,
            border: `2px solid ${D.border}`, borderRadius: 16,
            background: 'rgba(56,189,248,0.04)',
            boxShadow: `0 0 24px rgba(56,189,248,0.1)`,
          }}>
            {productorQR ? (
              <img
                src={productorQR}
                alt={`QR de ${productorNombre}`}
                style={{ width: 192, height: 192, objectFit: 'contain', display: 'block', borderRadius: 8 }}
              />
            ) : (
              <div style={{
                width: 192, height: 192, background: 'rgba(56,189,248,0.05)', borderRadius: 8,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <QrCode size={48} color={D.dim} />
                <p style={{ color: D.muted, fontSize: 12, textAlign: 'center', margin: 0 }}>
                  El productor aún no<br />ha configurado su QR
                </p>
              </div>
            )}
          </div>

          <div style={{
            background: 'rgba(56,189,248,0.04)', borderRadius: 12, padding: 14,
            fontSize: 13, marginTop: 16, textAlign: 'left',
            border: `1px solid ${D.border}`,
          }}>
            {[
              ['Productor', productorNombre],
              ['Parada', paradaSeleccionada?.nombre || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0',
                borderBottom: `1px solid ${D.border}` }}>
                <span style={{ color: D.muted }}>{k}</span>
                <span style={{ color: D.text, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instrucciones */}
        <div style={{
          background: D.card, borderRadius: 16,
          border: `1px solid ${D.border}`, padding: 18, marginBottom: 14,
        }}>
          <p style={{ fontWeight: 700, color: D.text, margin: '0 0 14px', fontSize: 14 }}>¿Cómo pagar?</p>
          {[
            'Abre tu app bancaria o billetera digital',
            `Escanea el código QR del ${BANCO}`,
            `Ingresa el monto: Bs. ${total.toFixed(2)}`,
            'Confirma la transferencia',
            'Vuelve aquí y presiona "Ya realicé el pago"',
          ].map((paso, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(56,189,248,0.12)', border: `1px solid ${D.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ color: D.primary, fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: 13, color: D.muted }}>{paso}</span>
            </div>
          ))}
        </div>

        {/* Aviso */}
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.25)`,
          borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#fbbf24', marginBottom: 18,
        }}>
          El productor confirmará tu pago y pesará los pescados. Recibirás una notificación con el precio final para que apruebes antes de proceder.
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

        <button onClick={handleConfirmarPago} disabled={procesando} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: procesando ? D.dim : `linear-gradient(135deg, #16a34a, ${D.green})`,
          color: '#fff', border: 'none', borderRadius: 14, padding: '16px 0',
          fontSize: 16, fontWeight: 700, cursor: procesando ? 'not-allowed' : 'pointer',
          boxShadow: procesando ? 'none' : `0 0 28px rgba(34,197,94,0.35)`,
          transition: 'all 0.2s',
        }}>
          {procesando ? (
            <><RefreshCw size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Procesando...</>
          ) : (
            <><CheckCircle size={20} /> Ya realicé el pago</>
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

const PARADAS_FALLBACK = [
  { id: 1, nombre: 'Parada Villa Tunari',  descripcion: 'Parada principal del Chapare', lat: -16.677077,  lng: -65.627742  },
  { id: 2, nombre: 'Terminal Cochabamba', descripcion: 'Terminal de buses Cochabamba', lat: -17.4005875, lng: -66.1478935 },
]

export default Carrito
