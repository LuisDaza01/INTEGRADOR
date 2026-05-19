"use client"
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, MapPin, RefreshCw, List } from 'lucide-react'
import { API_ENDPOINTS } from '../../config/apiConfig'
import { useTheme } from '../../contexts/ThemeContext'

const CITY_COORDS = {
  'la paz':     [-16.5000, -68.1500],
  'cochabamba': [-17.3895, -66.1568],
  'santa cruz': [-17.7834, -63.1821],
  'oruro':      [-17.9667, -67.1167],
  'potosí':     [-19.5836, -65.7531],
  'potosi':     [-19.5836, -65.7531],
  'sucre':      [-19.0431, -65.2559],
  'tarija':     [-21.5355, -64.7296],
  'trinidad':   [-14.8333, -64.9000],
  'cobija':     [-11.0333, -68.7667],
}

const getCoords = (ubicacion) => {
  if (!ubicacion) return null
  const loc = ubicacion.toLowerCase()
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (loc.includes(city)) return coords
  }
  return null
}

const MapaProductores = () => {
  const { D } = useTheme()
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const [productores, setProductores] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProductores = async () => {
    try {
      setLoading(true)
      const res = await axios.get(API_ENDPOINTS.PRODUCTORES.BASE)
      const data = res.data?.data?.productores || res.data?.data || res.data || []
      setProductores(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProductores() }, [])

  useEffect(() => {
    if (!productores.length || mapObj.current || !mapRef.current) return

    const loadLeaflet = () => new Promise(resolve => {
      if (window.L) { resolve(window.L); return }
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => resolve(window.L)
      document.head.appendChild(script)
    })

    loadLeaflet().then(L => {
      if (!mapRef.current || mapObj.current) return

      const map = L.map(mapRef.current, {
        center: [-16.5, -68.15],
        zoom: 6,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      const icon = L.divIcon({
        html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#38bdf8,#0ea5e9);transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 2px 10px rgba(56,189,248,0.55)"></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      })

      const bounds = []
      productores.forEach(p => {
        const coords = getCoords(p.ubicacion || p.ciudad || '')
        if (!coords) return
        bounds.push(coords)
        const marker = L.marker(coords, { icon }).addTo(map)
        marker.bindPopup(`
          <div style="min-width:190px;font-family:-apple-system,sans-serif">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              ${p.foto_perfil
                ? `<img src="${p.foto_perfil}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0">`
                : `<div style="width:38px;height:38px;border-radius:50%;background:rgba(56,189,248,0.12);display:flex;align-items:center;justify-content:center;font-weight:700;color:#38bdf8;font-size:16px;flex-shrink:0">${(p.nombre || '?')[0].toUpperCase()}</div>`}
              <div style="min-width:0">
                <p style="margin:0;font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.nombre || ''}</p>
                ${p.nombre_empresa ? `<p style="margin:0;font-size:11px;color:#888">${p.nombre_empresa}</p>` : ''}
              </div>
            </div>
            ${p.ubicacion ? `<p style="margin:0 0 3px;font-size:12px;color:#666">📍 ${p.ubicacion}</p>` : ''}
            ${p.especialidad ? `<p style="margin:0 0 10px;font-size:12px;color:#666">🐟 ${p.especialidad}</p>` : '<div style="margin-bottom:10px"></div>'}
            <button onclick="window._navToProductor(${p.id})"
              style="width:100%;padding:8px 0;background:linear-gradient(135deg,#38bdf8,#0ea5e9);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px">
              Ver perfil →
            </button>
          </div>
        `)
      })

      window._navToProductor = (id) => navigate(`/dashboard-consumidor/productor/${id}`)

      if (bounds.length > 1) map.fitBounds(bounds, { padding: [50, 50] })
      else if (bounds.length === 1) map.setView(bounds[0], 10)

      mapObj.current = map
    })

    return () => {
      if (mapObj.current) { mapObj.current.remove(); mapObj.current = null }
      delete window._navToProductor
    }
  }, [productores, navigate])

  const enMapa = productores.filter(p => getCoords(p.ubicacion || p.ciudad || '')).length

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: D.bg }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-popup-content-wrapper { border-radius: 14px !important; box-shadow: 0 8px 30px rgba(0,0,0,0.18) !important; }
        .leaflet-popup-tip-container { display: none; }
        .leaflet-control-attribution { font-size: 10px !important; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, background: D.card, borderBottom: `1px solid ${D.border}`, zIndex: 10, flexShrink: 0 }}>
        <button onClick={() => navigate('/dashboard-consumidor/productores')}
          style={{ padding: 8, borderRadius: 10, background: D.surface, border: `1px solid ${D.border}`, cursor: 'pointer', color: D.text, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: D.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={17} style={{ color: D.primary }} /> Mapa de Productores
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: D.muted }}>
            {loading ? 'Cargando…' : `${enMapa} productor${enMapa !== 1 ? 'es' : ''} en el mapa`}
          </p>
        </div>
        <button onClick={() => navigate('/dashboard-consumidor/productores')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, background: D.surface, border: `1px solid ${D.border}`, cursor: 'pointer', color: D.muted, fontSize: 13, fontWeight: 600 }}>
          <List size={14} /> Lista
        </button>
        <button onClick={fetchProductores}
          style={{ padding: 8, borderRadius: 10, background: D.surface, border: `1px solid ${D.border}`, cursor: 'pointer', color: D.text, display: 'flex', alignItems: 'center' }}>
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bg, zIndex: 5 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${D.border}`, borderTopColor: D.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: D.muted, fontSize: 14, margin: 0 }}>Cargando productores…</p>
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}

export default MapaProductores
