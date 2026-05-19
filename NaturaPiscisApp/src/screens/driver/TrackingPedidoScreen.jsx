// src/screens/driver/TrackingPedidoScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Dimensions, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios.config';

// ✅ FIX CRÍTICO: react-native-maps NO está disponible en Expo Go SDK 52
// El import estático causaba "Property 'a' doesn't exist" en Hermes al inicializar
// Usamos require() condicional igual que CarritoScreen.jsx
const isWeb = Platform.OS === 'web';
const isExpoGo = Constants.appOwnership === 'expo'
  || Constants.executionEnvironment === 'storeClient';

let MapView = null, Marker = null, Polyline = null, PROVIDER_GOOGLE = null;
if (!isExpoGo && !isWeb) {
  try {
    const maps = require('react-native-maps');
    MapView        = maps.default;
    Marker         = maps.Marker;
    Polyline       = maps.Polyline;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.log('react-native-maps no disponible:', e.message);
  }
}

const POLLING_INTERVAL  = 5000;
const GOOGLE_MAPS_KEY   = 'AIzaSyAHk2PMVr6HrM2iXeWplVeYpi25KlhjDXE';

const ESTADOS = [
  { key: 'pendiente',          label: 'Pedido recibido',    icono: 'receipt-outline'          },
  { key: 'confirmado',         label: 'Confirmado',         icono: 'checkmark-circle-outline' },
  { key: 'preparando',         label: 'En preparación',     icono: 'construct-outline'        },
  { key: 'listo_para_recoger', label: 'Listo para recoger', icono: 'bag-check-outline'        },
  { key: 'en_camino',          label: 'En camino',          icono: 'bicycle-outline'          },
  { key: 'entregado',          label: 'Entregado',          icono: 'home-outline'             },
];
const ESTADO_INDEX = Object.fromEntries(ESTADOS.map((e, i) => [e.key, i]));

// ✅ Decodificar polyline de Google
const decodePolyline = (encoded) => {
  const poly = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += dlng;
    poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return poly;
};

// ✅ Obtener ruta real de Google Directions API
const fetchRutaReal = async (origen, destino) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origen.latitude},${origen.longitude}&destination=${destino.latitude},${destino.longitude}&mode=driving&key=${GOOGLE_MAPS_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.routes.length > 0) {
      return decodePolyline(data.routes[0].overview_polyline.points);
    }
  } catch (e) {
    console.error('Error fetching ruta:', e.message);
  }
  return null;
};

// Mapa interactivo con Leaflet + OpenStreetMap (sin API key) + OSRM para rutas reales
const MapaWebView = ({ pedido, webViewRef }) => {
  const parada = pedido?.parada_lat   ? { lat: parseFloat(pedido.parada_lat),    lng: parseFloat(pedido.parada_lng)    } : null;
  const dest   = pedido?.consumidor_lat ? { lat: parseFloat(pedido.consumidor_lat), lng: parseFloat(pedido.consumidor_lng) } : null;
  const cond   = pedido?.conductor_lat  ? { lat: parseFloat(pedido.conductor_lat),  lng: parseFloat(pedido.conductor_lng)  } : null;
  const center = cond || parada || dest || { lat: -17.3895, lng: -66.1568 };
  const nombreParada = (pedido?.parada_nombre || 'Parada de recojo').replace(/'/g, "\\'");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%;background:#0d1a2e}
    .leaflet-control-attribution{display:none}
    .leaflet-control-zoom a{background:#1a2744;color:#94a3b8;border-color:#2d3f6b}
    .leaflet-control-zoom a:hover{background:#2d3f6b;color:#fff}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {zoomControl:true, attributionControl:false})
               .setView([${center.lat}, ${center.lng}], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, subdomains: 'abcd'
    }).addTo(map);

    function mkIcon(color, label) {
      return L.divIcon({
        html: '<div style="background:'+color+';width:36px;height:36px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 8px rgba(0,0,0,0.5)">'+label+'</div>',
        iconSize:[36,36], iconAnchor:[18,18], className:''
      });
    }

    var condMarker, routeLayer;

    // Parada de recojo (origen de la ruta)
    ${parada ? `L.marker([${parada.lat},${parada.lng}], {icon: mkIcon('#F59E0B','📦')}).addTo(map).bindPopup('${nombreParada}');` : ''}
    // Destino final del consumidor
    ${dest ? `L.marker([${dest.lat},${dest.lng}], {icon: mkIcon('#EF4444','🏠')}).addTo(map).bindPopup('Tu dirección');` : ''}
    // Conductor (posición en tiempo real)
    ${cond ? `condMarker = L.marker([${cond.lat},${cond.lng}], {icon: mkIcon('#3B82F6','🚴')}).addTo(map).bindPopup('Conductor');` : ''}

    function fetchRoute(oLat, oLng, dLat, dLng) {
      var url = 'https://router.project-osrm.org/route/v1/driving/'
        + oLng + ',' + oLat + ';' + dLng + ',' + dLat
        + '?overview=full&geometries=geojson';
      fetch(url)
        .then(function(r){ return r.json(); })
        .then(function(data){
          if (data.code === 'Ok' && data.routes.length > 0) {
            if (routeLayer) map.removeLayer(routeLayer);
            routeLayer = L.geoJSON(data.routes[0].geometry, {
              style: {color:'#3B82F6', weight:6, opacity:0.95, lineJoin:'round'}
            }).addTo(map);
            var all = [];
            ${parada ? `all.push([${parada.lat},${parada.lng}]);` : ''}
            ${dest ? `all.push([${dest.lat},${dest.lng}]);` : ''}
            if (condMarker) all.push(condMarker.getLatLng());
            if (all.length >= 2) map.fitBounds(L.latLngBounds(all), {padding:[50,50]});
          }
        })
        .catch(function(){});
    }

    // Ruta inicial: parada de recojo → destino (antes de que el conductor tenga GPS)
    ${parada && dest ? `fetchRoute(${cond ? cond.lat : parada.lat}, ${cond ? cond.lng : parada.lng}, ${dest.lat}, ${dest.lng});` : ''}

    function actualizarConductor(lat, lng) {
      if (condMarker) {
        condMarker.setLatLng([lat, lng]);
      } else {
        condMarker = L.marker([lat, lng], {icon: mkIcon('#3B82F6','🚴')}).addTo(map).bindPopup('Conductor');
      }
      ${dest ? `fetchRoute(lat, lng, ${dest.lat}, ${dest.lng});` : ''}
    }
  </script>
</body>
</html>`;

  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      style={StyleSheet.absoluteFill}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['*']}
      mixedContentMode="always"
    />
  );
};

const TrackingPedidoScreen = ({ route, navigation }) => {
  const { pedidoId } = route.params;
  const { colors }   = useTheme();
  const { token }    = useAuth();

  const [pedido,      setPedido]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [vistaActual, setVistaActual] = useState('detalles');
  const [rutaCoords,  setRutaCoords]  = useState([]);

  const pulseAnim       = useRef(new Animated.Value(1)).current;
  const pollingRef      = useRef(null);
  const mapRef          = useRef(null);
  const webViewRef      = useRef(null);
  const rutaCargadaRef  = useRef(false);
  const prevEstadoRef   = useRef(null);

  const fetchTracking = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      // ✅ usa instancia api con token automático
      const res = await api.get(`/pedidos/${pedidoId}/tracking`);
      const data = res.data?.data || res.data;
      setPedido(data);

      if (data?.conductor_lat && data?.conductor_lng && mapRef.current && vistaActual === 'mapa') {
        mapRef.current.animateToRegion({
          latitude:      parseFloat(data.conductor_lat),
          longitude:     parseFloat(data.conductor_lng),
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 800);
      }
    } catch (err) {
      console.error('Tracking error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [pedidoId, vistaActual]);

  // Cargar ruta planificada: parada de recojo → destino final
  useEffect(() => {
    if (!pedido || rutaCargadaRef.current) return;

    const origen = pedido.parada_lat && pedido.parada_lng
      ? { latitude: parseFloat(pedido.parada_lat), longitude: parseFloat(pedido.parada_lng) }
      : null;
    const destino = pedido.consumidor_lat && pedido.consumidor_lng
      ? { latitude: parseFloat(pedido.consumidor_lat), longitude: parseFloat(pedido.consumidor_lng) }
      : null;

    if (origen && destino) {
      rutaCargadaRef.current = true;
      fetchRutaReal(origen, destino).then(coords => {
        if (coords?.length > 0) setRutaCoords(coords);
      });
    }
  }, [pedido]);

  // Inyectar nueva posición del conductor en el WebView en tiempo real
  useEffect(() => {
    if (!pedido?.conductor_lat || !pedido?.conductor_lng || !webViewRef.current) return;
    const lat = parseFloat(pedido.conductor_lat);
    const lng = parseFloat(pedido.conductor_lng);
    if (!lat || !lng) return;
    webViewRef.current.injectJavaScript(`actualizarConductor(${lat},${lng}); true;`);
  }, [pedido?.conductor_lat, pedido?.conductor_lng]);

  // Actualizar ruta en tiempo real cuando el conductor se mueve
  useEffect(() => {
    if (!pedido?.conductor_lat || !pedido?.conductor_lng || pedido.estado !== 'en_camino') return;
    const destino = pedido.consumidor_lat && pedido.consumidor_lng
      ? { latitude: parseFloat(pedido.consumidor_lat), longitude: parseFloat(pedido.consumidor_lng) }
      : null;
    if (!destino) return;
    fetchRutaReal(
      { latitude: parseFloat(pedido.conductor_lat), longitude: parseFloat(pedido.conductor_lng) },
      destino
    ).then(coords => { if (coords?.length > 0) setRutaCoords(coords); });
  }, [pedido?.conductor_lat, pedido?.conductor_lng]);

  // Notificación cuando el conductor recoge el pedido
  useEffect(() => {
    if (!pedido?.estado) return;
    const prev = prevEstadoRef.current;
    prevEstadoRef.current = pedido.estado;
    if (!prev || prev === pedido.estado) return;
    if (pedido.estado === 'en_camino') {
      Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Tu pedido está en camino! 🚴',
          body: `${pedido.repartidor_nombre || 'Tu conductor'} ya recogió tu pedido y va hacia ti.`,
          sound: true,
        },
        trigger: null,
      }).catch(() => {});
      // Auto-abrir mapa cuando el conductor sale
      setVistaActual('mapa');
    }
    if (pedido.estado === 'entregado') {
      Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Pedido entregado! ✅',
          body: 'Tu pedido ha sido entregado exitosamente.',
          sound: true,
        },
        trigger: null,
      }).catch(() => {});
    }
  }, [pedido?.estado]);

  useEffect(() => {
    fetchTracking();
    pollingRef.current = setInterval(() => fetchTracking(true), POLLING_INTERVAL);
    return () => clearInterval(pollingRef.current);
  }, [fetchTracking]);

  useEffect(() => {
    if (pedido?.estado === 'entregado' || pedido?.estado === 'cancelado') {
      clearInterval(pollingRef.current);
    }
  }, [pedido?.estado]);

  useEffect(() => {
    if (pedido?.estado === 'en_camino') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [pedido?.estado]);

  useEffect(() => {
    if (vistaActual === 'mapa' && mapRef.current) {
      setTimeout(() => {
        const pts = rutaCoords.length > 0 ? rutaCoords : getMapPoints();
        if (pts.length >= 2) {
          mapRef.current?.fitToCoordinates(pts, {
            edgePadding: { top: 100, right: 60, bottom: 220, left: 60 },
            animated: true,
          });
        }
      }, 600);
    }
  }, [vistaActual]);

  const getMapPoints = () => {
    const pts = [];
    if (pedido?.parada_lat     && pedido?.parada_lng)
      pts.push({ latitude: parseFloat(pedido.parada_lat),     longitude: parseFloat(pedido.parada_lng)     });
    if (pedido?.conductor_lat  && pedido?.conductor_lng)
      pts.push({ latitude: parseFloat(pedido.conductor_lat),  longitude: parseFloat(pedido.conductor_lng)  });
    if (pedido?.consumidor_lat && pedido?.consumidor_lng)
      pts.push({ latitude: parseFloat(pedido.consumidor_lat), longitude: parseFloat(pedido.consumidor_lng) });
    return pts;
  };

  const estadoIndex  = pedido ? (ESTADO_INDEX[pedido.estado] ?? -1) : -1;
  const esCancelado  = pedido?.estado === 'cancelado';
  const enCamino     = pedido?.estado === 'en_camino';
  const tieneGPS     = !!(pedido?.conductor_lat && pedido?.conductor_lng
    && String(pedido.conductor_lat) !== 'null'
    && parseFloat(pedido.conductor_lat) !== 0);
  const tieneMapa    = !!(pedido?.parada_lat || pedido?.consumidor_lat);
  const estadoPermiteMapa = ['confirmado','preparando','listo_para_recoger','en_camino'].includes(pedido?.estado);

  const getColorEstado = (estado) => {
    if (estado === 'cancelado') return '#EF4444';
    if (estado === 'entregado') return '#22C55E';
    if (estado === 'en_camino') return '#3B82F6';
    return colors.primary;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return null;
    return new Date(fecha).toLocaleString('es-BO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading && !pedido) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Cargando tu pedido...</Text>
      </SafeAreaView>
    );
  }

  const estadoColor = getColorEstado(pedido?.estado);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ══════════ VISTA MAPA ══════════ */}
      {vistaActual === 'mapa' && (
        <View style={{ flex: 1 }}>
          {/* En Expo Go usa WebView con Google Maps JS API; en build nativo usa MapView */}
          {isExpoGo || !MapView ? (
            <MapaWebView pedido={pedido} webViewRef={webViewRef} />
          ) : (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              provider={PROVIDER_GOOGLE}
              initialRegion={
                tieneGPS ? {
                  latitude:      parseFloat(pedido.conductor_lat),
                  longitude:     parseFloat(pedido.conductor_lng),
                  latitudeDelta: 0.05, longitudeDelta: 0.05,
                } : pedido?.parada_lat ? {
                  latitude:      parseFloat(pedido.parada_lat),
                  longitude:     parseFloat(pedido.parada_lng),
                  latitudeDelta: 0.08, longitudeDelta: 0.08,
                } : {
                  latitude: -17.3895, longitude: -66.1568,
                  latitudeDelta: 0.5, longitudeDelta: 0.5,
                }
              }
              onMapReady={() => {
                const pts = rutaCoords.length > 0 ? rutaCoords : getMapPoints();
                if (pts.length >= 2 && mapRef.current) {
                  mapRef.current.fitToCoordinates(pts, {
                    edgePadding: { top: 100, right: 60, bottom: 220, left: 60 },
                    animated: true,
                  });
                }
              }}
            >
              {pedido?.parada_lat && pedido?.parada_lng && (
                <Marker
                  coordinate={{ latitude: parseFloat(pedido.parada_lat), longitude: parseFloat(pedido.parada_lng) }}
                  title={pedido.parada_nombre || 'Parada de recojo'}
                  description="Punto de recojo del conductor"
                >
                  <View style={styles.markerProductor}>
                    <Ionicons name="bag-check-outline" size={18} color="#fff" />
                  </View>
                </Marker>
              )}

              {tieneGPS && (
                <Marker
                  coordinate={{ latitude: parseFloat(pedido.conductor_lat), longitude: parseFloat(pedido.conductor_lng) }}
                  title={pedido.repartidor_nombre || 'Conductor'}
                >
                  <Animated.View style={[styles.markerConductor, { transform: [{ scale: pulseAnim }] }]}>
                    <Ionicons name="bicycle" size={20} color="#fff" />
                  </Animated.View>
                </Marker>
              )}

              {pedido?.consumidor_lat && pedido?.consumidor_lng && (
                <Marker
                  coordinate={{ latitude: parseFloat(pedido.consumidor_lat), longitude: parseFloat(pedido.consumidor_lng) }}
                  title="Tu dirección"
                >
                  <View style={styles.markerConsumidor}>
                    <Ionicons name="home" size={18} color="#fff" />
                  </View>
                </Marker>
              )}

              {rutaCoords.length > 0 && (
                <Polyline coordinates={rutaCoords} strokeColor="#3B82F6" strokeWidth={4} />
              )}
              {rutaCoords.length === 0 && getMapPoints().length >= 2 && (
                <Polyline coordinates={getMapPoints()} strokeColor="#93C5FD" strokeWidth={2} lineDashPattern={[8, 4]} />
              )}
            </MapView>
          )}

          {/* Header sobre el mapa */}
          <SafeAreaView style={styles.mapTopBar} edges={['top']}>
            <TouchableOpacity style={styles.mapBackBtn} onPress={() => setVistaActual('detalles')}>
              <Ionicons name="arrow-back" size={22} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.liveChip}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveChipText}>En vivo</Text>
            </View>
            <TouchableOpacity style={styles.mapCenterBtn} onPress={() => {
              if (mapRef.current && !isExpoGo) {
                const pts = rutaCoords.length > 0 ? rutaCoords : getMapPoints();
                if (pts.length >= 2) {
                  mapRef.current.fitToCoordinates(pts, {
                    edgePadding: { top: 100, right: 60, bottom: 220, left: 60 },
                    animated: true,
                  });
                }
              }
            }}>
              <Ionicons name="locate" size={22} color="#1F2937" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Leyenda */}
          <View style={styles.mapLeyenda}>
            {[['#22C55E','Productor'],['#3B82F6','Conductor'],['#EF4444','Tu dirección']].map(([color, label]) => (
              <View key={label} style={styles.leyendaItem}>
                <View style={[styles.leyendaDot, { backgroundColor: color }]} />
                <Text style={styles.leyendaText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Card inferior */}
          <View style={[styles.mapBottomCard, { backgroundColor: colors.card }]}>
            <View style={styles.conductorRow}>
              <View style={[styles.conductorAvatar, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="bicycle" size={24} color="#3B82F6" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.conductorNombre, { color: colors.text }]}>
                  {pedido?.repartidor_nombre || 'Tu conductor'}
                </Text>
                <Text style={[styles.conductorSub, { color: colors.textSecondary }]}>
                  Pedido #{pedidoId} · {pedido?.codigo_retiro}
                </Text>
              </View>
            </View>
            <View style={[styles.actualizandoRow, { backgroundColor: colors.surface }]}>
              <Ionicons name="refresh-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.actualizandoText, { color: colors.textSecondary }]}>
                Ubicación en tiempo real · cada 5 seg
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ══════════ VISTA DETALLES ══════════ */}
      {vistaActual === 'detalles' && (
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Seguimiento del pedido</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {tieneMapa && estadoPermiteMapa && (
                <TouchableOpacity style={styles.mapChip} onPress={() => setVistaActual('mapa')}>
                  <Ionicons name="map" size={14} color="#fff" />
                  <Text style={styles.mapChipText}>Ver mapa</Text>
                </TouchableOpacity>
              )}
              {!esCancelado && pedido?.estado !== 'entregado' && (
                <View style={styles.liveBadge}>
                  <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                  <Text style={styles.liveText}>En vivo</Text>
                </View>
              )}
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Banner en camino */}
            {enCamino && (
              <TouchableOpacity
                style={styles.enCaminoBanner}
                onPress={() => setVistaActual('mapa')}
                activeOpacity={0.85}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name="bicycle" size={22} color="#fff" />
                </Animated.View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.enCaminoBannerTitle}>¡Tu conductor está en camino!</Text>
                  <Text style={styles.enCaminoBannerSub}>Toca para ver la ruta en tiempo real →</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}

            {/* Código de retiro */}
            <View style={[styles.codigoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Código de tu pedido</Text>
              </View>
              <Text style={[styles.codigoCodigo, { color: colors.primary }]}>
                {pedido?.codigo_retiro || '---'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                El productor usa este código para entregar al conductor
              </Text>
            </View>

            {/* Estado actual */}
            {esCancelado ? (
              <View style={[styles.estadoCard, { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }]}>
                <Ionicons name="close-circle" size={32} color="#EF4444" />
                <Text style={[styles.estadoCardTitle, { color: '#EF4444' }]}>Pedido cancelado</Text>
              </View>
            ) : (
              <View style={[styles.estadoCard, { backgroundColor: colors.card, borderColor: estadoColor }]}>
                <Animated.View style={{ transform: [{ scale: enCamino ? pulseAnim : 1 }] }}>
                  <Ionicons name={ESTADOS[estadoIndex]?.icono || 'time-outline'} size={36} color={estadoColor} />
                </Animated.View>
                <Text style={[styles.estadoCardTitle, { color: estadoColor }]}>
                  {ESTADOS[estadoIndex]?.label || pedido?.estado}
                </Text>
                {pedido?.fecha_recogida && (
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Recogido: {formatFecha(pedido.fecha_recogida)}
                  </Text>
                )}
                {estadoPermiteMapa && tieneMapa && (
                  <TouchableOpacity style={styles.miniMapBtn} onPress={() => setVistaActual('mapa')}>
                    <Ionicons name="map-outline" size={16} color="#3B82F6" />
                    <Text style={styles.miniMapText}>
                      {enCamino ? 'Ver conductor en el mapa →' : 'Ver ruta planificada →'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Timeline */}
            {!esCancelado && (
              <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Progreso del pedido</Text>
                {ESTADOS.map((estado, index) => {
                  const completado = index <= estadoIndex;
                  const esActual   = index === estadoIndex;
                  const esUltimo   = index === ESTADOS.length - 1;
                  return (
                    <View key={estado.key} style={styles.timelineItem}>
                      {!esUltimo && (
                        <View style={[styles.timelineLine, {
                          backgroundColor: completado && !esActual ? colors.primary : colors.border,
                        }]} />
                      )}
                      <View style={[styles.timelineCircle, {
                        backgroundColor: completado ? colors.primary : colors.card,
                        borderColor:     completado ? colors.primary : colors.border,
                        borderWidth: 2,
                      }]}>
                        {completado && <Ionicons name={esActual ? estado.icono : 'checkmark'} size={13} color="#fff" />}
                      </View>
                      <View style={{ flex: 1, paddingBottom: 8 }}>
                        <Text style={{
                          fontSize: 14,
                          color:      completado ? colors.text : colors.textSecondary,
                          fontWeight: esActual ? '600' : '400',
                        }}>{estado.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Conductor */}
            {pedido?.repartidor_nombre && (
              <View style={[styles.conductorCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Tu conductor</Text>
                <View style={styles.conductorRow}>
                  <View style={[styles.conductorAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="bicycle" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.conductorNombre, { color: colors.text }]}>{pedido.repartidor_nombre}</Text>
                    {pedido.repartidor_telefono && (
                      <Text style={[styles.conductorSub, { color: colors.textSecondary }]}>{pedido.repartidor_telefono}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {pedido?.estado === 'entregado' && (
              <View style={[styles.entregadoBanner, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#16A34A' }}>
                  ¡Entregado el {formatFecha(pedido.fecha_entrega_real)}!
                </Text>
              </View>
            )}

            {!esCancelado && pedido?.estado !== 'entregado' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Ionicons name="refresh-outline" size={13} color={colors.textSecondary} />
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Se actualiza automáticamente cada 5 segundos
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  mapTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  mapBackBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  mapCenterBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  liveChipText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  mapLeyenda: {
    position: 'absolute', top: 100, right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: 10, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
  },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaDot:  { width: 10, height: 10, borderRadius: 5 },
  leyendaText: { fontSize: 11, color: '#374151', fontWeight: '500' },
  mapBottomCard: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  actualizandoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, marginTop: 12 },
  actualizandoText: { fontSize: 12 },
  markerProductor: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#22C55E',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 6,
  },
  markerConductor: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#3B82F6',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 6,
  },
  markerConsumidor: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600' },
  liveBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  liveText:    { fontSize: 12, color: '#22C55E', fontWeight: '600' },
  mapChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  mapChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  codigoCard:    { borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center', gap: 6 },
  codigoCodigo:  { fontSize: 28, fontWeight: '700', letterSpacing: 3 },
  estadoCard:    { borderRadius: 14, borderWidth: 2, padding: 20, alignItems: 'center', gap: 8 },
  estadoCardTitle: { fontSize: 20, fontWeight: '700' },
  miniMapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 4, padding: 8, borderRadius: 8, backgroundColor: '#EFF6FF',
  },
  miniMapText:   { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  timelineCard:  { borderRadius: 14, borderWidth: 1, padding: 16, gap: 4 },
  sectionTitle:  { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  timelineItem:  { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 8, minHeight: 44, position: 'relative' },
  timelineLine:  { position: 'absolute', left: 19, top: 28, width: 2, height: 32 },
  timelineCircle:{ width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 14, marginTop: 2 },
  conductorCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  conductorRow:  { flexDirection: 'row', alignItems: 'center' },
  conductorAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  conductorNombre: { fontSize: 16, fontWeight: '600' },
  conductorSub:    { fontSize: 13, marginTop: 2 },
  entregadoBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 10 },
  enCaminoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#2563EB', borderRadius: 14, padding: 14,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  enCaminoBannerTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  enCaminoBannerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
});

export default TrackingPedidoScreen;