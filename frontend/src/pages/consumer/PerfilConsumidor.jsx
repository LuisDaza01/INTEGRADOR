"use client"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  User, Mail, Phone, MapPin, Calendar, Edit, Save,
  CreditCard, Home, ShoppingBag, Heart, Lock, X,
  Shield, Sliders, ListChecks, Plus, Trash, Loader, Camera,
} from "lucide-react"
import axios from "../../api/config/axios"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"

const PerfilConsumidor = () => {
  const { user } = useAuth()
  const { D, isDark } = useTheme()
  const [activeSection, setActiveSection] = useState("personal")
  const [editMode, setEditMode]     = useState(false)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const [fotoPerfil, setFotoPerfil]       = useState(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const fileInputRef = useRef(null)

  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', nuevo: '', confirmar: '' })
  const [pwError, setPwError]     = useState(null)
  const [pwSuccess, setPwSuccess] = useState(null)
  const [pwSaving, setPwSaving]   = useState(false)

  const [formData, setFormData] = useState({
    nombre: "", email: "", telefono: "", direccion: "", fechaRegistro: "",
    direcciones: [
      { id: 1, nombre: "Casa",    direccion: "Av. Principal 123",  ciudad: "Ciudad del Lago", codigoPostal: "12345", telefono: "+591 123 456 789", predeterminada: true },
      { id: 2, nombre: "Trabajo", direccion: "Calle Comercial 45", ciudad: "Ciudad del Lago", codigoPostal: "12345", telefono: "+591 987 654 321", predeterminada: false },
    ],
    metodosPago: [
      { id: 1, tipo: "Tarjeta de crédito", numero: "•••• •••• •••• 4567", titular: "Usuario", expiracion: "12/25", predeterminado: true },
      { id: 2, tipo: "PayPal", email: "usuario@example.com", predeterminado: false },
    ],
    preferencias: {
      notificacionesEmail: true,
      notificacionesPush: true,
      notificacionesSMS: false,
      boletinNoticias: true,
      ofertas: true,
    },
    dispositivosConectados: [
      { id: 1, nombre: "iPhone 13",   ubicacion: "Ciudad del Lago", ultimoAcceso: "Hoy, 10:30 AM" },
      { id: 2, nombre: "MacBook Pro", ubicacion: "Ciudad del Lago", ultimoAcceso: "Ayer, 18:45 PM" },
    ],
  })

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        setLoading(true)
        const res  = await axios.get("/usuarios/perfil")
        const data = res.data.data || res.data
        setFormData(prev => ({
          ...prev,
          nombre:        data.nombre       || "",
          email:         data.email        || "",
          telefono:      data.telefono     || "",
          direccion:     data.direccion    || "",
          fechaRegistro: data.created_at
            ? new Date(data.created_at).toLocaleDateString("es-BO")
            : "",
        }))
        if (data.foto_perfil) setFotoPerfil(data.foto_perfil)
      } catch { setError("No se pudo cargar el perfil") }
      finally  { setLoading(false) }
    }
    if (user) fetchPerfil()
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    try {
      setSaving(true); setError(null)
      await axios.put("/usuarios/perfil", {
        nombre: formData.nombre, email: formData.email,
        telefono: formData.telefono, direccion: formData.direccion,
      })
      setSuccessMsg("Perfil actualizado correctamente")
      setEditMode(false)
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar los cambios")
    } finally { setSaving(false) }
  }

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingFoto(true)
      const fd = new FormData()
      fd.append('foto', file)
      const res = await axios.put('/usuarios/foto-perfil', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = res.data?.data?.foto_perfil || res.data?.foto_perfil
      if (url) setFotoPerfil(url)
      setSuccessMsg('Foto de perfil actualizada')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch { setError('No se pudo subir la foto') }
    finally  { setUploadingFoto(false); e.target.value = '' }
  }

  const handleCambiarPassword = async (e) => {
    e?.preventDefault()
    if (pwForm.nuevo !== pwForm.confirmar) { setPwError('Las contraseñas no coinciden'); return }
    if (pwForm.nuevo.length < 6)           { setPwError('Mínimo 6 caracteres'); return }
    try {
      setPwSaving(true); setPwError(null)
      await axios.put('/usuarios/cambiar-password', {
        currentPassword: pwForm.current, newPassword: pwForm.nuevo,
      })
      setPwSuccess('Contraseña actualizada correctamente')
      setPwForm({ current: '', nuevo: '', confirmar: '' })
      setTimeout(() => setPwSuccess(null), 3000)
    } catch (err) {
      setPwError(err.response?.data?.message || 'Error al cambiar la contraseña')
    } finally { setPwSaving(false) }
  }

  // ─── Styles ────────────────────────────────────────────────────────────────
  const card  = { background: isDark ? 'rgba(255,255,255,0.03)' : D.surface, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }
  const title = { fontSize: 15, fontWeight: 700, color: D.text, margin: '0 0 16px' }
  const sub   = { fontSize: 13, fontWeight: 600, color: D.text, margin: '20px 0 10px' }
  const lbl   = { display: 'block', fontSize: 12, fontWeight: 600, color: D.muted, marginBottom: 5 }
  const inp   = { width: '100%', padding: '9px 12px', background: isDark ? 'rgba(56,189,248,0.05)' : D.bg, border: `1px solid ${D.border}`, borderRadius: 10, color: D.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const primBtn = { display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:10, background:`linear-gradient(135deg,${D.primary},${D.teal})`, color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:13 }
  const addBtn  = { display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, background:`linear-gradient(135deg,${D.primary},${D.teal})`, color:'#fff', border:'none', cursor:'pointer', fontWeight:600, fontSize:12 }
  const iconBtn = { padding:6, background:'none', border:'none', cursor:'pointer', color:D.muted, display:'flex', alignItems:'center' }

  const renderToggle = (checked, onChange) => (
    <div style={{ position:'relative', display:'inline-block', width:40, height:22, cursor:'pointer', flexShrink:0 }} onClick={onChange}>
      <div style={{ position:'absolute', inset:0, borderRadius:11, background: checked ? D.primary : D.dim, transition:'background 0.2s' }} />
      <div style={{ position:'absolute', top:2, left: checked ? 20 : 2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
    </div>
  )

  // ─── Section renderers ─────────────────────────────────────────────────────
  const renderPersonal = () => (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
      <h3 style={title}>Información Personal</h3>
      <div style={card}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20 }}>
          {[
            { label:'Nombre Completo',   name:'nombre',   type:'text',  icon:User,   val:formData.nombre },
            { label:'Correo Electrónico',name:'email',    type:'email', icon:Mail,   val:formData.email },
            { label:'Teléfono',          name:'telefono', type:'text',  icon:Phone,  val:formData.telefono },
            { label:'Dirección Principal',name:'direccion',type:'text', icon:MapPin, val:formData.direccion },
          ].map(({ label, name, type, icon:Icon, val }) => (
            <div key={name}>
              <label style={lbl}>{label}</label>
              {editMode ? (
                <input type={type} name={name} value={val} onChange={handleChange} style={inp} />
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Icon size={15} style={{ color:D.muted, flexShrink:0 }} />
                  <span style={{ color:D.text, fontSize:14 }}>{val || '—'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:8, paddingTop:14, borderTop:`1px solid ${D.border}` }}>
          <Calendar size={15} style={{ color:D.muted }} />
          <span style={{ fontSize:13, color:D.muted }}>Miembro desde: <strong style={{ color:D.text }}>{formData.fechaRegistro || '—'}</strong></span>
        </div>
      </div>
    </motion.div>
  )

  const renderDirecciones = () => (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ ...title, margin:0 }}>Mis Direcciones</h3>
        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} style={addBtn}><Plus size={14}/> Añadir dirección</motion.button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {formData.direcciones.map(dir => (
          <motion.div key={dir.id} whileHover={{ y:-2 }}
            style={{ background: isDark ? 'rgba(255,255,255,0.03)' : D.surface, borderRadius:12, padding:16, border:`1.5px solid ${dir.predeterminada ? D.primary : D.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <h4 style={{ fontWeight:700, color:D.text, margin:0, fontSize:14 }}>{dir.nombre}</h4>
                  {dir.predeterminada && <span style={{ padding:'2px 8px', background:`rgba(56,189,248,0.15)`, color:D.primary, fontSize:11, borderRadius:20, fontWeight:600 }}>Predeterminada</span>}
                </div>
                <p style={{ color:D.muted, fontSize:13, margin:'0 0 2px' }}>{dir.direccion}</p>
                <p style={{ color:D.muted, fontSize:13, margin:'0 0 2px' }}>{dir.ciudad}, {dir.codigoPostal}</p>
                <p style={{ color:D.muted, fontSize:13, margin:0 }}>{dir.telefono}</p>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                <motion.button whileHover={{ scale:1.1 }} style={iconBtn}><Edit size={15}/></motion.button>
                <motion.button whileHover={{ scale:1.1 }} style={{ ...iconBtn, color:D.red }}><Trash size={15}/></motion.button>
              </div>
            </div>
            {!dir.predeterminada && (
              <button style={{ marginTop:10, background:'none', border:'none', cursor:'pointer', color:D.primary, fontWeight:600, fontSize:12, padding:0 }}>
                Establecer como predeterminada
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )

  const renderPagos = () => (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ ...title, margin:0 }}>Métodos de Pago</h3>
        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} style={addBtn}><Plus size={14}/> Añadir método</motion.button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {formData.metodosPago.map(m => (
          <motion.div key={m.id} whileHover={{ y:-2 }}
            style={{ background: isDark ? 'rgba(255,255,255,0.03)' : D.surface, borderRadius:12, padding:16, border:`1.5px solid ${m.predeterminado ? D.primary : D.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <CreditCard size={16} style={{ color:D.muted }}/>
                  <h4 style={{ fontWeight:700, color:D.text, margin:0, fontSize:14 }}>{m.tipo}</h4>
                  {m.predeterminado && <span style={{ padding:'2px 8px', background:`rgba(56,189,248,0.15)`, color:D.primary, fontSize:11, borderRadius:20, fontWeight:600 }}>Predeterminado</span>}
                </div>
                {m.tipo === 'Tarjeta de crédito'
                  ? <><p style={{ color:D.muted, fontSize:13, margin:'0 0 2px' }}>{m.numero}</p><p style={{ color:D.muted, fontSize:13, margin:0 }}>{m.titular} • Expira: {m.expiracion}</p></>
                  : <p style={{ color:D.muted, fontSize:13, margin:0 }}>{m.email}</p>}
              </div>
              <div style={{ display:'flex', gap:4 }}>
                <motion.button whileHover={{ scale:1.1 }} style={iconBtn}><Edit size={15}/></motion.button>
                <motion.button whileHover={{ scale:1.1 }} style={{ ...iconBtn, color:D.red }}><Trash size={15}/></motion.button>
              </div>
            </div>
            {!m.predeterminado && (
              <button style={{ marginTop:10, background:'none', border:'none', cursor:'pointer', color:D.primary, fontWeight:600, fontSize:12, padding:0 }}>
                Establecer como predeterminado
              </button>
            )}
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop:16, padding:14, background:`rgba(56,189,248,0.06)`, borderRadius:12, border:`1px solid rgba(56,189,248,0.2)`, display:'flex', alignItems:'flex-start', gap:10 }}>
        <Shield size={17} style={{ color:D.primary, flexShrink:0, marginTop:1 }}/>
        <p style={{ color:D.muted, fontSize:13, margin:0 }}>Tu información de pago está protegida y encriptada.</p>
      </div>
    </motion.div>
  )

  const renderPreferencias = () => (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
      <h3 style={title}>Preferencias</h3>
      <div style={card}>
        <h4 style={{ ...sub, margin:'0 0 12px' }}>Notificaciones</h4>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { key:'notificacionesEmail', label:'Notificaciones por email' },
            { key:'notificacionesPush',  label:'Notificaciones push' },
            { key:'notificacionesSMS',   label:'Notificaciones SMS' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:D.text, fontSize:14 }}>{label}</span>
              {renderToggle(formData.preferencias[key], () =>
                setFormData(p => ({ ...p, preferencias: { ...p.preferencias, [key]: !p.preferencias[key] } }))
              )}
            </div>
          ))}
        </div>
        <h4 style={sub}>Marketing</h4>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { key:'boletinNoticias', label:'Boletín de noticias' },
            { key:'ofertas',         label:'Ofertas y promociones' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:D.text, fontSize:14 }}>{label}</span>
              {renderToggle(formData.preferencias[key], () =>
                setFormData(p => ({ ...p, preferencias: { ...p.preferencias, [key]: !p.preferencias[key] } }))
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )

  const renderSeguridad = () => (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
      <h3 style={title}>Seguridad</h3>

      {/* Cambiar contraseña */}
      <div style={card}>
        <h4 style={{ ...sub, margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}><Lock size={15} style={{ color:D.primary }}/>Cambiar contraseña</h4>
        {pwError   && <div style={{ marginBottom:12, padding:'8px 12px', background:`rgba(248,113,113,0.12)`, border:`1px solid rgba(248,113,113,0.3)`, color:D.red, borderRadius:8, fontSize:13 }}>{pwError}</div>}
        {pwSuccess && <div style={{ marginBottom:12, padding:'8px 12px', background:'rgba(74,222,128,0.12)', border:`1px solid rgba(74,222,128,0.3)`, color:'#4ade80', borderRadius:8, fontSize:13 }}>✓ {pwSuccess}</div>}
        <form onSubmit={handleCambiarPassword}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { lbl:'Contraseña actual', key:'current' },
              { lbl:'Nueva contraseña',  key:'nuevo' },
              { lbl:'Confirmar nueva contraseña', key:'confirmar' },
            ].map(({ lbl:label, key }) => (
              <div key={key}>
                <label style={lbl}>{label}</label>
                <input type="password" value={pwForm[key]}
                  onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••" style={inp} />
              </div>
            ))}
            <div>
              <motion.button type="submit" whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                disabled={pwSaving}
                style={{ ...primBtn, opacity: pwSaving ? 0.6 : 1 }}>
                {pwSaving ? <Loader size={14} style={{ animation:'spin 1s linear infinite' }}/> : null}
                Actualizar contraseña
              </motion.button>
            </div>
          </div>
        </form>
      </div>

      {/* Dispositivos */}
      <div style={card}>
        <h4 style={{ ...sub, margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}><Shield size={15} style={{ color:D.primary }}/>Dispositivos conectados</h4>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {formData.dispositivosConectados.map(dev => (
            <div key={dev.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background: isDark ? 'rgba(255,255,255,0.03)' : D.bg, borderRadius:10, border:`1px solid ${D.border}` }}>
              <div>
                <h5 style={{ fontWeight:600, color:D.text, margin:'0 0 3px', fontSize:14 }}>{dev.nombre}</h5>
                <p style={{ color:D.muted, fontSize:12, margin:0 }}>{dev.ubicacion} • {dev.ultimoAcceso}</p>
              </div>
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                style={{ background:'none', border:'none', cursor:'pointer', color:D.red, fontWeight:600, fontSize:12 }}>
                Cerrar sesión
              </motion.button>
            </div>
          ))}
        </div>
      </div>

      {/* 2FA */}
      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          <div>
            <h4 style={{ ...sub, margin:'0 0 6px', display:'flex', alignItems:'center', gap:7 }}><Shield size={15} style={{ color:D.primary }}/>Verificación en dos pasos</h4>
            <p style={{ color:D.muted, fontSize:13, margin:0 }}>Añade una capa extra de seguridad a tu cuenta requiriendo un código además de tu contraseña.</p>
          </div>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} style={{ ...primBtn, whiteSpace:'nowrap', flexShrink:0 }}>Activar</motion.button>
        </div>
      </div>
    </motion.div>
  )

  const renderActividad = () => (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
      <h3 style={title}>Actividad Reciente</h3>
      <div style={card}>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { icon:ShoppingBag, text:"Realizaste un pedido",                time:"Hoy, 10:30 AM",       id:"PED-2024-003" },
            { icon:Heart,       text:"Añadiste un producto a favoritos",     time:"Ayer, 15:45 PM",      product:"Trucha Arcoíris" },
            { icon:User,        text:"Actualizaste tu información de perfil", time:"20/04/2024, 14:20 PM" },
            { icon:Home,        text:"Añadiste una nueva dirección",          time:"18/04/2024, 09:15 AM" },
            { icon:ShoppingBag, text:"Realizaste un pedido",                time:"15/04/2024, 11:30 AM", id:"PED-2024-001" },
          ].map((a, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 14px', background: isDark ? 'rgba(255,255,255,0.03)' : D.bg, borderRadius:10, border:`1px solid ${D.border}` }}>
              <div style={{ padding:8, borderRadius:'50%', background:`rgba(56,189,248,0.12)`, flexShrink:0 }}>
                <a.icon size={15} style={{ color:D.primary }}/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ color:D.text, fontSize:14, margin:'0 0 3px' }}>
                  {a.text}
                  {a.id      && <span style={{ fontWeight:600 }}> #{a.id}</span>}
                  {a.product && <span style={{ fontWeight:600 }}> {a.product}</span>}
                </p>
                <p style={{ color:D.muted, fontSize:12, margin:0 }}>{a.time}</p>
              </div>
              {a.id && (
                <button style={{ background:'none', border:'none', cursor:'pointer', color:D.primary, fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>Ver detalles</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )

  const sectionMap = {
    personal:     renderPersonal,
    direcciones:  renderDirecciones,
    pagos:        renderPagos,
    preferencias: renderPreferencias,
    seguridad:    renderSeguridad,
    actividad:    renderActividad,
  }

  const navItems = [
    { id:'personal',     icon:User,       label:'Información Personal' },
    { id:'direcciones',  icon:Home,       label:'Direcciones' },
    { id:'pagos',        icon:CreditCard, label:'Métodos de Pago' },
    { id:'preferencias', icon:Sliders,    label:'Preferencias' },
    { id:'seguridad',    icon:Lock,       label:'Seguridad' },
    { id:'actividad',    icon:ListChecks, label:'Actividad Reciente' },
  ]

  return (
    <div style={{ padding:24, minHeight:'100vh', background:D.bg }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:D.text, margin:'0 0 4px' }}>Mi Perfil</h1>
          <p style={{ color:D.muted, fontSize:14, margin:0 }}>Gestiona tu información personal y preferencias</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {!editMode ? (
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              onClick={() => { setActiveSection('personal'); setEditMode(true) }}
              style={primBtn}>
              <Edit size={15}/> Editar perfil
            </motion.button>
          ) : (
            <>
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={handleSubmit} disabled={saving}
                style={{ ...primBtn, background:'linear-gradient(135deg,#22c55e,#16a34a)', opacity:saving ? 0.6 : 1 }}>
                {saving ? <Loader size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={15}/>}
                Guardar cambios
              </motion.button>
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={() => setEditMode(false)}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:10, background:'transparent', color:D.muted, border:`1px solid ${D.border}`, cursor:'pointer', fontWeight:600, fontSize:13 }}>
                <X size={15}/> Cancelar
              </motion.button>
            </>
          )}
        </div>
      </div>

      {successMsg && <div style={{ marginBottom:16, padding:'10px 14px', background:'rgba(74,222,128,0.12)', border:`1px solid rgba(74,222,128,0.3)`, color:'#4ade80', borderRadius:10, fontSize:13 }}>✓ {successMsg}</div>}
      {error      && <div style={{ marginBottom:16, padding:'10px 14px', background:`rgba(248,113,113,0.12)`, border:`1px solid rgba(248,113,113,0.3)`, color:D.red, borderRadius:10, fontSize:13 }}>{error}</div>}

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:12 }}>
          <Loader style={{ color:D.primary, animation:'spin 1s linear infinite' }} size={28}/>
          <span style={{ color:D.muted }}>Cargando perfil...</span>
        </div>
      ) : (
        <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <aside style={{ width:240, flexShrink:0 }}>

            {/* Profile card */}
            <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : D.surface, border:`1px solid ${D.border}`, borderRadius:16, padding:20, marginBottom:12, textAlign:'center' }}>
              {/* Avatar */}
              <div style={{ position:'relative', display:'inline-block', marginBottom:14 }}>
                <div style={{ width:80, height:80, borderRadius:'50%', overflow:'hidden', border:`3px solid ${D.primary}`, background:`${D.primary}20`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
                  {fotoPerfil
                    ? <img src={fotoPerfil} alt="Foto" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    : <User size={34} style={{ color:D.primary }}/>
                  }
                  {uploadingFoto && (
                    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}>
                      <Loader size={18} style={{ color:'#fff', animation:'spin 1s linear infinite' }}/>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFoto}
                  style={{ position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:'50%', background:`linear-gradient(135deg,${D.primary},${D.teal})`, border:`2px solid ${D.bg}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Camera size={12} color="#fff"/>
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }} onChange={handleFotoChange}/>
              </div>

              <p style={{ fontWeight:700, color:D.text, fontSize:15, margin:'0 0 4px' }}>{formData.nombre || 'Sin nombre'}</p>
              <p style={{ color:D.muted, fontSize:12, margin:'0 0 10px', wordBreak:'break-all' }}>{formData.email}</p>

              {formData.fechaRegistro && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'6px 10px', background: isDark ? 'rgba(56,189,248,0.08)' : `rgba(56,189,248,0.08)`, borderRadius:8 }}>
                  <Calendar size={12} style={{ color:D.primary }}/>
                  <span style={{ fontSize:11, color:D.muted }}>Desde {formData.fechaRegistro}</span>
                </div>
              )}
            </div>

            {/* Nav */}
            <nav style={{ background: isDark ? 'rgba(255,255,255,0.03)' : D.surface, border:`1px solid ${D.border}`, borderRadius:14, padding:8, display:'flex', flexDirection:'column', gap:2 }}>
              {navItems.map(({ id, icon:Icon, label }) => (
                <button key={id} onClick={() => setActiveSection(id)}
                  style={{
                    display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10,
                    border:'none', cursor:'pointer', fontWeight:600, fontSize:13, width:'100%', textAlign:'left',
                    background: activeSection === id ? `rgba(56,189,248,0.12)` : 'transparent',
                    color: activeSection === id ? D.primary : D.muted,
                    borderLeft:`3px solid ${activeSection === id ? D.primary : 'transparent'}`,
                    transition:'all 0.15s',
                  }}>
                  <Icon size={16}/> {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Content ──────────────────────────────────────────── */}
          <main style={{ flex:1, minWidth:0 }}>
            {(sectionMap[activeSection] ?? (() => null))()}
          </main>

        </div>
      )}
    </div>
  )
}

export default PerfilConsumidor
