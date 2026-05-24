"use client"
import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Camera, RefreshCw, CheckCircle, XCircle, HelpCircle, ZoomIn, ExternalLink } from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"
import api from "../../api/config/axios"

const AnalizarFrescura = () => {
  const { D, isDark } = useTheme()
  const inputRef = useRef(null)
  const [dragging,   setDragging]   = useState(false)
  const [imagen,     setImagen]     = useState(null)   // { url, base64, file }
  const [analizando, setAnalizando] = useState(false)
  const [resultado,  setResultado]  = useState(null)
  const [error,      setError]      = useState(null)

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
  const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp']

  const cargarArchivo = useCallback(async (file) => {
    if (!file) return
    if (!TIPOS_VALIDOS.includes(file.type)) {
      setError('Formato no soportado. Usa JPG, PNG o WebP.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo permitido es 5 MB.`)
      return
    }
    const base64 = await fileToBase64(file)
    setImagen({ url: URL.createObjectURL(file), base64, mediaType: file.type })
    setResultado(null)
    setError(null)
  }, [])

  const onFileChange = (e) => cargarArchivo(e.target.files[0])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    cargarArchivo(e.dataTransfer.files[0])
  }

  const analizar = async () => {
    if (!imagen?.base64) return
    setAnalizando(true)
    setError(null)
    try {
      const { data } = await api.post('/pescado/analizar-frescura', {
        imageBase64: imagen.base64,
        mediaType: imagen.mediaType || 'image/jpeg',
      })
      setResultado(data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo analizar. Intenta de nuevo.')
    } finally {
      setAnalizando(false)
    }
  }

  const reiniciar = () => { setImagen(null); setResultado(null); setError(null) }

  const colorFrescura = resultado?.fresco === true ? '#22c55e'
    : resultado?.fresco === false ? '#ef4444' : '#f59e0b'

  const IconoFrescura = resultado?.fresco === true ? CheckCircle
    : resultado?.fresco === false ? XCircle : HelpCircle

  const etiqueta = resultado?.fresco === true ? '¡Pescado fresco!'
    : resultado?.fresco === false ? 'No está fresco' : 'No determinado'

  return (
    <div style={{ padding: '28px 24px', maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: D.text, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
          🔬 Analizar frescura del pescado
        </h1>
        <p style={{ color: D.muted, fontSize: 14, margin: 0 }}>
          Sube una foto del pescado y nuestra IA analiza sus indicadores visuales de frescura en segundos.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: imagen ? '1fr 1fr' : '1fr', gap: 20 }}>

        {/* Panel izquierdo: upload / preview */}
        <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!imagen ? (
            /* Zona de drop */
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? D.primary : D.border}`,
                borderRadius: 18,
                padding: '52px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging
                  ? (isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.04)')
                  : D.card,
                transition: 'all 0.2s',
              }}
            >
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
              <motion.div animate={{ y: dragging ? -6 : 0 }} transition={{ duration: 0.2 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 18px',
                  background: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
                  border: `1px solid ${D.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Upload size={30} color={D.primary} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, color: D.text, margin: '0 0 6px' }}>
                  {dragging ? 'Suelta la imagen aquí' : 'Arrastra una foto aquí'}
                </p>
                <p style={{ color: D.muted, fontSize: 13, margin: '0 0 18px' }}>o haz clic para seleccionar desde tu equipo</p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: D.primary, color: '#fff',
                  padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                }}>
                  <Camera size={15} /> Seleccionar imagen
                </div>
              </motion.div>

              {/* Tips */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 28, flexWrap: 'wrap' }}>
                {[
                  { icon: '💡', tip: 'Buena iluminación' },
                  { icon: '🔍', tip: 'Enfoca ojos y escamas' },
                  { icon: '📐', tip: 'Foto de cerca' },
                ].map(t => (
                  <div key={t.tip} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22 }}>{t.icon}</div>
                    <div style={{ fontSize: 11, color: D.muted, marginTop: 4 }}>{t.tip}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Preview de imagen */
            <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: D.card, border: `1px solid ${D.border}` }}>
              <img src={imagen.url} alt="Pescado" style={{ width: '100%', maxHeight: 380, objectFit: 'contain', display: 'block' }} />
              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8 }}>
                <a href={imagen.url} target="_blank" rel="noopener noreferrer"
                  style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  <ZoomIn size={13} /> Ver
                </a>
                {!analizando && (
                  <button onClick={reiniciar}
                    style={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <RefreshCw size={13} /> Cambiar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Botón analizar */}
          {imagen && !resultado && (
            <motion.button
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              onClick={analizar}
              disabled={analizando}
              style={{
                width: '100%', padding: '14px 0',
                background: analizando ? D.dim : 'linear-gradient(135deg,#16a34a,#22C55E)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontWeight: 800, fontSize: 15, cursor: analizando ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {analizando ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw size={18} />
                  </motion.div>
                  Analizando con IA...
                </>
              ) : (
                <> 🔬 Analizar frescura </>
              )}
            </motion.button>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 14px', color: '#f87171', fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Nuevo análisis */}
          {resultado && (
            <button onClick={reiniciar}
              style={{ width: '100%', padding: '11px 0', background: 'none', border: `1.5px solid ${D.primary}`, borderRadius: 12, color: D.primary, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RefreshCw size={15} /> Analizar otro pescado
            </button>
          )}
        </motion.div>

        {/* Panel derecho: resultado */}
        <AnimatePresence>
          {resultado && (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* Veredicto */}
              <div className="np-hover" style={{
                border: `2px solid ${colorFrescura}`,
                borderRadius: 18, overflow: 'hidden',
                background: D.card,
                boxShadow: `0 0 24px ${colorFrescura}20`,
              }}>
                {/* Header */}
                <div style={{
                  background: `${colorFrescura}18`,
                  padding: '20px 22px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  borderBottom: `1px solid ${colorFrescura}30`,
                }}>
                  <IconoFrescura size={52} color={colorFrescura} style={{ flexShrink: 0 }} />
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: colorFrescura, margin: '0 0 4px' }}>{etiqueta}</h2>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: D.muted, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 20 }}>
                        Puntaje: <strong style={{ color: D.text }}>{resultado.puntaje}/100</strong>
                      </span>
                      <span style={{ fontSize: 12, color: D.muted, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 20 }}>
                        Confianza: <strong style={{ color: D.text }}>{resultado.confianza}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Veredicto texto */}
                <p style={{ padding: '14px 22px 0', fontSize: 14, color: D.text, lineHeight: 1.6, margin: 0 }}>{resultado.veredicto}</p>

                {/* Indicadores */}
                <div style={{ padding: '14px 22px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
                    Indicadores analizados
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {Object.entries(resultado.indicadores || {}).map(([key, val], i, arr) => (
                      <div key={key} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                        padding: '9px 0',
                        borderBottom: i < arr.length - 1 ? `1px solid ${D.border}` : 'none',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: D.muted, flexShrink: 0 }}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        <span style={{ fontSize: 13, color: D.text, textAlign: 'right' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recomendación */}
                <div style={{
                  margin: '0 22px 20px',
                  padding: '12px 14px',
                  background: isDark ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.06)',
                  border: `1px solid rgba(34,197,94,0.2)`,
                  borderRadius: 10,
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                  <p style={{ fontSize: 13, color: D.text, margin: 0, lineHeight: 1.5 }}>{resultado.recomendacion}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Aviso */}
      <p style={{ fontSize: 12, color: D.dim, marginTop: 24, textAlign: 'center', lineHeight: 1.5 }}>
        ⚠️ Este análisis es orientativo y se basa en indicadores visuales. No reemplaza la inspección de un profesional.
      </p>
    </div>
  )
}

export default AnalizarFrescura
