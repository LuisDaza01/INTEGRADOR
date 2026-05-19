"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  MapPin,
  Award,
  Calendar,
  Clock,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  ChevronDown,
  ChevronUp,
  Star,
  ShoppingBag,
  Utensils,
} from "lucide-react"
import ProductoTienda from "./ProductoTienda"
import ReservaForm from "./ReservaForm"

const PerfilProductorDetalle = ({ productor, productos }) => {
  const [showReservaForm, setShowReservaForm] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState(null)
  const [showAllCertificaciones, setShowAllCertificaciones] = useState(false)
  const [activeTab, setActiveTab] = useState("productos")

  const handleReservar = (producto = null) => {
    setSelectedProducto(producto)
    setShowReservaForm(true)
  }

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Portada */}
      <div className="relative h-64 md:h-80">
        <img
          src={productor.imagen_portada || "/placeholder.svg?height=300&width=800"}
          alt={`Chaco de ${productor.nombre}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{productor.nombre}</h1>
          <div className="flex items-center mb-2">
            <MapPin size={16} className="mr-1" />
            <span>{productor.ubicacion || "Ubicación no especificada"}</span>
          </div>
          {productor.verificado && (
            <div className="bg-green-500/80 text-white px-3 py-1 rounded-full text-sm font-medium inline-flex items-center">
              <Award size={14} className="mr-1" />
              Productor verificado
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Columna izquierda - Información del productor */}
          <div className="md:w-1/3 space-y-6">
            {/* Foto y datos básicos */}
            <div className="flex items-center">
              <img
                src={productor.foto_perfil || "/placeholder.svg?height=80&width=80"}
                alt={productor.nombre}
                className="w-20 h-20 rounded-full border-4 border-white shadow-md mr-4"
              />
              <div>
                <div className="flex items-center">
                  <Star size={16} className="text-yellow-500 mr-1" />
                  <span className="font-medium">
                    {productor.calificacion || "4.8"} ({productor.total_resenas || "24"} reseñas)
                  </span>
                </div>
                <p className="text-gray-600">Miembro desde {new Date(productor.fecha_registro).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Sobre el chaco</h3>
              <p className="text-gray-700">
                {productor.descripcion_chaco ||
                  "Este productor aún no ha añadido una descripción detallada de su chaco."}
              </p>
            </div>

            {/* Certificaciones */}
            {productor.certificaciones && productor.certificaciones.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Certificaciones</h3>
                <div className="space-y-3">
                  {(showAllCertificaciones ? productor.certificaciones : productor.certificaciones.slice(0, 3)).map(
                    (cert, index) => (
                      <div key={index} className="flex items-center bg-blue-50 p-3 rounded-lg">
                        <Award size={20} className="text-blue-600 mr-3" />
                        <div>
                          <h4 className="font-medium text-gray-800">{cert.nombre}</h4>
                          <p className="text-sm text-gray-600">
                            Otorgado por {cert.entidad_emisora} - Válido hasta{" "}
                            {new Date(cert.fecha_vencimiento).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                  {productor.certificaciones.length > 3 && (
                    <button
                      onClick={() => setShowAllCertificaciones(!showAllCertificaciones)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      {showAllCertificaciones ? (
                        <>
                          <ChevronUp size={16} className="mr-1" /> Mostrar menos
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} className="mr-1" /> Ver todas ({productor.certificaciones.length})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Días de venta */}
            {productor.dias_venta && productor.dias_venta.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Días de venta</h3>
                <div className="space-y-2">
                  {diasSemana.map((dia) => {
                    const diaVenta = productor.dias_venta.find((d) => d.dia.toLowerCase() === dia.toLowerCase())
                    if (!diaVenta) return null

                    return (
                      <div key={dia} className="flex items-center justify-between p-2 border-b border-gray-100">
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-600 mr-2" />
                          <span className="font-medium">{dia}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock size={14} className="mr-1" />
                          <span>
                            {diaVenta.hora_inicio} - {diaVenta.hora_fin}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {diaVenta.venta_directa && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Venta directa
                            </span>
                          )}
                          {diaVenta.venta_cocinado && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              Cocinado
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Contacto */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Contacto</h3>
              <div className="space-y-2">
                {productor.telefono && (
                  <div className="flex items-center">
                    <Phone size={16} className="text-gray-600 mr-2" />
                    <span>{productor.telefono}</span>
                  </div>
                )}
                {productor.email && (
                  <div className="flex items-center">
                    <Mail size={16} className="text-gray-600 mr-2" />
                    <span>{productor.email}</span>
                  </div>
                )}
                {productor.sitio_web && (
                  <div className="flex items-center">
                    <Globe size={16} className="text-gray-600 mr-2" />
                    <a href={productor.sitio_web} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                      {productor.sitio_web}
                    </a>
                  </div>
                )}
              </div>

              {/* Redes sociales */}
              <div className="flex mt-3 space-x-3">
                {productor.facebook && (
                  <a
                    href={productor.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Facebook size={20} />
                  </a>
                )}
                {productor.instagram && (
                  <a
                    href={productor.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-800"
                  >
                    <Instagram size={20} />
                  </a>
                )}
                {productor.twitter && (
                  <a
                    href={productor.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <Twitter size={20} />
                  </a>
                )}
              </div>
            </div>

            {/* Botón de reserva general */}
            {productor.vende_cocinado && (
              <button
                onClick={() => handleReservar()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
              >
                <Utensils size={18} className="mr-2" />
                Reservar comida cocinada
              </button>
            )}
          </div>

          {/* Columna derecha - Productos y tabs */}
          <div className="md:w-2/3">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab("productos")}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "productos"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                <ShoppingBag size={16} className="inline mr-1" />
                Productos ({productos.length})
              </button>
              {productor.vende_cocinado && (
                <button
                  onClick={() => setActiveTab("cocinados")}
                  className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === "cocinados"
                      ? "border-orange-500 text-orange-500"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Utensils size={16} className="inline mr-1" />
                  Platos cocinados
                </button>
              )}
            </div>

            {/* Productos */}
            {activeTab === "productos" && (
              <>
                {productos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productos.map((producto) => (
                      <ProductoTienda
                        key={producto.id}
                        producto={producto}
                        onAddToCart={() => console.log(`Añadir al carrito: ${producto.id}`)}
                        onToggleFavorite={() => console.log(`Marcar favorito: ${producto.id}`)}
                        onViewDetails={() => console.log(`Ver detalles: ${producto.id}`)}
                        showProducer={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Este productor aún no tiene productos disponibles.</p>
                  </div>
                )}
              </>
            )}

            {/* Platos cocinados */}
            {activeTab === "cocinados" && (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {productor.vende_cocinado
                    ? "Los platos cocinados están disponibles para reserva directa."
                    : "Este productor no ofrece platos cocinados."}
                </p>
                {productor.vende_cocinado && (
                  <button
                    onClick={() => handleReservar()}
                    className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center transition-colors"
                  >
                    <Utensils size={16} className="mr-2" />
                    Reservar comida cocinada
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de reserva */}
      {showReservaForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <ReservaForm
              productor={productor}
              producto={selectedProducto}
              onClose={() => {
                setShowReservaForm(false)
                setSelectedProducto(null)
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default PerfilProductorDetalle