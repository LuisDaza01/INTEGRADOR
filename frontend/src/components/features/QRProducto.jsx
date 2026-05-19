// ============================================================
// src/components/features/QRProducto.jsx
// Genera y muestra el QR de trazabilidad de un producto
// Usar en la página Inventario del productor
//
// Dependencia: npm install react-qr-code
// ============================================================
import { useState, useRef } from 'react'
import QRCode from 'react-qr-code'
import { QrCode, Download, X, ExternalLink, Copy, CheckCircle } from 'lucide-react'

const QRProducto = ({ producto, onClose }) => {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef(null)

  const BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin
  const trazabilidadUrl = `${BASE_URL}/trazabilidad/${producto.id}`

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(trazabilidadUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const size = 400
    canvas.width = size
    canvas.height = size + 80

    // Fondo blanco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size + 80)

    // Convertir SVG a imagen
    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 20, 20, size - 40, size - 40)
      // Nombre del producto
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(producto.nombre, size / 2, size + 20)
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px sans-serif'
      ctx.fillText('NaturaPiscis · Trazabilidad verificada', size / 2, size + 45)
      ctx.fillText(`ID: ${producto.id}`, size / 2, size + 65)

      const link = document.createElement('a')
      link.download = `qr-trazabilidad-${producto.id}-${producto.nombre.replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <span className="font-semibold">QR de Trazabilidad</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Nombre del producto */}
          <p className="text-center text-gray-900 font-bold text-lg mb-1">{producto.nombre}</p>
          <p className="text-center text-gray-400 text-sm mb-5">ID #{producto.id}</p>

          {/* QR Code */}
          <div ref={qrRef} className="flex justify-center mb-5">
            <div className="p-4 border-2 border-teal-200 rounded-xl bg-teal-50">
              <QRCode
                value={trazabilidadUrl}
                size={180}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                viewBox="0 0 256 256"
                fgColor="#0f766e"
                bgColor="#f0fdfa"
              />
            </div>
          </div>

          {/* URL */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">URL de trazabilidad</p>
            <p className="text-xs text-teal-700 font-mono break-all">{trazabilidadUrl}</p>
          </div>

          {/* Instrucción */}
          <p className="text-xs text-gray-500 text-center mb-4">
            El consumidor escanea este QR y ve el origen, crianza y parámetros del agua de este producto
          </p>

          {/* Acciones */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleCopyUrl}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-xs text-gray-600"
            >
              {copied
                ? <CheckCircle className="h-5 w-5 text-green-600" />
                : <Copy className="h-5 w-5 text-gray-500" />}
              {copied ? 'Copiado' : 'Copiar URL'}
            </button>

            <button
              onClick={handleDownload}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-xs text-gray-600"
            >
              <Download className="h-5 w-5 text-gray-500" />
              Descargar
            </button>

            <a
              href={trazabilidadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-xs text-gray-600"
            >
              <ExternalLink className="h-5 w-5 text-gray-500" />
              Previsualizar
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRProducto