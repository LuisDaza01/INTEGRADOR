// src/screens/consumer/MapaProductoresScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import api from '../../api/axios.config';
import { useTheme } from '../../contexts/ThemeContext';

const CITY_COORDS = {
  'la paz':     [-16.5000, -68.1500],
  'cochabamba': [-17.3895, -66.1568],
  'santa cruz': [-17.7834, -63.1821],
  'oruro':      [-17.9667, -67.1167],
  'potosi':     [-19.5836, -65.7531],
  'potosí':     [-19.5836, -65.7531],
  'sucre':      [-19.0431, -65.2559],
  'tarija':     [-21.5355, -64.7296],
  'trinidad':   [-14.8333, -64.9000],
  'cobija':     [-11.0333, -68.7667],
};

const getCoords = (ubicacion) => {
  if (!ubicacion) return null;
  const loc = ubicacion.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (loc.includes(city)) return coords;
  }
  return null;
};

const buildHtml = (productores) => {
  const markers = productores
    .map(p => {
      const coords = getCoords(p.ubicacion || p.ciudad || '');
      if (!coords) return null;
      return {
        id: p.id,
        nombre: p.nombre || '',
        ubicacion: p.ubicacion || p.ciudad || '',
        especialidad: p.especialidad || '',
        foto_perfil: p.foto_perfil || null,
        lat: coords[0],
        lng: coords[1],
      };
    })
    .filter(Boolean);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:100%; height:100%; background:#0a0f1e; }
  #map { width:100%; height:100vh; }
  .leaflet-popup-content-wrapper {
    background:#131d35; border:1px solid rgba(56,189,248,0.25);
    border-radius:14px; box-shadow:0 4px 20px rgba(0,0,0,0.4);
  }
  .leaflet-popup-content { margin:12px 14px; color:#f1f5f9; min-width:170px; }
  .leaflet-popup-tip { background:#131d35; }
  .popup-btn {
    width:100%; padding:8px 0; margin-top:10px;
    background:linear-gradient(135deg,#38bdf8,#0ea5e9);
    color:white; border:none; border-radius:8px; font-weight:700; font-size:13px;
  }
  .p-name { font-weight:700; font-size:14px; color:#f1f5f9; }
  .p-sub  { font-size:11px; color:#94a3b8; margin-top:2px; }
  .leaflet-tile-pane { filter: brightness(0.85) saturate(1.1); }
</style>
</head>
<body>
<div id="map"></div>
<script>
const productores = ${JSON.stringify(markers)};

const map = L.map('map', { center: [-16.5,-68.15], zoom: 6, zoomControl: false });

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: ''
}).addTo(map);

const icon = L.divIcon({
  html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#38bdf8,#0ea5e9);transform:rotate(-45deg);border:2px solid rgba(255,255,255,0.85);box-shadow:0 2px 10px rgba(56,189,248,0.6)"></div>',
  className: '', iconSize:[26,26], iconAnchor:[13,26], popupAnchor:[0,-28]
});

const bounds = [];
productores.forEach(function(p) {
  bounds.push([p.lat, p.lng]);
  var m = L.marker([p.lat, p.lng], { icon }).addTo(map);
  m.bindPopup(
    '<div>' +
    '<p class="p-name">' + p.nombre + '</p>' +
    (p.ubicacion ? '<p class="p-sub">📍 ' + p.ubicacion + '</p>' : '') +
    (p.especialidad ? '<p class="p-sub">🐟 ' + p.especialidad + '</p>' : '') +
    '<button class="popup-btn" onclick="nav(' + p.id + ')">Ver perfil →</button>' +
    '</div>'
  );
});

if (bounds.length > 1) map.fitBounds(bounds, { padding: [30,30] });
else if (bounds.length === 1) map.setView(bounds[0], 10);

function nav(id) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type:'navigate', id: id }));
}
</script>
</body>
</html>`;
};

const MapaProductoresScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [productores, setProductores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/productores')
      .then(res => {
        const data = res.data?.data?.productores || res.data?.data || res.data || [];
        setProductores(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'navigate') {
        navigation.navigate('DetalleProductor', { id: msg.id });
      }
    } catch {}
  };

  const enMapa = productores.filter(p => getCoords(p.ubicacion || p.ciudad || '')).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mapa de Productores</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Cargando…' : `${enMapa} productor${enMapa !== 1 ? 'es' : ''} en el mapa`}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.listBtn}>
          <Ionicons name="list" size={16} color={colors.textMuted} />
          <Text style={styles.listBtnText}>Lista</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Cargando productores…</Text>
        </View>
      ) : (
        <WebView
          source={{ html: buildHtml(productores) }}
          style={styles.webview}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.centered, StyleSheet.absoluteFill]}>
              <ActivityIndicator size="large" color="#38bdf8" />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:      { padding: 6 },
  title:        { fontSize: 17, fontWeight: '700', color: colors.text },
  subtitle:     { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  listBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  listBtnText:  { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: colors.background },
  loadingText:  { color: colors.textMuted, fontSize: 13 },
  webview:      { flex: 1 },
});

export default MapaProductoresScreen;
