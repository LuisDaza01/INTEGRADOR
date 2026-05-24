"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import {
  ChevronDown,
  Search,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  Globe,
  Zap,
  ShoppingBag,
  Truck,
  Lock,
  User,
  FileText,
} from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"

const AyudaConsumidor = () => {
  const { D } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFAQ, setExpandedFAQ] = useState(null)
  const [activeCategory, setActiveCategory] = useState("general")

  const categories = [
    { id: "general", name: "General", icon: HelpCircle, color: "blue" },
    { id: "pedidos", name: "Mis Pedidos", icon: ShoppingBag, color: "green" },
    { id: "envio", name: "Envíos", icon: Truck, color: "purple" },
    { id: "cuenta", name: "Mi Cuenta", icon: User, color: "orange" },
    { id: "seguridad", name: "Seguridad", icon: Lock, color: "red" },
  ]

  const faqs = {
    general: [
      {
        id: 1,
        question: "¿Qué es NaturaPiscis?",
        answer:
          "NaturaPiscis es una plataforma que conecta consumidores con productores acuícolas certificados, permitiendo comprar productos frescos y de calidad directamente.",
      },
      {
        id: 2,
        question: "¿Es seguro comprar en NaturaPiscis?",
        answer:
          "Sí, utilizamos encriptación SSL y procesamos pagos de forma segura. Todos nuestros productores están verificados y certificados por autoridades competentes.",
      },
      {
        id: 3,
        question: "¿Cuáles son los horarios de atención al cliente?",
        answer:
          "Nuestro equipo de soporte está disponible de lunes a viernes de 9:00 AM a 6:00 PM. Puedes contactarnos por chat, email o teléfono en esos horarios.",
      },
      {
        id: 4,
        question: "¿Cómo puedo contactar a los productores?",
        answer:
          "Puedes contactar directamente a través de nuestro chat integrado en cada perfil de productor. También puedes enviar mensajes que aparecerán en tu panel de conversaciones.",
      },
    ],
    pedidos: [
      {
        id: 5,
        question: "¿Cómo realizo un pedido?",
        answer:
          "1. Navega a la sección Productores\n2. Selecciona los productos que deseas\n3. Agrégalos al carrito\n4. Completa tu información de envío\n5. Elige método de pago y confirma tu pedido",
      },
      {
        id: 6,
        question: "¿Puedo cancelar o modificar mi pedido?",
        answer:
          "Sí, puedes cancelar un pedido dentro de 1 hora después de haberlo realizado. Para modificaciones, contacta al productor directamente a través del chat.",
      },
      {
        id: 7,
        question: "¿Cuál es el monto mínimo de compra?",
        answer: "No hay monto mínimo de compra en NaturaPiscis. Puedes comprar la cantidad que desees comenzando desde una unidad.",
      },
      {
        id: 8,
        question: "¿Qué métodos de pago aceptan?",
        answer: "Aceptamos tarjetas de crédito/débito (Visa, Mastercard, Diners), transferencias bancarias y QR codes. Todos los pagos son seguros y encriptados.",
      },
    ],
    envio: [
      {
        id: 9,
        question: "¿Cuáles son los tiempos de entrega?",
        answer:
          "Los tiempos varían según tu ubicación:\n- Ciudad del Lago: 24-48 horas\n- Otras ciudades: 3-5 días hábiles\n- Envío express disponible en zonas seleccionadas",
      },
      {
        id: 10,
        question: "¿Cuánto cuesta el envío?",
        answer: "El costo de envío depende de la ubicación y método seleccionado:\n- Envío a domicilio: Bs 4.99\n- Retiro en punto: Bs 2.99\n- Pickup express: Bs 2.99",
      },
      {
        id: 11,
        question: "¿Puedo rastrear mi pedido?",
        answer:
          "Sí, una vez que tu pedido sea confirmado recibirás un número de seguimiento. Puedes rastrearlo en la sección 'Mis Pedidos' y recibirás actualizaciones por email.",
      },
      {
        id: 12,
        question: "¿Qué hago si mi pedido llega dañado?",
        answer:
          "Contacta a nuestro equipo de soporte inmediatamente con fotos del daño. Procesaremos un reembolso o reemplazo dentro de 24 horas.",
      },
    ],
    cuenta: [
      {
        id: 13,
        question: "¿Cómo creo una cuenta?",
        answer:
          "Haz clic en 'Registrarse', ingresa tu email, nombre y contraseña. Recibirás un enlace de confirmación en tu email. ¡Eso es todo!",
      },
      {
        id: 14,
        question: "¿Olvidé mi contraseña, qué hago?",
        answer:
          "Haz clic en 'Olvidé mi contraseña' en la página de login. Ingresa tu email y recibirás instrucciones para restablecer tu contraseña.",
      },
      {
        id: 15,
        question: "¿Cómo actualizo mi información de perfil?",
        answer:
          "Ve a Mi Perfil > Información Personal, haz clic en 'Editar perfil' y actualiza los datos que desees cambiar. Guarda los cambios cuando termines.",
      },
      {
        id: 16,
        question: "¿Puedo tener múltiples direcciones?",
        answer:
          "Sí, puedes agregar y gestionar múltiples direcciones en la sección de Direcciones de tu perfil. Selecciona una como predeterminada para futuras compras.",
      },
    ],
    seguridad: [
      {
        id: 17,
        question: "¿Es seguro compartir mis datos bancarios?",
        answer:
          "Sí, utilizamos tecnología de encriptación de nivel bancario (SSL 256-bit) para proteger todos tus datos. Nunca almacenamos números de tarjeta completos.",
      },
      {
        id: 18,
        question: "¿Cómo puedo proteger mi cuenta?",
        answer:
          "Usa una contraseña fuerte y única, actualiza regularmente, y evita compartir tu información de login. Puedes activar verificación en dos pasos en Seguridad.",
      },
      {
        id: 19,
        question: "¿Mi información personal es privada?",
        answer:
          "Sí, tus datos personales nunca serán compartidos con terceros sin tu consentimiento. Consulta nuestra Política de Privacidad para más detalles.",
      },
      {
        id: 20,
        question: "¿Qué debo hacer si sospecho fraude?",
        answer:
          "Contacta inmediatamente a nuestro equipo de seguridad en seguridad@naturapiscis.com. Investigaremos cualquier actividad sospechosa en tu cuenta.",
      },
    ],
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  // Filtrar FAQs
  const filteredFaqs = faqs[activeCategory].filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const catColors = {
    blue:   { color: D.primary, glow: 'rgba(34,197,94,0.15)' },
    green:  { color: D.teal,    glow: 'rgba(20,184,166,0.15)' },
    purple: { color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
    orange: { color: D.orange,  glow: 'rgba(251,146,60,0.15)' },
    red:    { color: D.red,     glow: 'rgba(248,113,113,0.15)' },
  }

  return (
    <motion.div style={{ padding: 24, minHeight: '100vh', background: D.bg }} initial="hidden" animate="visible" variants={containerVariants}>
      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: D.text, margin: '0 0 6px' }}>Centro de Ayuda</h1>
        <p style={{ color: D.muted, fontSize: 15, margin: 0 }}>Encuentra respuestas rápidas a tus preguntas sobre NaturaPiscis</p>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: D.primary, pointerEvents: 'none' }} size={18} />
          <input type="text" placeholder="Busca una pregunta..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, background: 'rgba(34,197,94,0.05)', border: `1px solid ${D.border}`, borderRadius: 12, color: D.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = D.primary}
            onBlur={e => e.target.style.borderColor = D.border}
          />
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10, marginBottom: 24 }}>
        {categories.map(cat => {
          const Icon = cat.icon
          const { color, glow } = catColors[cat.color]
          const isActive = activeCategory === cat.id
          return (
            <motion.button key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSearchQuery("") }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              style={{ background: isActive ? glow : 'rgba(34,197,94,0.04)', border: `1.5px solid ${isActive ? color : D.border}`, borderRadius: 12, padding: '14px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12, color: isActive ? color : D.muted, transition: 'all 0.2s' }}>
              <Icon size={20} style={{ color }} />
              {cat.name}
            </motion.button>
          )
        })}
      </motion.div>

      {/* FAQs */}
      <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map(faq => (
            <motion.div key={faq.id} variants={itemVariants}
              style={{ background: D.card, border: `1px solid ${expandedFAQ === faq.id ? D.primary : D.border}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              <motion.button
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'none', border: 'none', cursor: 'pointer', gap: 12 }}
                whileHover={{ x: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, textAlign: 'left' }}>
                  <HelpCircle size={18} style={{ color: D.primary, flexShrink: 0 }} />
                  <p style={{ fontWeight: 600, fontSize: 14, color: D.text, margin: 0 }}>{faq.question}</p>
                </div>
                <motion.div animate={{ rotate: expandedFAQ === faq.id ? 180 : 0 }} transition={{ duration: 0.25 }}>
                  <ChevronDown size={18} style={{ color: D.muted }} />
                </motion.div>
              </motion.button>

              {expandedFAQ === faq.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                  style={{ borderTop: `1px solid ${D.border}`, padding: 16, background: 'rgba(34,197,94,0.03)' }}>
                  <p style={{ color: D.muted, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))
        ) : (
          <motion.div variants={itemVariants} style={{ textAlign: 'center', padding: '48px 24px', background: D.card, border: `1px solid ${D.border}`, borderRadius: 14 }}>
            <HelpCircle style={{ width: 64, height: 64, color: D.dim, margin: '0 auto 16px', opacity: 0.4 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 8 }}>No encontramos resultados</h3>
            <p style={{ color: D.muted }}>Intenta con otra búsqueda o elige una categoría diferente</p>
          </motion.div>
        )}
      </motion.div>

      {/* Contact section */}
      <motion.div variants={itemVariants} style={{ marginTop: 40, background: 'linear-gradient(135deg,rgba(34,197,94,0.10),rgba(20,184,166,0.06))', border: `1px solid ${D.border}`, borderRadius: 16, padding: 28 }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: D.text, marginBottom: 20 }}>¿No encontraste tu respuesta?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          {[
            { icon: MessageCircle, label: 'Chat en Vivo', desc: 'Habla con nuestro equipo de soporte en tiempo real', action: 'Iniciar chat', color: D.primary, href: null },
            { icon: Mail, label: 'Enviar Email', desc: 'soporte@naturapiscis.com', action: 'Enviar mensaje', color: D.teal, href: 'mailto:soporte@naturapiscis.com' },
            { icon: Phone, label: 'Llamar', desc: '+591 2 123 4567 (Lunes-Viernes 9am-6pm)', action: 'Llamar', color: '#a78bfa', href: 'tel:+59121234567' },
          ].map(({ icon: Icon, label, desc, action, color, href }) => (
            <motion.div key={label} whileHover={{ y: -4 }}
              style={{ background: D.card, borderRadius: 14, padding: 20, border: `1px solid ${D.border}` }}>
              <Icon style={{ color, marginBottom: 10 }} size={28} />
              <h4 style={{ fontWeight: 700, color: D.text, marginBottom: 6, fontSize: 15 }}>{label}</h4>
              <p style={{ color: D.muted, fontSize: 13, marginBottom: 14 }}>{desc}</p>
              {href
                ? <motion.a href={href} whileHover={{ scale: 1.04 }} style={{ color, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>{action} →</motion.a>
                : <motion.button whileHover={{ scale: 1.04 }} style={{ background: 'none', border: 'none', cursor: 'pointer', color, fontWeight: 600, fontSize: 13, padding: 0 }}>{action} →</motion.button>}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AyudaConsumidor
