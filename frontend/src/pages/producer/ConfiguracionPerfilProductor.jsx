"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Save,
  Upload,
  X,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Award,
  Truck,
  Camera,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from "lucide-react"
import SidebarProductor from "../../components/layout/SidebarProductor";

const ConfiguracionPerfilProductor = () => {
  const [currentTab, setCurrentTab] = useState("perfil")
  const [activeSection, setActiveSection] = useState("informacion-basica")
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState({
    // Información básica
    nombre: "Juan Carlos Pérez",
    email: "juan.perez@acuicola.com",
    telefono: "+57 300 123 4567",
    ciudad: "Cartagena, Bolívar",
    direccion_completa: "Km 15 Vía al Mar, Sector Los Estanques",
    descripcion: "Especialista en acuicultura sostenible con más de 15 años de experiencia...",
    foto_perfil: "/placeholder.svg?height=120&width=120",
    years_experience: 15,

    // Información de empresa
    nombre_empresa: "Acuícola El Manantial",
    rfc: "AEM220115ABC",
    tipo_empresa: "Pequeña Empresa",
    num_empleados: "5-10",
    sitio_web: "www.acuicolaelmanantial.com",

    // Redes sociales
    facebook: "acuicolaelmanantial",
    instagram: "acuicola_manantial",
    twitter: "acuicola_m",

    // Horarios y disponibilidad
    horario_atencion_inicio: "08:00",
    horario_atencion_fin: "18:00",
    zona_horaria: "America/Bogota",

    // Días de venta
    dias_venta: {
      lunes: true,
      martes: true,
      miercoles: true,
      jueves: true,
      viernes: true,
      sabado: true,
      domingo: false,
    },

    // Días de envío
    dias_envio: {
      lunes: false,
      martes: true,
      miercoles: false,
      jueves: true,
      viernes: false,
      sabado: true,
      domingo: false,
    },

    // Galería del criadero
    galeria_criadero: [
      {
        id: 1,
        titulo: "Estanque Principal A",
        imagen: "/placeholder.svg?height=400&width=600",
        descripcion: "Nuestro estanque principal donde cultivamos tilapia y cachama",
        area: "2,500 m²",
        especies: ["Tilapia", "Cachama"],
        capacidad: "15,000 peces",
        es_principal: true,
      },
      {
        id: 2,
        titulo: "Laguna de Truchas",
        imagen: "/placeholder.svg?height=400&width=600",
        descripcion: "Laguna especializada en truchas arcoíris de agua fría",
        area: "1,800 m²",
        especies: ["Trucha Arcoíris"],
        capacidad: "8,000 peces",
        es_principal: false,
      },
    ],

    // Certificaciones
    certificaciones: [
      { id: 1, nombre: "Acuicultura Sostenible ASC", fecha_obtencion: "2022-03-15", vigente: true },
      { id: 2, nombre: "Certificación Orgánica", fecha_obtencion: "2021-08-20", vigente: true },
      { id: 3, nombre: "HACCP - Análisis de Peligros", fecha_obtencion: "2020-11-10", vigente: false },
    ],

    // Métodos de envío
    metodos_envio: [
      { id: 1, nombre: "Entrega Local", activo: true, costo: 0, tiempo_entrega: "Mismo día" },
      { id: 2, nombre: "Envío Regional", activo: true, costo: 5.99, tiempo_entrega: "1-2 días" },
      { id: 3, nombre: "Envío Nacional", activo: false, costo: 12.99, tiempo_entrega: "3-5 días" },
    ],

    // Especialidades
    especialidades: ["Pescados de Agua Dulce", "Acuicultura Orgánica", "Truchas Especializadas"],

    // Configuración de visibilidad
    perfil_publico: true,
    mostrar_telefono: true,
    mostrar_email: false,
    mostrar_direccion: true,
  })

  const diasSemana = [
    { key: "lunes", label: "Lunes" },
    { key: "martes", label: "Martes" },
    { key: "miercoles", label: "Miércoles" },
    { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
  ]

  const especialidadesDisponibles = [
    "Pescados de Agua Dulce",
    
  ]

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setUnsavedChanges(true)
  }

  // Manejar cambios en días
  const handleDayToggle = (type, day) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [day]: !prev[type][day],
      },
    }))
    setUnsavedChanges(true)
  }

  // Agregar nueva imagen a la galería
  const handleAddImage = () => {
    const newImage = {
      id: Date.now(),
      titulo: "Nueva Instalación",
      imagen: "/placeholder.svg?height=400&width=600",
      descripcion: "Descripción de la nueva instalación",
      area: "",
      especies: [],
      capacidad: "",
      es_principal: false,
    }

    setFormData((prev) => ({
      ...prev,
      galeria_criadero: [...prev.galeria_criadero, newImage],
    }))
    setUnsavedChanges(true)
  }

  // Eliminar imagen de la galería
  const handleRemoveImage = (imageId) => {
    setFormData((prev) => ({
      ...prev,
      galeria_criadero: prev.galeria_criadero.filter((img) => img.id !== imageId),
    }))
    setUnsavedChanges(true)
  }

  // Actualizar imagen de la galería
  const handleUpdateImage = (imageId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      galeria_criadero: prev.galeria_criadero.map((img) => (img.id === imageId ? { ...img, [field]: value } : img)),
    }))
    setUnsavedChanges(true)
  }

  // Agregar certificación
  const handleAddCertification = () => {
    const newCert = {
      id: Date.now(),
      nombre: "",
      fecha_obtencion: "",
      vigente: true,
    }

    setFormData((prev) => ({
      ...prev,
      certificaciones: [...prev.certificaciones, newCert],
    }))
    setUnsavedChanges(true)
  }

  // Eliminar certificación
  const handleRemoveCertification = (certId) => {
    setFormData((prev) => ({
      ...prev,
      certificaciones: prev.certificaciones.filter((cert) => cert.id !== certId),
    }))
    setUnsavedChanges(true)
  }

  // Actualizar certificación
  const handleUpdateCertification = (certId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      certificaciones: prev.certificaciones.map((cert) => (cert.id === certId ? { ...cert, [field]: value } : cert)),
    }))
    setUnsavedChanges(true)
  }

  // Agregar/quitar especialidad
  const handleToggleEspecialidad = (especialidad) => {
    setFormData((prev) => ({
      ...prev,
      especialidades: prev.especialidades.includes(especialidad)
        ? prev.especialidades.filter((e) => e !== especialidad)
        : [...prev.especialidades, especialidad],
    }))
    setUnsavedChanges(true)
  }

  // Actualizar método de envío
  const handleUpdateMetodoEnvio = (metodoId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      metodos_envio: prev.metodos_envio.map((metodo) =>
        metodo.id === metodoId ? { ...metodo, [field]: value } : metodo,
      ),
    }))
    setUnsavedChanges(true)
  }

  // Guardar cambios
  const handleSave = async () => {
    setLoading(true)
    try {
      // Simular guardado
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setUnsavedChanges(false)
      alert("Perfil actualizado correctamente")
    } catch (error) {
      alert("Error al guardar los cambios")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SidebarProductor currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Configuración del Perfil</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Gestiona tu información, productos y configuración de venta
                  </p>
                </div>

                <div className="mt-4 md:mt-0 flex gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span className="ml-2">{showPreview ? "Ocultar" : "Vista Previa"}</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={!unsavedChanges || loading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      unsavedChanges && !loading ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                    ) : (
                      <Save size={16} className="mr-2" />
                    )}
                    {loading ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>

              {unsavedChanges && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle size={16} className="text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">Tienes cambios sin guardar</span>
                  </div>
                </div>
              )}
            </div>

            {/* Navegación de secciones */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                  {[
                    { id: "informacion-basica", label: "Información Básica", icon: <MapPin size={16} /> },
                    { id: "horarios-disponibilidad", label: "Horarios y Disponibilidad", icon: <Calendar size={16} /> },
                    { id: "galeria-criadero", label: "Galería del Criadero", icon: <Camera size={16} /> },
                    { id: "certificaciones", label: "Certificaciones", icon: <Award size={16} /> },
                    { id: "metodos-envio", label: "Métodos de Envío", icon: <Truck size={16} /> },
                    { id: "configuracion-avanzada", label: "Configuración Avanzada", icon: <Edit size={16} /> },
                  ].map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                        activeSection === section.id
                          ? "border-green-500 text-green-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {section.icon}
                      <span className="ml-2">{section.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contenido de las secciones */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Información Básica */}
              {activeSection === "informacion-basica" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Información Básica</h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Foto de perfil */}
                    <div className="lg:col-span-1">
                      <div className="text-center">
                        <div className="relative inline-block">
                          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto">
                            <img
                              src={formData.foto_perfil || "/placeholder.svg"}
                              alt="Foto de perfil"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full hover:bg-green-700">
                            <Upload size={16} />
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">Haz clic para cambiar tu foto</p>
                      </div>
                    </div>

                    {/* Información personal */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                          <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange("nombre", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                          <input
                            type="tel"
                            value={formData.telefono}
                            onChange={(e) => handleInputChange("telefono", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                          <input
                            type="text"
                            value={formData.ciudad}
                            onChange={(e) => handleInputChange("ciudad", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Completa</label>
                          <input
                            type="text"
                            value={formData.direccion_completa}
                            onChange={(e) => handleInputChange("direccion_completa", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Años de Experiencia</label>
                          <input
                            type="number"
                            value={formData.years_experience}
                            onChange={(e) => handleInputChange("years_experience", Number.parseInt(e.target.value))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                          rows={4}
                          value={formData.descripcion}
                          onChange={(e) => handleInputChange("descripcion", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Describe tu experiencia, especialidades y lo que hace único a tu negocio..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Información de empresa */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Información de Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                        <input
                          type="text"
                          value={formData.nombre_empresa}
                          onChange={(e) => handleInputChange("nombre_empresa", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">RFC/NIT</label>
                        <input
                          type="text"
                          value={formData.rfc}
                          onChange={(e) => handleInputChange("rfc", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Empresa</label>
                        <select
                          value={formData.tipo_empresa}
                          onChange={(e) => handleInputChange("tipo_empresa", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option>Microempresa</option>
                          <option>Pequeña Empresa</option>
                          <option>Mediana Empresa</option>
                          <option>Gran Empresa</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número de Empleados</label>
                        <select
                          value={formData.num_empleados}
                          onChange={(e) => handleInputChange("num_empleados", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option>1-4</option>
                          <option>5-10</option>
                          <option>11-50</option>
                          <option>51-200</option>
                          <option>201+</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                        <input
                          type="url"
                          value={formData.sitio_web}
                          onChange={(e) => handleInputChange("sitio_web", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Redes sociales */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Redes Sociales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            facebook.com/
                          </span>
                          <input
                            type="text"
                            value={formData.facebook}
                            onChange={(e) => handleInputChange("facebook", e.target.value)}
                            className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            instagram.com/
                          </span>
                          <input
                            type="text"
                            value={formData.instagram}
                            onChange={(e) => handleInputChange("instagram", e.target.value)}
                            className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            twitter.com/
                          </span>
                          <input
                            type="text"
                            value={formData.twitter}
                            onChange={(e) => handleInputChange("twitter", e.target.value)}
                            className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Especialidades */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Especialidades</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {especialidadesDisponibles.map((especialidad) => (
                        <label key={especialidad} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.especialidades.includes(especialidad)}
                            onChange={() => handleToggleEspecialidad(especialidad)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{especialidad}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Horarios y Disponibilidad */}
              {activeSection === "horarios-disponibilidad" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Horarios y Disponibilidad</h2>

                  <div className="space-y-8">
                    {/* Horario de atención */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 mb-4">
                        <Clock size={20} className="inline mr-2 text-green-600" />
                        Horario de Atención
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Inicio</label>
                          <input
                            type="time"
                            value={formData.horario_atencion_inicio}
                            onChange={(e) => handleInputChange("horario_atencion_inicio", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Fin</label>
                          <input
                            type="time"
                            value={formData.horario_atencion_fin}
                            onChange={(e) => handleInputChange("horario_atencion_fin", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Zona Horaria</label>
                          <select
                            value={formData.zona_horaria}
                            onChange={(e) => handleInputChange("zona_horaria", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="America/Bogota">Colombia (UTC-5)</option>
                            <option value="America/Mexico_City">México (UTC-6)</option>
                            <option value="America/Lima">Perú (UTC-5)</option>
                            <option value="America/Santiago">Chile (UTC-3)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Días de venta */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 mb-4">
                        <Calendar size={20} className="inline mr-2 text-green-600" />
                        Días de Venta
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">Selecciona los días en que aceptas pedidos y ventas</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {diasSemana.map((dia) => (
                          <label
                            key={dia.key}
                            className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              formData.dias_venta[dia.key]
                                ? "border-green-500 bg-green-50 text-green-800"
                                : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.dias_venta[dia.key]}
                              onChange={() => handleDayToggle("dias_venta", dia.key)}
                              className="sr-only"
                            />
                            <span className="text-sm font-medium">{dia.label}</span>
                            {formData.dias_venta[dia.key] && <Check size={16} className="mt-1" />}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Días de envío */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 mb-4">
                        <Truck size={20} className="inline mr-2 text-green-600" />
                        Días de Envío
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Selecciona los días en que realizas entregas y envíos
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {diasSemana.map((dia) => (
                          <label
                            key={dia.key}
                            className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              formData.dias_envio[dia.key]
                                ? "border-green-500 bg-green-50 text-green-800"
                                : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.dias_envio[dia.key]}
                              onChange={() => handleDayToggle("dias_envio", dia.key)}
                              className="sr-only"
                            />
                            <span className="text-sm font-medium">{dia.label}</span>
                            {formData.dias_envio[dia.key] && <Check size={16} className="mt-1" />}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Galería del Criadero */}
              {activeSection === "galeria-criadero" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Galería del Criadero</h2>
                    <button
                      onClick={handleAddImage}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Plus size={16} className="mr-2" />
                      Agregar Imagen
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {formData.galeria_criadero.map((imagen) => (
                      <div key={imagen.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="relative mb-4">
                          <img
                            src={imagen.imagen || "/placeholder.svg"}
                            alt={imagen.titulo}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleRemoveImage(imagen.id)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                          >
                            <X size={16} />
                          </button>
                          <button className="absolute bottom-2 right-2 bg-green-600 text-white p-2 rounded-full hover:bg-green-700">
                            <Upload size={16} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                            <input
                              type="text"
                              value={imagen.titulo}
                              onChange={(e) => handleUpdateImage(imagen.id, "titulo", e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea
                              rows={2}
                              value={imagen.descripcion}
                              onChange={(e) => handleUpdateImage(imagen.id, "descripcion", e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                              <input
                                type="text"
                                value={imagen.area}
                                onChange={(e) => handleUpdateImage(imagen.id, "area", e.target.value)}
                                placeholder="ej: 2,500 m²"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                              <input
                                type="text"
                                value={imagen.capacidad}
                                onChange={(e) => handleUpdateImage(imagen.id, "capacidad", e.target.value)}
                                placeholder="ej: 15,000 peces"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Especies (separadas por coma)
                            </label>
                            <input
                              type="text"
                              value={imagen.especies.join(", ")}
                              onChange={(e) =>
                                handleUpdateImage(
                                  imagen.id,
                                  "especies",
                                  e.target.value.split(",").map((s) => s.trim()),
                                )
                              }
                              placeholder="ej: Tilapia, Cachama, Trucha"
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`principal-${imagen.id}`}
                              checked={imagen.es_principal}
                              onChange={(e) => handleUpdateImage(imagen.id, "es_principal", e.target.checked)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <label htmlFor={`principal-${imagen.id}`} className="ml-2 text-sm text-gray-700">
                              Imagen principal del criadero
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Certificaciones */}
              {activeSection === "certificaciones" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Certificaciones</h2>
                    <button
                      onClick={handleAddCertification}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Plus size={16} className="mr-2" />
                      Agregar Certificación
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.certificaciones.map((cert) => (
                      <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nombre de la Certificación
                            </label>
                            <input
                              type="text"
                              value={cert.nombre}
                              onChange={(e) => handleUpdateCertification(cert.id, "nombre", e.target.value)}
                              placeholder="ej: Certificación Orgánica"
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Obtención</label>
                            <input
                              type="date"
                              value={cert.fecha_obtencion}
                              onChange={(e) => handleUpdateCertification(cert.id, "fecha_obtencion", e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={cert.vigente}
                                onChange={(e) => handleUpdateCertification(cert.id, "vigente", e.target.checked)}
                                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Vigente</span>
                            </label>

                            <button
                              onClick={() => handleRemoveCertification(cert.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Métodos de Envío */}
              {activeSection === "metodos-envio" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Métodos de Envío</h2>

                  <div className="space-y-4">
                    {formData.metodos_envio.map((metodo) => (
                      <div key={metodo.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Envío</label>
                            <input
                              type="text"
                              value={metodo.nombre}
                              onChange={(e) => handleUpdateMetodoEnvio(metodo.id, "nombre", e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={metodo.costo}
                              onChange={(e) =>
                                handleUpdateMetodoEnvio(metodo.id, "costo", Number.parseFloat(e.target.value))
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de Entrega</label>
                            <input
                              type="text"
                              value={metodo.tiempo_entrega}
                              onChange={(e) => handleUpdateMetodoEnvio(metodo.id, "tiempo_entrega", e.target.value)}
                              placeholder="ej: 1-2 días"
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="flex items-center justify-center">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={metodo.activo}
                                onChange={(e) => handleUpdateMetodoEnvio(metodo.id, "activo", e.target.checked)}
                                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Activo</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Configuración Avanzada */}
              {activeSection === "configuracion-avanzada" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuración Avanzada</h2>

                  <div className="space-y-8">
                    {/* Visibilidad del perfil */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 mb-4">Visibilidad del Perfil</h3>
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.perfil_publico}
                            onChange={(e) => handleInputChange("perfil_publico", e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-3">
                            <span className="text-sm font-medium text-gray-700">Perfil público</span>
                            <p className="text-sm text-gray-500">Tu perfil será visible para todos los consumidores</p>
                          </span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.mostrar_telefono}
                            onChange={(e) => handleInputChange("mostrar_telefono", e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-3">
                            <span className="text-sm font-medium text-gray-700">Mostrar teléfono</span>
                            <p className="text-sm text-gray-500">Los consumidores podrán ver tu número de teléfono</p>
                          </span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.mostrar_email}
                            onChange={(e) => handleInputChange("mostrar_email", e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-3">
                            <span className="text-sm font-medium text-gray-700">Mostrar email</span>
                            <p className="text-sm text-gray-500">Los consumidores podrán ver tu correo electrónico</p>
                          </span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.mostrar_direccion}
                            onChange={(e) => handleInputChange("mostrar_direccion", e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-3">
                            <span className="text-sm font-medium text-gray-700">Mostrar dirección</span>
                            <p className="text-sm text-gray-500">Los consumidores podrán ver tu ubicación</p>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfiguracionPerfilProductor