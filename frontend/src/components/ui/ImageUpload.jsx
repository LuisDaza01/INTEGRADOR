"use client"
import { useState, useRef, useCallback } from "react"
import { Upload, X, Image as ImageIcon, Camera } from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"

/**
 * ImageUpload — drag-and-drop or click-to-select image picker.
 *
 * Props:
 *   value       string|null  — current image URL (for editing)
 *   onChange    fn(file)     — called when a new file is selected
 *   onRemove    fn()         — called when user clears the image
 *   label       string       — optional label above the zone
 *   maxMB       number       — max file size in MB (default 5)
 *   aspectRatio string       — CSS aspect-ratio hint (e.g. "1" for square, "16/9")
 *   disabled    boolean
 */
const ImageUpload = ({ value, onChange, onRemove, label, maxMB = 5, aspectRatio = '1', disabled = false }) => {
  const { D } = useTheme()
  const [drag,    setDrag]    = useState(false)
  const [error,   setError]   = useState("")
  const [preview, setPreview] = useState(value || null)
  const inputRef = useRef(null)

  const handleFile = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return }
    if (file.size > maxMB * 1024 * 1024) { setError(`Máximo ${maxMB} MB`); return }
    setError("")
    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange?.(file)
  }, [maxMB, onChange])

  const onInputChange = (e) => handleFile(e.target.files?.[0])

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false)
    if (disabled) return
    handleFile(e.dataTransfer.files?.[0])
  }

  const clear = (e) => {
    e.stopPropagation()
    setPreview(null); setError("")
    if (inputRef.current) inputRef.current.value = ""
    onRemove?.()
  }

  return (
    <div>
      {label && <p style={{ fontSize: 12, color: D.muted, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragEnter={() => !disabled && setDrag(true)}
        onDragLeave={() => setDrag(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        style={{
          position: 'relative', borderRadius: 14, overflow: 'hidden',
          aspectRatio, width: '100%', cursor: disabled ? 'default' : 'pointer',
          background: preview ? 'transparent' : (D.inputBg || 'rgba(255,255,255,0.04)'),
          border: `2px dashed ${drag ? D.primary : error ? 'rgba(248,113,113,0.5)' : D.border}`,
          transition: 'all 0.2s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: drag ? `0 0 20px ${D.primary}30` : 'none',
        }}>

        {preview ? (
          <>
            <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
              className="img-overlay">
              <button onClick={e => { e.stopPropagation(); !disabled && inputRef.current?.click() }}
                title="Cambiar imagen"
                style={{ opacity: 0, padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.9)', color: '#111', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                className="overlay-btn">
                <Camera size={14} /> Cambiar
              </button>
              {!disabled && (
                <button onClick={clear} title="Quitar imagen"
                  style={{ opacity: 0, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.9)', color: '#fff' }}
                  className="overlay-btn">
                  <X size={14} />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: D.inputBg || 'rgba(255,255,255,0.06)', border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {drag ? <Upload size={22} color={D.primary} /> : <ImageIcon size={22} color={D.muted} />}
            </div>
            <p style={{ color: D.muted, fontSize: 13, margin: 0, textAlign: 'center' }}>
              {drag ? 'Suelta para subir' : 'Arrastra una imagen o haz click'}
            </p>
            <p style={{ color: D.dim, fontSize: 11, margin: 0 }}>JPG, PNG, WEBP · Máx {maxMB} MB</p>
          </>
        )}
      </div>

      {error && <p style={{ color: D.red, fontSize: 12, marginTop: 6 }}>{error}</p>}

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onInputChange} />

      <style>{`
        .img-overlay:hover .overlay-btn { opacity: 1 !important; transition: opacity 0.2s; }
      `}</style>
    </div>
  )
}

export default ImageUpload
