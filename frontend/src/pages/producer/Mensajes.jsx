"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { io } from "socket.io-client"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Send, MessageCircle, ChevronLeft, Wifi, WifiOff, Paperclip, X, Play, Camera } from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import api from "../../api/config/axios"

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '')

const Avatar = ({ nombre, foto, size = 38, D }) => (
  foto
    ? <img src={foto} alt={nombre} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg,${D.primary},${D.teal})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 700, fontSize: size * 0.37 }}>
        {nombre?.[0]?.toUpperCase() || "?"}
      </div>
)

const timeLabel = (iso) => {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
  if (diffDays === 1) return "Ayer"
  if (diffDays < 7)  return d.toLocaleDateString("es-PE", { weekday: "short" })
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
}

const Mensajes = () => {
  const { D } = useTheme()
  const { user } = useAuth()

  const [convs, setConvs]             = useState([])
  const [selectedId, setSelectedId]   = useState(null)   // partner user id
  const [mensajes, setMensajes]       = useState([])
  const [texto, setTexto]             = useState("")
  const [searchTerm, setSearchTerm]   = useState("")
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingChat, setLoadingChat] = useState(false)
  const [sending, setSending]         = useState(false)
  const [error, setError]             = useState(null)
  const [connected, setConnected]     = useState(false)

  const [mediaFile, setMediaFile]           = useState(null)
  const [mediaPreview, setMediaPreview]     = useState(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  const bottomRef    = useRef(null)
  const socketRef    = useRef(null)
  const convPollRef  = useRef(null)
  const currentRoom  = useRef(null)
  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)

  // ── Socket.IO ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem('usuario')) return

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
    })

    socket.on("connect",    () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))

    socket.on("nuevo_mensaje", (msg) => {
      setMensajes(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      fetchConvs(true)
    })

    socketRef.current = socket
    return () => { socket.disconnect(); socketRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Join / leave room ──────────────────────────────────────────────
  useEffect(() => {
    const sock = socketRef.current
    if (!sock) return
    if (currentRoom.current) sock.emit("leave_chat", currentRoom.current)
    if (selectedId) {
      sock.emit("join_chat", selectedId)
      currentRoom.current = selectedId
    } else {
      currentRoom.current = null
    }
  }, [selectedId])

  // ── REST helpers ───────────────────────────────────────────────────
  const fetchConvs = useCallback(async (silent = false) => {
    if (!silent) setLoadingConvs(true)
    try {
      const { data } = await api.get("/mensajes/conversaciones")
      setConvs(data.data || data)
    } catch {}
    finally { setLoadingConvs(false) }
  }, [])

  const fetchMensajes = useCallback(async (partnerId, silent = false) => {
    if (!partnerId) return
    if (!silent) setLoadingChat(true)
    try {
      const { data } = await api.get(`/mensajes/directo/${partnerId}`)
      setMensajes(data.data || data)
      setError(null)
    } catch (e) {
      setError(e.response?.data?.error || "Error al cargar mensajes")
    } finally { setLoadingChat(false) }
  }, [])

  useEffect(() => {
    fetchConvs()
    convPollRef.current = setInterval(() => fetchConvs(true), 15000)
    return () => clearInterval(convPollRef.current)
  }, [fetchConvs])

  useEffect(() => {
    if (selectedId) fetchMensajes(selectedId)
    else setMensajes([])
  }, [selectedId, fetchMensajes])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [mensajes])

  const handleSelect = (id) => { setSelectedId(id); setMensajes([]); setTexto(""); setError(null); setMediaFile(null); setMediaPreview(null) }

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith("video/")
    setMediaFile(file)
    setMediaPreview({ url: URL.createObjectURL(file), type: isVideo ? "video" : "image" })
    e.target.value = ""
  }

  const handleSendMedia = async () => {
    if (!mediaFile || !selectedId || uploadingMedia) return
    setUploadingMedia(true)
    try {
      const formData = new FormData()
      formData.append("archivo", mediaFile)
      formData.append("destinatario_id", selectedId)
      const { data } = await api.post("/mensajes/media", formData, { headers: { "Content-Type": "multipart/form-data" } })
      const msg = data.data || data
      setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      setMediaFile(null)
      setMediaPreview(null)
      fetchConvs(true)
    } catch (e) {
      setError(e.response?.data?.error || "Error al enviar archivo")
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!texto.trim() || !selectedId || sending) return
    setSending(true)
    const contenido = texto.trim()
    setTexto("")
    try {
      const { data } = await api.post("/mensajes", { destinatario_id: selectedId, contenido })
      const msg = data.data || data
      setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      fetchConvs(true)
    } catch (e) {
      setError(e.response?.data?.error || "Error al enviar")
      setTexto(contenido)
    } finally { setSending(false) }
  }

  const filtered = convs.filter(c => {
    const s = searchTerm.toLowerCase()
    return !s || c.partner_nombre?.toLowerCase().includes(s)
  })

  const selectedConv = convs.find(c => c.partner_id === selectedId)
  const myId = user?.id

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: D.bg }}>

      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${D.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: D.text, margin: "0 0 4px" }}>Mensajes</h1>
            <p style={{ color: D.muted, fontSize: 14, margin: 0 }}>Chat directo con tus clientes</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20,
              background: connected ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${connected ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              {connected
                ? <><Wifi size={13} color="#34d399" /><span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>En vivo</span></>
                : <><WifiOff size={13} color="#f87171" /><span style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>Reconectando</span></>}
            </div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: D.muted, pointerEvents: "none" }} />
          <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 9, paddingBottom: 9, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, color: D.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = D.primary}
            onBlur={e => e.target.style.borderColor = D.border} />
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* Conversation list */}
        <div style={{ width: selectedId ? 300 : "100%", maxWidth: selectedId ? 300 : "none", flexShrink: 0, borderRight: `1px solid ${D.border}`, overflowY: "auto", background: D.surface }}>
          {loadingConvs ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, color: D.muted, fontSize: 13 }}>
              Cargando...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, color: D.muted, padding: 24, textAlign: "center" }}>
              <MessageCircle size={40} style={{ marginBottom: 12, opacity: 0.35 }} />
              <p style={{ fontSize: 14, margin: 0 }}>No hay conversaciones aún.<br />Los chats aparecen cuando un cliente te escribe.</p>
            </div>
          ) : filtered.map(conv => {
            const isActive = conv.partner_id === selectedId
            return (
              <motion.div key={conv.partner_id} onClick={() => handleSelect(conv.partner_id)}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: "12px 16px", borderBottom: `1px solid ${D.border}`, cursor: "pointer",
                  background: isActive ? `${D.primary}18` : "transparent",
                  borderLeft: isActive ? `3px solid ${D.primary}` : "3px solid transparent" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = `${D.primary}08` }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar nombre={conv.partner_nombre} foto={conv.partner_foto} size={40} D={D} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: conv.no_leidos > 0 ? 700 : 500, fontSize: 13, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {conv.partner_nombre || "Cliente"}
                      </span>
                      <span style={{ fontSize: 11, color: D.muted, flexShrink: 0, marginLeft: 6 }}>
                        {timeLabel(conv.ultimo_mensaje_at)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: D.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {conv.ultimo_mensaje || "Sin mensajes aún"}
                      </span>
                      {conv.no_leidos > 0 && (
                        <span style={{ background: D.primary, color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "1px 7px", flexShrink: 0, marginLeft: 6 }}>
                          {conv.no_leidos}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Chat area */}
        <AnimatePresence>
          {selectedId ? (
            <motion.div key="chat" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", gap: 10, background: D.surface }}>
                <button onClick={() => setSelectedId(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: D.muted, display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}>
                  <ChevronLeft size={20} />
                </button>
                {selectedConv && (
                  <>
                    <Avatar nombre={selectedConv.partner_nombre} foto={selectedConv.partner_foto} size={36} D={D} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: D.text }}>{selectedConv.partner_nombre || "Cliente"}</p>
                      <p style={{ margin: 0, fontSize: 12, color: D.muted }}>Cliente</p>
                    </div>
                  </>
                )}
                {connected && (
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", display: "inline-block", boxShadow: "0 0 6px #34d399" }} />
                    <span style={{ fontSize: 11, color: "#34d399" }}>En vivo</span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10, background: D.bg }}>
                {loadingChat ? (
                  <div style={{ textAlign: "center", color: D.muted, fontSize: 13, marginTop: 40 }}>Cargando mensajes...</div>
                ) : mensajes.length === 0 ? (
                  <div style={{ textAlign: "center", color: D.muted, fontSize: 14, marginTop: 60 }}>
                    <MessageCircle size={36} style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }} />
                    Sé el primero en escribir
                  </div>
                ) : mensajes.map((m, i) => {
                  const isMine = m.remitente_id === myId
                  const showAvatar = !isMine && (i === 0 || mensajes[i - 1]?.remitente_id !== m.remitente_id)
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                      {showAvatar && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <Avatar nombre={selectedConv?.partner_nombre} foto={selectedConv?.partner_foto} size={22} D={D} />
                          <span style={{ fontSize: 11, color: D.muted }}>{m.remitente_nombre}</span>
                        </div>
                      )}
                      {m.tipo === "imagen" ? (
                        <a href={m.archivo_url} target="_blank" rel="noreferrer">
                          <img src={m.archivo_url} alt="imagen" style={{ maxWidth: 240, maxHeight: 200, borderRadius: isMine ? "16px 4px 16px 16px" : "4px 16px 16px 16px", objectFit: "cover", display: "block", cursor: "pointer" }} />
                        </a>
                      ) : m.tipo === "video" ? (
                        <video src={m.archivo_url} controls style={{ maxWidth: 260, borderRadius: isMine ? "16px 4px 16px 16px" : "4px 16px 16px 16px", display: "block" }} />
                      ) : (
                        <div style={{
                          maxWidth: "70%", padding: "8px 12px", borderRadius: isMine ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                          background: isMine ? `linear-gradient(135deg,${D.primary},${D.teal})` : D.surface,
                          color: isMine ? "#fff" : D.text, fontSize: 14, lineHeight: 1.5,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                        }}>
                          {m.contenido}
                        </div>
                      )}
                      <span style={{ fontSize: 10, color: D.muted, marginTop: 3 }}>{timeLabel(m.created_at)}</span>
                    </div>
                  )
                })}
                {error && <p style={{ color: "#EF4444", fontSize: 12, textAlign: "center" }}>{error}</p>}
                <div ref={bottomRef} />
              </div>

              <div style={{ borderTop: `1px solid ${D.border}`, background: D.surface }}>
                {mediaPreview && (
                  <div style={{ padding: "10px 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      {mediaPreview.type === "image"
                        ? <img src={mediaPreview.url} alt="preview" style={{ height: 72, width: 72, objectFit: "cover", borderRadius: 10 }} />
                        : <div style={{ height: 72, width: 72, borderRadius: 10, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Play size={22} color="#fff" />
                          </div>
                      }
                      <button onClick={() => { setMediaFile(null); setMediaPreview(null) }}
                        style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={12} color="#fff" />
                      </button>
                    </div>
                    <motion.button onClick={handleSendMedia} disabled={uploadingMedia}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: "#fff", border: "none", cursor: uploadingMedia ? "wait" : "pointer", opacity: uploadingMedia ? 0.6 : 1, fontSize: 13, fontWeight: 600 }}>
                      {uploadingMedia ? "Enviando…" : <><Send size={14} /> Enviar</>}
                    </motion.button>
                  </div>
                )}
                <form onSubmit={handleSend}
                  style={{ padding: "12px 16px", display: "flex", gap: 8, alignItems: "flex-end" }}>
                  {/* Inputs ocultos */}
                  <input ref={fileInputRef}   type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleMediaSelect} />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleMediaSelect} />
                  {/* Botón galería */}
                  <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Paperclip size={17} color="#38bdf8" />
                  </motion.button>
                  {/* Botón cámara */}
                  <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => cameraInputRef.current?.click()}
                    style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Camera size={17} color="#14b8a6" />
                  </motion.button>
                  <textarea value={texto} onChange={e => setTexto(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
                    placeholder="Escribe un mensaje... (Enter para enviar)"
                    rows={1} style={{ flex: 1, background: D.bg, border: `1px solid ${D.border}`, borderRadius: 10, padding: "9px 12px", color: D.text, fontSize: 14, outline: "none", resize: "none", maxHeight: 120, overflowY: "auto", lineHeight: 1.5 }}
                    onFocus={e => e.target.style.borderColor = D.primary}
                    onBlur={e => e.target.style.borderColor = D.border} />
                  <motion.button type="submit" disabled={!texto.trim() || sending}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 8, background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: "#fff", border: "none", cursor: !texto.trim() || sending ? "not-allowed" : "pointer", opacity: !texto.trim() || sending ? 0.5 : 1, flexShrink: 0 }}>
                    <Send size={16} />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: D.surface }}>
              <div style={{ textAlign: "center", color: D.muted }}>
                <MessageCircle size={52} style={{ margin: "0 auto 16px", opacity: 0.25 }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: D.text, marginBottom: 8 }}>Selecciona una conversación</h3>
                <p style={{ fontSize: 14, margin: 0 }}>Elige un cliente de la lista para chatear</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Mensajes
