"use client"
import { useState } from "react"
import { Tag, CheckCircle, X, Loader2 } from "lucide-react"
import api from "../../api/config/axios"
import { API_ENDPOINTS } from "../../config/apiConfig"
import { useTheme } from "../../contexts/ThemeContext"

/**
 * CuponInput — lets the user apply a discount coupon.
 *
 * Props:
 *   subtotal  number   — current cart total before discount
 *   onApply   fn       — called with { cupon, descuento, total } when valid
 *   onRemove  fn       — called when coupon is cleared
 */
const CuponInput = ({ subtotal = 0, onApply, onRemove }) => {
  const { D } = useTheme()
  const [code,    setCode]    = useState("")
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState(null)  // { cupon, descuento, total }
  const [error,   setError]   = useState("")

  const validate = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true); setError("")
    try {
      const r = await api.post(API_ENDPOINTS.CUPONES.VALIDAR, { codigo: trimmed, subtotal })
      const data = r.data?.data
      setApplied(data)
      onApply?.(data)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Cupón no válido")
    } finally {
      setLoading(false)
    }
  }

  const remove = () => {
    setApplied(null); setCode(""); setError("")
    onRemove?.()
  }

  if (applied) {
    return (
      <div style={{
        borderRadius: 12, padding: '12px 16px',
        background: 'rgba(74,222,128,0.08)',
        border: '1px solid rgba(74,222,128,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: '#4ade80', fontSize: 14 }}>
              {applied.cupon.codigo}
            </p>
            <p style={{ margin: 0, color: D.muted, fontSize: 12 }}>
              {applied.cupon.tipo === 'porcentaje'
                ? `${applied.cupon.valor}% de descuento`
                : `Bs ${applied.cupon.valor} de descuento`}
              {applied.cupon.descripcion ? ` · ${applied.cupon.descripcion}` : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, color: '#4ade80', fontSize: 15 }}>
            −Bs {applied.descuento.toFixed(2)}
          </span>
          <button onClick={remove}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.muted, padding: 4 }}>
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Tag size={15} style={{ position: 'absolute', left: 12, color: D.muted, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Código de cupón"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError("") }}
            onKeyDown={e => e.key === 'Enter' && validate()}
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
              borderRadius: 10, fontSize: 13, outline: 'none', letterSpacing: '0.05em',
              background: D.inputBg || 'rgba(255,255,255,0.05)',
              border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : D.border}`,
              color: D.text,
            }}
          />
        </div>
        <button
          onClick={validate}
          disabled={loading || !code.trim()}
          style={{
            padding: '10px 16px', borderRadius: 10, border: 'none', cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
            background: code.trim() ? `linear-gradient(135deg, ${D.primary}, ${D.teal})` : 'rgba(255,255,255,0.06)',
            color: code.trim() ? '#fff' : D.muted,
            fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            opacity: loading ? 0.7 : 1, transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Aplicar
        </button>
      </div>
      {error && (
        <p style={{ margin: '6px 0 0', color: D.red, fontSize: 12 }}>
          {error}
        </p>
      )}
    </div>
  )
}

export default CuponInput
