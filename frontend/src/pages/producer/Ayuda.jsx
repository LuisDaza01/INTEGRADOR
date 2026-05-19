"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  HelpCircle, Search, Book, FileText, MessageCircle, Video,
  ChevronDown, ChevronRight, ThumbsUp, ThumbsDown, Mail, Phone, Globe,
} from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"

const Ayuda = () => {
  const { D } = useTheme()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedFaq, setExpandedFaq] = useState(null)

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } } }

  const faqItems = [
    { id: 1, question: "¿Cómo configuro mis sensores para monitoreo remoto?", answer: "Para configurar tus sensores, ve a la sección de Monitoreo y haz clic en «Añadir sensor». Sigue las instrucciones para conectar el dispositivo a tu red WiFi y asignarle un nombre y ubicación. Una vez configurado, podrás ver los datos en tiempo real en el dashboard y recibir alertas cuando los parámetros estén fuera de los rangos establecidos." },
    { id: 2, question: "¿Cómo puedo gestionar mis pedidos y entregas?", answer: "La gestión de pedidos se realiza desde la sección «Pedidos» del dashboard. Allí podrás ver todos los pedidos entrantes, confirmarlos, rechazarlos o programar entregas. Para cada pedido, puedes ver los detalles del cliente, productos solicitados, cantidades y fechas de entrega." },
    { id: 3, question: "¿Cómo actualizo mi inventario de productos?", answer: "Para actualizar tu inventario, dirígete a la sección «Inventario» y selecciona el producto que deseas modificar. Puedes actualizar la cantidad disponible, precio, descripción y otros detalles. También puedes añadir nuevos productos haciendo clic en «Añadir producto»." },
    { id: 4, question: "¿Cómo puedo ver las estadísticas de ventas y producción?", answer: "Las estadísticas están disponibles en la sección «Estadísticas» del dashboard. Allí encontrarás gráficos y datos sobre ventas, producción, clientes más frecuentes y productos más vendidos. Puedes filtrar por período y exportar los informes." },
    { id: 5, question: "¿Cómo configuro las notificaciones y alertas?", answer: "Para configurar notificaciones, ve a la sección «Ajustes» y selecciona «Notificaciones». Allí podrás elegir qué tipos de alertas deseas recibir y por qué medios (email, push, SMS). También puedes establecer umbrales personalizados para las alertas de sensores." },
  ]

  const helpResources = [
    { title: "Guías y tutoriales",      description: "Aprende a utilizar todas las funciones de la plataforma", icon: Book,           iconColor: D.primary,   iconBg: `rgba(56,189,248,0.12)` },
    { title: "Documentación técnica",   description: "Especificaciones detalladas y manuales",                   icon: FileText,       iconColor: '#a78bfa',   iconBg: 'rgba(167,139,250,0.12)' },
    { title: "Videotutoriales",         description: "Aprende visualmente con nuestros videos",                  icon: Video,          iconColor: D.red,       iconBg: `rgba(248,113,113,0.12)` },
    { title: "Comunidad",               description: "Conecta con otros productores acuícolas",                  icon: MessageCircle,  iconColor: D.green,     iconBg: `rgba(74,222,128,0.12)`  },
  ]

  const contactItems = [
    { href: "mailto:soporte@naturapiscis.com", icon: Mail,  iconColor: D.primary, iconBg: `rgba(56,189,248,0.12)`, title: 'Email',        desc: 'soporte@naturapiscis.com', note: 'Respuesta en 24-48h' },
    { href: "tel:+525512345678",               icon: Phone, iconColor: D.green,   iconBg: `rgba(74,222,128,0.12)`, title: 'Teléfono',     desc: '+52 55 1234 5678',         note: 'Lun-Vie 9:00-18:00' },
    { href: "#",                               icon: Globe, iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)', title: 'Chat en vivo', desc: 'Soporte en tiempo real',    note: 'Disponible ahora' },
  ]

  const filteredFaqs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div style={{ padding: 24, height: '100%', overflowY: 'auto', background: D.bg }}
      initial="hidden" animate="visible" variants={containerVariants}>

      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: D.text, margin: '0 0 4px' }}>Centro de Ayuda</h1>
        <p style={{ color: D.muted, fontSize: 14, margin: 0 }}>Encuentra respuestas a tus preguntas y recursos de soporte</p>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} style={{ marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: D.primary, pointerEvents: 'none' }} />
          <input type="text" placeholder="Buscar en el centro de ayuda..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, color: D.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = D.primary}
            onBlur={e => e.target.style.borderColor = D.border} />
        </div>
      </motion.div>

      {/* Resources */}
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: D.text, marginBottom: 16 }}>Recursos de ayuda</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
          {helpResources.map((res, index) => (
            <motion.div key={res.title} whileHover={{ y: -4 }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: index * 0.08 } }}
              style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ padding: 10, borderRadius: 10, background: res.iconBg, display: 'inline-flex', marginBottom: 12 }}>
                <res.icon size={22} style={{ color: res.iconColor }} />
              </div>
              <h3 style={{ fontWeight: 700, color: D.text, marginBottom: 6, fontSize: 14 }}>{res.title}</h3>
              <p style={{ fontSize: 13, color: D.muted, marginBottom: 12 }}>{res.description}</p>
              <motion.a href="#" whileHover={{ x: 2 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: res.iconColor, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Explorar <ChevronRight size={14} />
              </motion.a>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQs */}
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: D.text, marginBottom: 16 }}>Preguntas frecuentes</h2>
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {filteredFaqs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <HelpCircle size={40} style={{ color: D.dim, margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ color: D.muted, marginBottom: 8 }}>No se encontraron resultados para "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.primary, fontWeight: 600 }}>Limpiar búsqueda</button>
            </div>
          ) : filteredFaqs.map((item, index) => (
            <div key={item.id} style={{ borderTop: index !== 0 ? `1px solid ${D.border}` : 'none' }}>
              <motion.button onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                whileHover={{ backgroundColor: `${D.border}` }}>
                <span style={{ fontWeight: 600, color: D.text, fontSize: 14 }}>{item.question}</span>
                <motion.div animate={{ rotate: expandedFaq === item.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} style={{ color: D.muted }} />
                </motion.div>
              </motion.button>
              <motion.div initial={false}
                animate={{ height: expandedFaq === item.id ? 'auto' : 0, opacity: expandedFaq === item.id ? 1 : 0 }}
                transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '0 20px 16px', borderTop: `1px solid ${D.border}` }}>
                  <p style={{ color: D.muted, fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>{item.answer}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    <span style={{ fontSize: 13, color: D.muted }}>¿Te ha sido útil esta respuesta?</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[ThumbsUp, ThumbsDown].map((Icon, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: D.muted }}>
                          <Icon size={15} />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div variants={itemVariants}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: D.text, marginBottom: 16 }}>¿Necesitas más ayuda?</h2>
        <div style={{ background: `linear-gradient(135deg,rgba(56,189,248,0.08),rgba(20,184,166,0.06))`, border: `1px solid ${D.border}`, borderRadius: 16, padding: 28 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, marginBottom: 6 }}>Contacta con nuestro equipo de soporte</h3>
            <p style={{ color: D.muted, fontSize: 14 }}>Estamos disponibles para ayudarte con cualquier duda o problema</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
            {contactItems.map(({ href, icon: Icon, iconColor, iconBg, title, desc, note }) => (
              <motion.a key={title} href={href} whileHover={{ y: -4 }}
                style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', textDecoration: 'none' }}>
                <div style={{ padding: 12, borderRadius: '50%', background: iconBg, marginBottom: 12 }}>
                  <Icon size={22} style={{ color: iconColor }} />
                </div>
                <h4 style={{ fontWeight: 700, color: D.text, marginBottom: 4, fontSize: 14 }}>{title}</h4>
                <p style={{ fontSize: 13, color: D.muted, marginBottom: 4 }}>{desc}</p>
                <span style={{ fontSize: 12, color: D.dim }}>{note}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Ayuda
