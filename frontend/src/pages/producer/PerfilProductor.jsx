"use client"

import { useEffect, useState } from "react"
import {
  Save, Upload, X, Plus, Edit, Trash2, Calendar, Clock,
  MapPin, Award, Truck, Camera, Eye, EyeOff, Check, AlertCircle, QrCode,
} from "lucide-react"
import api from "../../api/config/axios"
import { API_ENDPOINTS } from "../../config/apiConfig"
import { useTheme } from "../../contexts/ThemeContext"

const InputField = ({ label, type = "text", value, onChange, placeholder, full }) => {
  const { D, isDark } = useTheme()
  const st = {
    width: '100%', padding: '8px 12px', background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 8, color: D.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    colorScheme: isDark ? 'dark' : 'light',
  }
  return (
    <div style={full ? { gridColumn: '1 / -1' } : {}}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: D.muted, marginBottom: 4 }}>{label}</label>
      <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={st}
        onFocus={e => e.target.style.borderColor = D.primary}
        onBlur={e => e.target.style.borderColor = D.border} />
    </div>
  )
}

const SelectField = ({ label, value, onChange, options }) => {
  const { D, isDark } = useTheme()
  const st = {
    width: '100%', padding: '8px 12px', background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 8, color: D.text, fontSize: 13, outline: 'none',
    colorScheme: isDark ? 'dark' : 'light',
  }
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: D.muted, marginBottom: 4 }}>{label}</label>
      <select value={value || ""} onChange={e => onChange(e.target.value)} style={st}>
        <option value="">Seleccionar...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

const MinutosConfirmacion = ({ D, valor, onSaved }) => {
  const [v, setV] = useState(String(valor ?? 20))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const guardar = async () => {
    const n = parseInt(v, 10)
    if (!Number.isFinite(n) || n < 5 || n > 60) {
      setMsg({ ok: false, txt: 'Debe ser entre 5 y 60 minutos' })
      return
    }
    setSaving(true); setMsg(null)
    try {
      await api.patch('/usuarios/minutos-confirmacion', { minutos: n })
      onSaved?.(n)
      setMsg({ ok: true, txt: `✓ Tiempo guardado: ${n} min` })
    } catch (e) {
      setMsg({ ok: false, txt: e.response?.data?.message || 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, padding: 18 }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: D.text, fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>
        <Clock size={16} style={{ color: D.primary }} /> Tiempo de espera para confirmación de precio
      </h3>
      <p style={{ fontSize: 12, color: D.muted, margin: '0 0 12px' }}>
        Cuando peses un pedido, el consumidor tendrá este tiempo (en minutos) para aceptar el precio final. Si no responde, el pedido se cancela y el stock vuelve. Mín 5, máx 60.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="number" min={5} max={60} value={v}
          onChange={e => setV(e.target.value)}
          style={{ width: 90, padding: '8px 10px', background: D.background || D.card, border: `1px solid ${D.border}`, color: D.text, borderRadius: 8, fontSize: 14, outline: 'none' }} />
        <span style={{ color: D.muted, fontSize: 13 }}>minutos</span>
        <button onClick={guardar} disabled={saving}
          style={{ marginLeft: 'auto', background: D.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
      {msg && (
        <p style={{ fontSize: 12, color: msg.ok ? '#22c55e' : '#ef4444', margin: '8px 0 0' }}>{msg.txt}</p>
      )}
    </div>
  )
}

const PerfilProductor = () => {
  const { D, isDark } = useTheme()
  const [activeSection, setActiveSection] = useState("informacion-basica")
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [galeriaCategoria, setGaleriaCategoria] = useState("general")
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [uploadingFotoPerfil, setUploadingFotoPerfil] = useState(false)
  const [uploadingFotoPortada, setUploadingFotoPortada] = useState(false)
  const [uploadingQR, setUploadingQR] = useState(false)
  const [formData, setFormData] = useState(null)
  const [fetching, setFetching] = useState(true)

  const diasSemana = [
    { key: "lunes",     label: "Lunes"     },
    { key: "martes",    label: "Martes"    },
    { key: "miercoles", label: "Miércoles" },
    { key: "jueves",    label: "Jueves"    },
    { key: "viernes",   label: "Viernes"   },
    { key: "sabado",    label: "Sábado"    },
    { key: "domingo",   label: "Domingo"   },
  ]

  const categoriasGaleria = [
    { id: "general",      label: "Criadero General",     icono: "🏞️" },
    { id: "alimentacion", label: "Alimentación a Peces", icono: "🐟" },
    { id: "captura",      label: "Captura de Peces",     icono: "🎣" },
    { id: "preparacion",  label: "Preparación de Peces", icono: "🔪" },
  ]

  const especialidadesDisponibles = [
    "Pescados de Agua Dulce", "Pescados de Agua Salada", "Mariscos", "Crustáceos",
    "Moluscos", "Acuicultura Orgánica", "Truchas Especializadas", "Salmón Premium",
    "Tilapia Comercial", "Productos Procesados", "Algas Marinas", "Peces Ornamentales",
  ]

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.PERFIL.PRODUCTOR)
        const data = response.data.data || response.data
        setFormData({
          nombre: data.nombre || "", email: data.email || "", telefono: data.telefono || "",
          ciudad: data.ciudad || "", direccion_completa: data.direccion_completa || "",
          years_experience: data.years_experience || 0, descripcion: data.descripcion || "",
          foto_perfil: data.foto_perfil || "", foto_portada: data.foto_portada || "",
          nombre_empresa: data.nombre_empresa || "", rfc: data.rfc || "",
          tipo_empresa: data.tipo_empresa || "", num_empleados: data.num_empleados || "",
          sitio_web: data.sitio_web || "", facebook: data.facebook || "",
          instagram: data.instagram || "", twitter: data.twitter || "",
          especialidades: data.especialidades || [],
          horario_atencion_inicio: data.horario_atencion_inicio || "08:00",
          horario_atencion_fin: data.horario_atencion_fin || "18:00",
          zona_horaria: data.zona_horaria || "America/Bogota",
          dias_venta: data.dias_venta || { lunes:false, martes:false, miercoles:false, jueves:false, viernes:false, sabado:false, domingo:false },
          dias_envio: data.dias_envio || { lunes:false, martes:false, miercoles:false, jueves:false, viernes:false, sabado:false, domingo:false },
          qr_pago_url: data.qr_pago_url || "",
          galeria_criadero: data.galeria_criadero || [], certificaciones: data.certificaciones || [],
          metodos_envio: data.metodos_envio || [], perfil_publico: data.perfil_publico || false,
          mostrar_telefono: data.mostrar_telefono || false, mostrar_email: data.mostrar_email || false,
          mostrar_direccion: data.mostrar_direccion || false,
          minutos_confirmacion: data.minutos_confirmacion ?? 20,
        })
      } catch (err) {
        console.error("Error al cargar perfil:", err)
        setFormData({
          nombre:"", email:"", telefono:"", ciudad:"", direccion_completa:"",
          years_experience:0, descripcion:"", foto_perfil:"", nombre_empresa:"", rfc:"",
          tipo_empresa:"", num_empleados:"", sitio_web:"", facebook:"", instagram:"", twitter:"",
          especialidades:[], horario_atencion_inicio:"08:00", horario_atencion_fin:"18:00",
          zona_horaria:"America/Bogota",
          dias_venta:{lunes:false,martes:false,miercoles:false,jueves:false,viernes:false,sabado:false,domingo:false},
          dias_envio:{lunes:false,martes:false,miercoles:false,jueves:false,viernes:false,sabado:false,domingo:false},
          galeria_criadero:[], certificaciones:[], metodos_envio:[],
          perfil_publico:false, mostrar_telefono:false, mostrar_email:false, mostrar_direccion:false,
        })
      } finally {
        setFetching(false)
      }
    }
    fetchPerfil()
  }, [])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setUnsavedChanges(true)
  }

  const handleDayToggle = (type, day) => {
    setFormData(prev => ({ ...prev, [type]: { ...prev[type], [day]: !prev[type][day] } }))
    setUnsavedChanges(true)
  }

  const handleToggleEspecialidad = (especialidad) => {
    setFormData(prev => ({
      ...prev,
      especialidades: prev.especialidades.includes(especialidad)
        ? prev.especialidades.filter(e => e !== especialidad)
        : [...prev.especialidades, especialidad],
    }))
    setUnsavedChanges(true)
  }

  const handleAddCertification = () => {
    setFormData(prev => ({ ...prev, certificaciones: [...prev.certificaciones, { id: Date.now(), nombre: "", fecha_obtencion: "", vigente: true }] }))
    setUnsavedChanges(true)
  }

  const handleRemoveCertification = (certId) => {
    setFormData(prev => ({ ...prev, certificaciones: prev.certificaciones.filter(c => c.id !== certId) }))
    setUnsavedChanges(true)
  }

  const handleUpdateCertification = (certId, field, value) => {
    setFormData(prev => ({ ...prev, certificaciones: prev.certificaciones.map(c => c.id === certId ? { ...c, [field]: value } : c) }))
    setUnsavedChanges(true)
  }

  const handleUpdateMetodoEnvio = (metodoId, field, value) => {
    setFormData(prev => ({ ...prev, metodos_envio: prev.metodos_envio.map(m => m.id === metodoId ? { ...m, [field]: value } : m) }))
    setUnsavedChanges(true)
  }

  const handleSubirFotoPerfil = async (e) => {
    const file = e.target.files[0]; e.target.value = ""
    if (!file) return
    try {
      setUploadingFotoPerfil(true)
      const fd = new FormData(); fd.append("foto", file)
      const res = await api.post(API_ENDPOINTS.FOTOS.PERFIL, fd)
      setFormData(prev => ({ ...prev, foto_perfil: res.data.data?.foto_perfil || res.data.foto_perfil }))
    } catch (err) { console.error(err); alert("Error al subir foto de perfil.") }
    finally { setUploadingFotoPerfil(false) }
  }

  const handleSubirQRPago = async (e) => {
    const file = e.target.files[0]; e.target.value = ""
    if (!file) return
    try {
      setUploadingQR(true)
      const fd = new FormData(); fd.append("qr", file)
      const res = await api.post(API_ENDPOINTS.FOTOS.QR_PAGO, fd)
      setFormData(prev => ({ ...prev, qr_pago_url: res.data.data?.qr_pago_url || res.data.qr_pago_url }))
    } catch (err) { console.error(err); alert("Error al subir QR de pago.") }
    finally { setUploadingQR(false) }
  }

  const handleSubirFotoPortada = async (e) => {
    const file = e.target.files[0]; e.target.value = ""
    if (!file) return
    try {
      setUploadingFotoPortada(true)
      const fd = new FormData(); fd.append("foto", file)
      const res = await api.post(API_ENDPOINTS.FOTOS.PORTADA, fd)
      setFormData(prev => ({ ...prev, foto_portada: res.data.data?.foto_portada || res.data.foto_portada }))
    } catch (err) { console.error(err); alert("Error al subir foto de portada.") }
    finally { setUploadingFotoPortada(false) }
  }

  const handleSubirMedia = async (e) => {
    const file = e.target.files[0]; e.target.value = ""
    if (!file) return
    try {
      setUploadingMedia(true)
      const fd = new FormData(); fd.append("media", file); fd.append("categoria", galeriaCategoria)
      const res = await api.post(API_ENDPOINTS.GALERIA.BASE, fd)
      setFormData(prev => ({ ...prev, galeria_criadero: res.data.data?.galeria || [] }))
    } catch (err) { console.error(err); alert("Error al subir archivo.") }
    finally { setUploadingMedia(false) }
  }

  const handleEliminarGaleria = async (globalIndex) => {
    if (!window.confirm("¿Eliminar este archivo de la galería?")) return
    try {
      const res = await api.delete(API_ENDPOINTS.GALERIA.ELIMINAR(globalIndex))
      setFormData(prev => ({ ...prev, galeria_criadero: res.data.data?.galeria || [] }))
    } catch (err) { console.error(err); alert("Error al eliminar archivo.") }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const dataToSend = { ...formData }
      if (!dataToSend.ciudad?.trim() || dataToSend.ciudad.trim().length < 2) delete dataToSend.ciudad
      if (!dataToSend.sitio_web?.trim()) delete dataToSend.sitio_web
      if (!dataToSend.telefono?.trim()) delete dataToSend.telefono
      if (!dataToSend.nombre_empresa?.trim()) delete dataToSend.nombre_empresa
      if (!dataToSend.descripcion?.trim()) delete dataToSend.descripcion
      await api.put(API_ENDPOINTS.PERFIL.PRODUCTOR, dataToSend)
      alert("✅ Perfil actualizado correctamente")
      setUnsavedChanges(false)
    } catch (error) {
      console.error("Error al guardar:", error)
      alert("Error al guardar los cambios")
    } finally {
      setLoading(false)
    }
  }

  // ─── Style helpers ────────────────────────────────────────────────────────
  const sectionCardSt = { background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 24 }
  const inputSt = {
    width: '100%', padding: '8px 12px', background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 8, color: D.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    colorScheme: isDark ? 'dark' : 'light',
  }
  const selectSt = { ...inputSt, boxSizing: 'border-box' }
  const labelSt = { display: 'block', fontSize: 13, fontWeight: 500, color: D.muted, marginBottom: 4 }
  const sectionTitleSt = { fontSize: 14, fontWeight: 700, color: D.text, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }
  const focusBorder = e => e.target.style.borderColor = D.primary
  const blurBorder  = e => e.target.style.borderColor = D.border

  if (!formData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${D.border}`, borderTopColor: D.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  const tabs = [
    { id: "informacion-basica",       label: "Información Básica",       icon: <MapPin  size={15} /> },
    { id: "horarios-disponibilidad",  label: "Horarios y Disponibilidad", icon: <Calendar size={15} /> },
    { id: "galeria-criadero",         label: "Galería del Criadero",     icon: <Camera  size={15} /> },
    { id: "certificaciones",          label: "Certificaciones",          icon: <Award   size={15} /> },
    { id: "metodos-envio",            label: "Métodos de Envío",         icon: <Truck   size={15} /> },
    { id: "configuracion-avanzada",   label: "Configuración Avanzada",   icon: <Edit    size={15} /> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: D.text, margin: '0 0 4px' }}>Configuración del Perfil</h1>
          <p style={{ fontSize: 13, color: D.muted, margin: 0 }}>Gestiona tu información, productos y configuración de venta</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowPreview(!showPreview)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, fontSize: 13, cursor: 'pointer' }}>
            {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
            {showPreview ? "Ocultar" : "Vista Previa"}
          </button>
          <button onClick={handleSave} disabled={!unsavedChanges || loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: unsavedChanges && !loading ? 'pointer' : 'not-allowed',
              background: unsavedChanges && !loading ? `linear-gradient(135deg,${D.primary},${D.teal})` : D.dim }}>
            {loading ? <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      {/* Aviso cambios sin guardar */}
      {unsavedChanges && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 8 }}>
          <AlertCircle size={15} style={{ color: '#facc15' }} />
          <span style={{ fontSize: 13, color: '#facc15' }}>Tienes cambios sin guardar</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12 }}>
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${D.border}` }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '14px 20px',
                fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', background: 'none',
                border: 'none', borderBottom: `2px solid ${activeSection === tab.id ? D.primary : 'transparent'}`,
                color: activeSection === tab.id ? D.primary : D.muted, cursor: 'pointer',
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Información Básica ── */}
      {activeSection === "informacion-basica" && (
        <div style={sectionCardSt}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 24px' }}>Información Básica</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 24, alignItems: 'start' }}>
            {/* Fotos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Foto de perfil */}
              <div style={{ textAlign: 'center' }}>
                <p style={labelSt}>Foto de Perfil</p>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${D.border}`, margin: '0 auto' }}>
                    {formData.foto_perfil ? (
                      <img src={formData.foto_perfil} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg,${D.primary},${D.teal})` }}>
                        <span style={{ color: '#fff', fontSize: 32, fontWeight: 800 }}>{formData.nombre?.charAt(0) || 'P'}</span>
                      </div>
                    )}
                  </div>
                  <label style={{ position: 'absolute', bottom: 0, right: 0, background: D.primary, color: '#fff', padding: 8, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {uploadingFotoPerfil
                      ? <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      : <Camera size={14} />}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSubirFotoPerfil} disabled={uploadingFotoPerfil} />
                  </label>
                </div>
                <p style={{ marginTop: 6, fontSize: 11, color: D.dim }}>Clic en la cámara para cambiar</p>
              </div>

              {/* Foto de portada */}
              <div>
                <p style={labelSt}>Foto de Portada (Banner)</p>
                <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 12, overflow: 'hidden', background: `linear-gradient(135deg,${D.primary},${D.teal})` }}>
                  {formData.foto_portada && <img src={formData.foto_portada} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.9)', color: D.primary, padding: '6px 12px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      {uploadingFotoPortada
                        ? <><div style={{ width: 14, height: 14, border: `2px solid ${D.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><span>Subiendo…</span></>
                        : <><Upload size={14} /><span>{formData.foto_portada ? 'Cambiar portada' : 'Subir portada'}</span></>}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSubirFotoPortada} disabled={uploadingFotoPortada} />
                    </label>
                  </div>
                </div>
                <p style={{ marginTop: 4, fontSize: 11, color: D.dim }}>Imagen panorámica del banner</p>
              </div>

              {/* QR de pago */}
              <div>
                <p style={labelSt}>QR de Pago</p>
                <div style={{ border: `2px dashed ${D.border}`, borderRadius: 12, padding: 16, textAlign: 'center', background: 'rgba(56,189,248,0.02)' }}>
                  {formData.qr_pago_url ? (
                    <img src={formData.qr_pago_url} alt="QR de pago" style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 8, marginBottom: 8 }} />
                  ) : (
                    <div style={{ width: 120, height: 120, background: D.surface, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                      <QrCode size={40} color={D.dim} />
                    </div>
                  )}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: D.primary, color: '#fff', padding: '7px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: uploadingQR ? 'not-allowed' : 'pointer', opacity: uploadingQR ? 0.7 : 1 }}>
                    {uploadingQR
                      ? <><div style={{ width: 13, height: 13, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><span>Subiendo…</span></>
                      : <><Upload size={14} /><span>{formData.qr_pago_url ? 'Cambiar QR' : 'Subir QR'}</span></>}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSubirQRPago} disabled={uploadingQR} />
                  </label>
                  <p style={{ marginTop: 8, fontSize: 11, color: D.dim }}>Los consumidores escanearán este QR al pagar</p>
                </div>
              </div>
            </div>

            {/* Campos */}
            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
              <InputField label="Nombre Completo"      value={formData.nombre}             onChange={v => handleInputChange("nombre", v)} />
              <InputField label="Correo Electrónico"   type="email" value={formData.email} onChange={v => handleInputChange("email", v)} />
              <InputField label="Teléfono"             type="tel"   value={formData.telefono} onChange={v => handleInputChange("telefono", v)} />
              <InputField label="Ciudad"               value={formData.ciudad}             onChange={v => handleInputChange("ciudad", v)} />
              <InputField label="Dirección Completa"   value={formData.direccion_completa} onChange={v => handleInputChange("direccion_completa", v)} full />
              <InputField label="Años de Experiencia"  type="number" value={formData.years_experience} onChange={v => handleInputChange("years_experience", parseInt(v))} />
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelSt}>Descripción</label>
                <textarea rows={4} value={formData.descripcion} onChange={e => handleInputChange("descripcion", e.target.value)}
                  placeholder="Describe tu experiencia, especialidades y lo que hace único a tu negocio..."
                  style={{ ...inputSt, resize: 'vertical' }} onFocus={focusBorder} onBlur={blurBorder} />
              </div>
            </div>
          </div>

          {/* Información de empresa */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${D.border}` }}>
            <h3 style={sectionTitleSt}>Información de Empresa</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
              <InputField label="Nombre de la Empresa" value={formData.nombre_empresa} onChange={v => handleInputChange("nombre_empresa", v)} />
              <InputField label="RFC/NIT"              value={formData.rfc}            onChange={v => handleInputChange("rfc", v)} />
              <SelectField label="Tipo de Empresa"     value={formData.tipo_empresa}   onChange={v => handleInputChange("tipo_empresa", v)} options={["Microempresa","Pequeña Empresa","Mediana Empresa","Gran Empresa"]} />
              <SelectField label="Número de Empleados" value={formData.num_empleados}  onChange={v => handleInputChange("num_empleados", v)} options={["1-4","5-10","11-50","51-200","201+"]} />
              <InputField label="Sitio Web"            type="url" value={formData.sitio_web} onChange={v => handleInputChange("sitio_web", v)} />
            </div>
          </div>

          {/* Redes sociales */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${D.border}` }}>
            <h3 style={sectionTitleSt}>Redes Sociales</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
              {[
                { label: "Facebook",  base: "facebook.com/",  field: "facebook"  },
                { label: "Instagram", base: "instagram.com/", field: "instagram" },
                { label: "Twitter",   base: "twitter.com/",   field: "twitter"   },
              ].map(({ label, base, field }) => (
                <div key={field}>
                  <label style={labelSt}>{label}</label>
                  <div style={{ display: 'flex' }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: D.surface, border: `1px solid ${D.border}`, borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: 12, color: D.dim, whiteSpace: 'nowrap' }}>
                      {base}
                    </span>
                    <input type="text" value={formData[field]} onChange={e => handleInputChange(field, e.target.value)}
                      style={{ ...inputSt, borderRadius: '0 8px 8px 0', flex: 1, width: 'auto' }}
                      onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Especialidades */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${D.border}` }}>
            <h3 style={sectionTitleSt}>Especialidades</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
              {especialidadesDisponibles.map(esp => (
                <label key={esp} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.especialidades.includes(esp)} onChange={() => handleToggleEspecialidad(esp)}
                    style={{ accentColor: D.primary, width: 15, height: 15 }} />
                  <span style={{ fontSize: 13, color: D.text }}>{esp}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Horarios y Disponibilidad ── */}
      {activeSection === "horarios-disponibilidad" && (
        <div style={sectionCardSt}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 24px' }}>Horarios y Disponibilidad</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Horario de atención */}
            <div>
              <h3 style={sectionTitleSt}><Clock size={18} style={{ color: D.primary }} /> Horario de Atención</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                <InputField label="Hora de Inicio" type="time" value={formData.horario_atencion_inicio} onChange={v => handleInputChange("horario_atencion_inicio", v)} />
                <InputField label="Hora de Fin"    type="time" value={formData.horario_atencion_fin}    onChange={v => handleInputChange("horario_atencion_fin", v)} />
                <SelectField label="Zona Horaria"  value={formData.zona_horaria} onChange={v => handleInputChange("zona_horaria", v)}
                  options={["America/Bogota","America/Mexico_City","America/Lima","America/Santiago"]} />
              </div>
            </div>

            {/* Tiempo de confirmación de precio */}
            <MinutosConfirmacion
              D={D}
              valor={formData.minutos_confirmacion ?? 20}
              onSaved={(v) => handleInputChange("minutos_confirmacion", v)}
            />

            {/* Días de venta */}
            {[
              { type: "dias_venta", title: "Días de Venta",  desc: "Selecciona los días en que aceptas pedidos", activeColor: '#4ade80', activeBg: 'rgba(74,222,128,0.1)', icon: <Calendar size={18} style={{ color: '#4ade80' }} /> },
              { type: "dias_envio", title: "Días de Envío",  desc: "Selecciona los días en que realizas entregas",  activeColor: D.primary, activeBg: `rgba(56,189,248,0.1)`, icon: <Truck size={18} style={{ color: D.primary }} /> },
            ].map(({ type, title, desc, activeColor, activeBg, icon }) => (
              <div key={type}>
                <h3 style={sectionTitleSt}>{icon} {title}</h3>
                <p style={{ fontSize: 13, color: D.muted, marginBottom: 12 }}>{desc}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 10 }}>
                  {diasSemana.map(dia => {
                    const active = formData[type]?.[dia.key]
                    return (
                      <label key={dia.key} onClick={() => handleDayToggle(type, dia.key)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px', border: `2px solid ${active ? activeColor : D.border}`, borderRadius: 10, cursor: 'pointer', background: active ? activeBg : D.surface, transition: 'all 0.15s' }}>
                        <input type="checkbox" checked={!!active} onChange={() => {}} style={{ display: 'none' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: active ? activeColor : D.muted }}>{dia.label}</span>
                        {active && <Check size={14} style={{ color: activeColor, marginTop: 4 }} />}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Galería del Criadero ── */}
      {activeSection === "galeria-criadero" && (
        <div style={sectionCardSt}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 6px' }}>Galería del Criadero</h2>
          <p style={{ fontSize: 13, color: D.muted, margin: '0 0 20px' }}>
            Sube fotos y videos organizados por sección. Los consumidores verán esta galería en tu perfil público.
          </p>

          {/* Tabs de categorías */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${D.border}`, marginBottom: 20, overflowX: 'auto' }}>
            {categoriasGaleria.map(cat => {
              const count = formData.galeria_criadero.filter(i => (i.categoria || "general") === cat.id).length
              const active = galeriaCategoria === cat.id
              return (
                <button key={cat.id} onClick={() => setGaleriaCategoria(cat.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', background: 'none', border: 'none', borderBottom: `2px solid ${active ? D.primary : 'transparent'}`, color: active ? D.primary : D.muted, cursor: 'pointer' }}>
                  <span>{cat.icono}</span>
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span style={{ background: 'rgba(56,189,248,0.15)', color: D.primary, borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Zona de upload */}
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: 120, border: `2px dashed ${uploadingMedia ? D.primary : D.border}`, borderRadius: 12, cursor: uploadingMedia ? 'not-allowed' : 'pointer', marginBottom: 20, background: uploadingMedia ? 'rgba(56,189,248,0.05)' : 'transparent', transition: 'all 0.2s' }}>
            {uploadingMedia ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: D.primary }}>
                <div style={{ width: 22, height: 22, border: `2px solid ${D.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Subiendo archivo...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: D.muted }}>
                <Upload size={26} style={{ marginBottom: 8 }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Haz clic para subir en "{categoriasGaleria.find(c => c.id === galeriaCategoria)?.label}"
                </span>
                <span style={{ fontSize: 11, marginTop: 4, color: D.dim }}>JPG, PNG, WEBP, MP4, MOV — hasta 100 MB</span>
              </div>
            )}
            <input type="file" style={{ display: 'none' }} accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" disabled={uploadingMedia} onChange={handleSubirMedia} />
          </label>

          {/* Grid de items */}
          {(() => {
            const items = formData.galeria_criadero.map((item, i) => ({ item, i })).filter(({ item }) => (item.categoria || "general") === galeriaCategoria)
            if (items.length === 0) return (
              <div style={{ textAlign: 'center', padding: '40px 0', color: D.muted }}>
                <Camera size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>No hay archivos en esta sección. Sube tu primera imagen o video.</p>
              </div>
            )
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                {items.map(({ item, i }) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: D.surface, aspectRatio: '1', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.querySelector('.overlay').style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.querySelector('.overlay').style.opacity = '0'}>
                    {item.tipo === "video" ? (
                      <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline
                        onMouseEnter={e => e.target.play()} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0 }} />
                    ) : (
                      <img src={item.url} alt={item.titulo || "Galería"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 10 }}>
                      <button onClick={() => handleEliminarGaleria(i)}
                        style={{ alignSelf: 'flex-end', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', padding: 5, cursor: 'pointer', display: 'flex' }}>
                        <X size={12} />
                      </button>
                      <div>
                        {item.titulo && <p style={{ fontSize: 11, color: '#fff', fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.titulo}</p>}
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{item.tipo === "video" ? "🎬 Video" : "📷 Imagen"}</span>
                      </div>
                    </div>
                    {item.tipo === "video" && (
                      <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 20, pointerEvents: 'none' }}>Video</div>
                    )}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Certificaciones ── */}
      {activeSection === "certificaciones" && (
        <div style={sectionCardSt}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: 0 }}>Certificaciones</h2>
            <button onClick={handleAddCertification}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: `linear-gradient(135deg,${D.primary},${D.teal})`, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} /> Agregar Certificación
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {formData.certificaciones.map(cert => (
              <div key={cert.id} style={{ border: `1px solid ${D.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
                  <div>
                    <label style={labelSt}>Nombre de la Certificación</label>
                    <input type="text" value={cert.nombre} onChange={e => handleUpdateCertification(cert.id, "nombre", e.target.value)}
                      placeholder="ej: Certificación Orgánica" style={inputSt} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                  <div>
                    <label style={labelSt}>Fecha de Obtención</label>
                    <input type="date" value={cert.fecha_obtencion} onChange={e => handleUpdateCertification(cert.id, "fecha_obtencion", e.target.value)}
                      style={inputSt} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 2 }}>
                    <input type="checkbox" checked={cert.vigente} onChange={e => handleUpdateCertification(cert.id, "vigente", e.target.checked)}
                      style={{ accentColor: '#4ade80', width: 15, height: 15 }} />
                    <span style={{ fontSize: 13, color: D.text }}>Vigente</span>
                  </label>
                  <button onClick={() => handleRemoveCertification(cert.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {formData.certificaciones.length === 0 && (
              <p style={{ fontSize: 13, color: D.muted, textAlign: 'center', padding: 20 }}>No hay certificaciones. Agrega una.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Métodos de Envío ── */}
      {activeSection === "metodos-envio" && (
        <div style={sectionCardSt}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 20px' }}>Métodos de Envío</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {formData.metodos_envio.map(metodo => (
              <div key={metodo.id} style={{ border: `1px solid ${D.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, alignItems: 'end' }}>
                  <div>
                    <label style={labelSt}>Método de Envío</label>
                    <input type="text" value={metodo.nombre} onChange={e => handleUpdateMetodoEnvio(metodo.id, "nombre", e.target.value)}
                      style={inputSt} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                  <div>
                    <label style={labelSt}>Costo (Bs)</label>
                    <input type="number" step="0.01" value={metodo.costo} onChange={e => handleUpdateMetodoEnvio(metodo.id, "costo", parseFloat(e.target.value))}
                      style={inputSt} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                  <div>
                    <label style={labelSt}>Tiempo de Entrega</label>
                    <input type="text" value={metodo.tiempo_entrega} onChange={e => handleUpdateMetodoEnvio(metodo.id, "tiempo_entrega", e.target.value)}
                      placeholder="ej: 1-2 días" style={inputSt} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={metodo.activo} onChange={e => handleUpdateMetodoEnvio(metodo.id, "activo", e.target.checked)}
                      style={{ accentColor: D.primary, width: 15, height: 15 }} />
                    <span style={{ fontSize: 13, color: D.text }}>Activo</span>
                  </label>
                </div>
              </div>
            ))}
            {formData.metodos_envio.length === 0 && (
              <p style={{ fontSize: 13, color: D.muted, textAlign: 'center', padding: 20 }}>No hay métodos de envío configurados.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Configuración Avanzada ── */}
      {activeSection === "configuracion-avanzada" && (
        <div style={sectionCardSt}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 24px' }}>Configuración Avanzada</h2>
          <div>
            <h3 style={sectionTitleSt}>Visibilidad del Perfil</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { field: "perfil_publico",    label: "Perfil público",    desc: "Tu perfil será visible para todos los consumidores" },
                { field: "mostrar_telefono",  label: "Mostrar teléfono",  desc: "Los consumidores podrán ver tu número de teléfono" },
                { field: "mostrar_email",     label: "Mostrar email",     desc: "Los consumidores podrán ver tu correo electrónico" },
                { field: "mostrar_direccion", label: "Mostrar dirección", desc: "Los consumidores podrán ver tu ubicación" },
              ].map(({ field, label, desc }) => (
                <label key={field} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData[field]} onChange={e => handleInputChange(field, e.target.checked)}
                    style={{ accentColor: D.primary, width: 16, height: 16, marginTop: 2 }} />
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: D.text, display: 'block' }}>{label}</span>
                    <span style={{ fontSize: 13, color: D.muted }}>{desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerfilProductor
