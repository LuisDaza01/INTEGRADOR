// src/screens/consumer/DetalleProductorScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Linking, Alert, ActivityIndicator, Dimensions,
  FlatList, Modal, ImageBackground, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';

const BLURHASH = { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' };
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/axios.config';
import { useTheme } from '../../contexts/ThemeContext';
import { useCarrito } from '../../contexts/CarritoContext';
import { producerService } from '../../api/services/producer.service';

const { width } = Dimensions.get('window');

const DIAS = [
  { key: 'lunes',     label: 'L' },
  { key: 'martes',    label: 'M' },
  { key: 'miercoles', label: 'M' },
  { key: 'jueves',    label: 'J' },
  { key: 'viernes',   label: 'V' },
  { key: 'sabado',    label: 'S' },
  { key: 'domingo',   label: 'D' },
];

const CATEGORIAS_GALERIA = [
  { id: 'general',      label: 'Criadero',    icono: '🏞️' },
  { id: 'alimentacion', label: 'Alimentación', icono: '🐟' },
  { id: 'captura',      label: 'Captura',      icono: '🎣' },
  { id: 'preparacion',  label: 'Preparación',  icono: '🔪' },
];

const FAVS_KEY = 'consumer_product_favs';

const DetalleProductorScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { refresh: refreshCarrito } = useCarrito();
  const C = {
    bg:      colors.background,
    surface: colors.surface,
    card:    colors.card,
    border:  colors.border,
    text:    colors.text,
    sub:     colors.textSecondary,
    hint:    colors.textMuted,
    primary: colors.primary,
    teal:    '#22C55E',
    green:   '#4ade80',
    orange:  '#fb923c',
    purple:  '#c084fc',
    muted:   colors.textMuted,
    dim:     colors.border,
    red:     '#f87171',
    yellow:  '#fbbf24',
  };
  const styles = makeStyles(C, width);

  const { id } = route.params;

  const [loading, setLoading]       = useState(true);
  const [productor, setProductor]   = useState(null);
  const [productos, setProductos]   = useState([]);
  const [cartCount, setCartCount]   = useState(0);
  const [galeriaTab, setGaleriaTab] = useState('general');
  const [visorItem, setVisorItem]   = useState(null);
  const [reviews, setReviews]       = useState([]);
  const [favs, setFavs]             = useState(new Set());
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [calDias, setCalDias] = useState([]);
  const [calLoading, setCalLoading] = useState(false);
  const [calCursor, setCalCursor] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [detailProduct, setDetailProduct] = useState(null);
  const [modalQty, setModalQty] = useState(1);

  useEffect(() => { fetchProductor(); loadFavs(); }, [id]);

  // Cargar calendario del rango visible (6 semanas alrededor del mes actual del cursor)
  useEffect(() => {
    if (!id) return;
    const cargar = async () => {
      setCalLoading(true);
      try {
        const desde = new Date(calCursor); desde.setDate(1);
        const dow = (desde.getDay() + 6) % 7;
        desde.setDate(desde.getDate() - dow);
        const hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 41);

        const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const r = await api.get(`/productores/${id}/calendario`, {
          params: { desde: ymd(desde), hasta: ymd(hasta) },
        });
        setCalDias(r.data?.data || []);
      } catch {
        setCalDias([]);
      } finally {
        setCalLoading(false);
      }
    };
    cargar();
  }, [id, calCursor]);

  const loadFavs = async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVS_KEY);
      if (raw) setFavs(new Set(JSON.parse(raw)));
    } catch {}
  };

  const toggleFav = async (productoId) => {
    setFavs(prev => {
      const next = new Set(prev);
      next.has(productoId) ? next.delete(productoId) : next.add(productoId);
      AsyncStorage.setItem(FAVS_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  };

  const fetchProductor = async () => {
    try {
      setLoading(true);
      const [prodRes, prodsRes] = await Promise.all([
        api.get(`/productores/${id}`),
        api.get(`/productores/${id}/productos`).catch(() => ({ data: { data: [] } })),
      ]);
      setProductor(prodRes.data.data || prodRes.data);
      setProductos(prodsRes.data.data || prodsRes.data || []);
      const revRes = await producerService.getOpiniones(id);
      if (revRes.success) setReviews(revRes.data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el productor');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCall     = () => productor?.telefono && Linking.openURL(`tel:${productor.telefono}`);
  const handleWhatsApp = () => {
    if (productor?.telefono) {
      const phone = productor.telefono.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=591${phone}`);
    }
  };
  const handleEmail    = () => productor?.email && Linking.openURL(`mailto:${productor.email}`);
  const handleWeb      = () => productor?.sitio_web && Linking.openURL(productor.sitio_web);
  const handleInstagram = () => {
    if (productor?.instagram) {
      const user = productor.instagram.replace('@', '').replace(/.*instagram\.com\//, '');
      Linking.openURL(`https://instagram.com/${user}`);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Conoce a ${productor?.nombre_empresa || productor?.nombre} en NaturaPiscis — productos acuícolas frescos. ${productor?.ubicacion || 'Bolivia'}`,
        title: productor?.nombre_empresa || productor?.nombre,
      });
    } catch {}
  };

  const addToCart = async (producto, qty = 1) => {
    try {
      await api.post('/carrito', { producto_id: producto.id, cantidad: qty });
      setCartCount(prev => prev + qty);
      refreshCarrito();
      Alert.alert('✅ Agregado', `${producto.nombre} agregado a tu reserva`);
    } catch {
      Alert.alert('Error', 'No se pudo agregar a la reserva');
    }
  };

  // Helpers de datos
  const isDiaActivo = useCallback((key) => {
    if (!productor?.dias_venta) return false;
    const dv = productor.dias_venta;
    if (Array.isArray(dv)) return dv.includes(key);
    if (typeof dv === 'object') return !!dv[key];
    return false;
  }, [productor]);

  const getHorario = () => {
    const ini = productor?.horario_atencion_inicio;
    const fin = productor?.horario_atencion_fin;
    if (ini && fin) return `${ini} – ${fin}`;
    if (ini) return `Desde ${ini}`;
    return null;
  };

  const getCerts = () => {
    const c = productor?.certificaciones;
    if (!c) return [];
    if (Array.isArray(c)) return c;
    if (typeof c === 'string') {
      try { return JSON.parse(c); } catch { return [c]; }
    }
    return [];
  };

  const getMetodosEnvio = () => {
    const m = productor?.metodos_envio;
    if (!m) return [];
    if (Array.isArray(m)) return m;
    if (typeof m === 'string') {
      try { return JSON.parse(m); } catch { return [m]; }
    }
    return [];
  };

  const getEspecialidad = () => {
    const e = productor?.especialidad;
    if (!e) return [];
    if (Array.isArray(e)) return e;
    if (typeof e === 'string') {
      try { const parsed = JSON.parse(e); return Array.isArray(parsed) ? parsed : [e]; }
      catch { return [e]; }
    }
    return [];
  };

  const getProductImg = (p) => p.foto_principal || p.imagen_url || p.imagen || null;

  // ── Stars helper ─────────────────────────────────────────────────────────────
  const Stars = ({ rating = 0, size = 12 }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Ionicons key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={size} color={C.yellow} />
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={{ color: C.muted, marginTop: 12, fontSize: 13 }}>Cargando perfil…</Text>
      </View>
    );
  }

  if (!productor) return null;

  const initials    = productor.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'P';
  const rating      = parseFloat(productor.calificacion_promedio || productor.rating || 0);
  const totalReviews = parseInt(productor.total_reviews || productor.reseñas_count || 0);
  const horario     = getHorario();
  const certs       = getCerts();
  const metodos     = getMetodosEnvio();
  const especialidad = getEspecialidad();

  const galeriaCats = CATEGORIAS_GALERIA.filter(cat =>
    (productor.galeria_criadero || []).some(i => (i.categoria || 'general') === cat.id)
  );
  const galeriaItems = (productor.galeria_criadero || []).filter(
    i => (i.categoria || 'general') === galeriaTab
  );
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO HEADER ─────────────────────────────── */}
        <View style={styles.heroWrapper}>
          {productor.foto_portada ? (
            <ImageBackground source={{ uri: productor.foto_portada }} style={styles.heroBg} resizeMode="cover">
              <LinearGradient colors={['rgba(10,15,30,0.4)', 'rgba(10,15,30,0.82)', '#0a0f1e']} style={styles.heroGradient} />
            </ImageBackground>
          ) : (
            <LinearGradient colors={['#0c1e3e', '#0a1428', C.bg]} style={styles.heroBg} />
          )}

          <View style={styles.glowOrb1} />
          <View style={styles.glowOrb2} />
          <LinearGradient
            colors={['transparent', C.primary, C.teal, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />

          {/* Back + Share buttons */}
          <SafeAreaView edges={['top']} style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Avatar + info */}
          <View style={styles.profileSection}>
            <View style={styles.avatarRing}>
              {productor.foto_perfil ? (
                <ExpoImage source={{ uri: productor.foto_perfil }} style={styles.avatarImg} contentFit="cover" transition={250} placeholder={BLURHASH} />
              ) : (
                <LinearGradient colors={['rgba(34,197,94,0.3)', 'rgba(74,222,128,0.2)']} style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
              {productor.is_available_today && <View style={styles.onlineDot} />}
            </View>

            {/* Verificado badge */}
            {productor.verificado && (
              <View style={styles.verificadoBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#4ade80" />
                <Text style={styles.verificadoText}>Verificado</Text>
              </View>
            )}

            <Text style={styles.producerName}>{productor.nombre}</Text>
            {productor.nombre_empresa && productor.nombre_empresa !== 'no hay' && (
              <Text style={styles.empresaText}>{productor.nombre_empresa}</Text>
            )}

            {/* Chips: ubicación + especialidad */}
            <View style={styles.chipsRow}>
              {(productor.ciudad || productor.ubicacion) && (
                <View style={styles.chip}>
                  <Ionicons name="location-outline" size={11} color={C.primary} />
                  <Text style={[styles.chipText, { color: C.primary }]}>{productor.ciudad || productor.ubicacion}</Text>
                </View>
              )}
              {especialidad.slice(0, 2).map((esp, i) => (
                <View key={i} style={[styles.chip, { borderColor: `${C.purple}40` }]}>
                  <Ionicons name="fish-outline" size={11} color={C.purple} />
                  <Text style={[styles.chipText, { color: C.purple }]}>{esp}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stats bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={14} color={C.yellow} />
              <Text style={styles.statValue}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
              {totalReviews > 0 && <Text style={styles.statLabel}>({totalReviews})</Text>}
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="cube-outline" size={14} color={C.primary} />
              <Text style={styles.statValue}>{productos.length}</Text>
              <Text style={styles.statLabel}>Productos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={C.teal} />
              <Text style={styles.statValue}>{productor.years_experience || 0}</Text>
              <Text style={styles.statLabel}>Años exp.</Text>
            </View>
            {totalReviews > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Stars rating={rating} size={11} />
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── CONTENIDO ───────────────────────────────── */}
        <View style={styles.content}>

          {/* Descripción + certificaciones */}
          {(productor.descripcion || certs.length > 0) && (
            <View style={styles.section}>
              {productor.descripcion ? (
                <>
                  <Text style={styles.sectionTitle}>Acerca del productor</Text>
                  <Text style={styles.description}>{productor.descripcion}</Text>
                </>
              ) : null}
              {certs.length > 0 && (
                <View style={{ marginTop: productor.descripcion ? 14 : 0 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Certificaciones</Text>
                  <View style={styles.tagsRow}>
                    {certs.map((cert, i) => (
                      <View key={i} style={styles.certTag}>
                        <Ionicons name="ribbon-outline" size={12} color={C.green} />
                        <Text style={[styles.tagText, { color: C.green }]}>{cert}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Galería */}
          {galeriaCats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Galería del Criadero</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {galeriaCats.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setGaleriaTab(cat.id)}
                    style={[styles.galeriaTab, galeriaTab === cat.id && { backgroundColor: 'rgba(34,197,94,0.18)', borderColor: C.primary }]}
                  >
                    <Text style={styles.galeriaTabIcono}>{cat.icono}</Text>
                    <Text style={[styles.galeriaTabLabel, { color: galeriaTab === cat.id ? C.primary : C.muted }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {galeriaItems.length === 0 ? (
                <View style={styles.galeriaEmpty}>
                  <Ionicons name="images-outline" size={28} color={C.dim} />
                  <Text style={[styles.galeriaEmptyText, { color: C.dim }]}>Sin contenido en esta sección</Text>
                </View>
              ) : (
                <FlatList
                  horizontal
                  data={galeriaItems}
                  keyExtractor={(_, i) => String(i)}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setVisorItem(item)} activeOpacity={0.85}>
                      <Image source={{ uri: item.url }} style={styles.galeriaTile} resizeMode="cover" />
                      {item.tipo === 'video' && (
                        <View style={styles.galeriaVideoBadge}>
                          <Ionicons name="play-circle" size={26} color="#fff" />
                        </View>
                      )}
                      {item.titulo ? (
                        <View style={styles.galeriaTituloBar}>
                          <Text style={styles.galeriaTitulo} numberOfLines={1}>{item.titulo}</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}

          {/* Horario + Días de atención */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horario de atención</Text>
            {horario && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color={C.teal} />
                <Text style={[styles.infoText, { color: C.teal }]}>{horario}</Text>
              </View>
            )}
            <View style={styles.daysRow}>
              {DIAS.map((dia) => {
                const activo = isDiaActivo(dia.key);
                return (
                  <View key={dia.key} style={[styles.dayBadge, activo && styles.dayBadgeActive]}>
                    <Text style={[styles.dayText, { color: activo ? '#fff' : C.dim }]}>{dia.label}</Text>
                  </View>
                );
              })}
            </View>
            {metodos.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.miniLabel, { marginBottom: 8 }]}>Métodos de envío</Text>
                <View style={styles.tagsRow}>
                  {metodos.map((m, i) => (
                    <View key={i} style={[styles.certTag, { borderColor: `${C.orange}40` }]}>
                      <Ionicons name="car-outline" size={12} color={C.orange} />
                      <Text style={[styles.tagText, { color: C.orange }]}>{m}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Calendario de reservas (mensual) */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={styles.sectionTitle}>Calendario de reservas</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={() => setCalCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
                  style={{ padding: 6, borderRadius: 6, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }}>
                  <Ionicons name="chevron-back" size={14} color={C.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCalCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
                  style={{ padding: 6, borderRadius: 6, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }}>
                  <Ionicons name="chevron-forward" size={14} color={C.text} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8, textTransform: 'capitalize' }}>
              {calCursor.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
            </Text>

            {/* Cabecera L M X J V S D */}
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              {['L','M','X','J','V','S','D'].map((l, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 3 }}>
                  <Text style={{ color: C.dim, fontSize: 10, fontWeight: '700' }}>{l}</Text>
                </View>
              ))}
            </View>

            {/* Grid 6 semanas */}
            {calLoading ? (
              <ActivityIndicator size="small" color={C.green} style={{ marginVertical: 8 }} />
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {(() => {
                  const desde = new Date(calCursor); desde.setDate(1);
                  const dow0 = (desde.getDay() + 6) % 7;
                  desde.setDate(desde.getDate() - dow0);
                  const ymdStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                  const hoyStr = ymdStr(new Date());
                  const byFecha = new Map(calDias.map(d => [d.fecha, d]));
                  const productosReservables = productos.filter(p => p.disponible !== false && (p.stock ?? 1) > 0);
                  const cells = [];
                  for (let i = 0; i < 42; i++) {
                    const dt = new Date(desde); dt.setDate(desde.getDate() + i);
                    const fecha = ymdStr(dt);
                    const enMes = dt.getMonth() === calCursor.getMonth();
                    const dia = byFecha.get(fecha);
                    const disponible = dia?.disponible === true;
                    const esPasado = fecha < hoyStr;
                    const esHoy = fecha === hoyStr;
                    const clickable = disponible && !esPasado;
                    let bg = 'transparent', color = C.dim, borderColor = C.border, borderWidth = 1;
                    if (disponible && !esPasado) {
                      bg = 'rgba(34,197,94,0.14)';
                      color = '#22c55e';
                      borderColor = 'rgba(34,197,94,0.35)';
                    } else if (dia && !disponible) {
                      bg = 'rgba(239,68,68,0.10)';
                      color = '#ef4444';
                      borderColor = 'rgba(239,68,68,0.25)';
                    }
                    if (esHoy) { borderColor = C.primary; borderWidth = 2; }
                    const onTap = () => {
                      if (!clickable) return;
                      if (productosReservables.length === 1) {
                        navigation.navigate('DetalleProducto', { id: productosReservables[0].id, fechaPreseleccionada: fecha });
                      } else if (productosReservables.length === 0) {
                        Alert.alert('Sin productos', 'Este productor no tiene productos disponibles en este momento.');
                      } else {
                        Alert.alert(
                          'Elige un producto',
                          `Tienes ${productosReservables.length} productos disponibles. Toca el que quieras reservar para ${dt.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })}.`,
                        );
                      }
                    };
                    cells.push(
                      <TouchableOpacity
                        key={fecha}
                        disabled={!clickable}
                        onPress={onTap}
                        style={{ width: `${100/7}%`, aspectRatio: 1, padding: 2 }}>
                        <View style={{
                          flex: 1, borderRadius: 8, backgroundColor: bg, borderWidth, borderColor,
                          alignItems: 'center', justifyContent: 'center',
                          opacity: enMes ? (esPasado ? 0.4 : 1) : 0.25,
                        }}>
                          <Text style={{ color, fontSize: 13, fontWeight: esHoy ? '800' : '600' }}>{dt.getDate()}</Text>
                          {dia?.cupo_restante != null && disponible && (
                            <Text style={{ position: 'absolute', bottom: 1, right: 3, fontSize: 8, fontWeight: '700', color: '#fbbf24' }}>{dia.cupo_restante}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }
                  return cells;
                })()}
              </View>
            )}

            {/* Leyenda */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: 'rgba(34,197,94,0.4)' }} />
                <Text style={{ fontSize: 10, color: C.dim }}>Disponible</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: 'rgba(239,68,68,0.4)' }} />
                <Text style={{ fontSize: 10, color: C.dim }}>Bloqueado</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 9, height: 9, borderRadius: 2, borderWidth: 1, borderColor: C.border }} />
                <Text style={{ fontSize: 10, color: C.dim }}>Inactivo</Text>
              </View>
            </View>
            <Text style={{ fontSize: 10, color: C.dim, fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}>
              Toca un día verde para reservar
            </Text>
          </View>

          {/* Contacto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <View style={styles.contactButtons}>
              <TouchableOpacity style={[styles.contactBtn, { borderColor: `${C.primary}40` }]} onPress={handleCall}>
                <Ionicons name="call-outline" size={18} color={C.primary} />
                <Text style={[styles.contactBtnText, { color: C.primary }]}>Llamar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.contactBtn, styles.whatsappBtn]} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={[styles.contactBtnText, { color: '#fff' }]}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.contactBtn, { borderColor: `${C.teal}40` }]} onPress={handleEmail}>
                <Ionicons name="mail-outline" size={18} color={C.teal} />
                <Text style={[styles.contactBtnText, { color: C.teal }]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactBtn, { borderColor: 'rgba(59,130,246,0.35)', backgroundColor: 'rgba(59,130,246,0.08)' }]}
                onPress={() => navigation.navigate('Chat', { destinatarioId: productor.id, nombre: productor.nombre, foto: productor.foto_perfil })}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3B82F6" />
                <Text style={[styles.contactBtnText, { color: '#3B82F6' }]}>Chat</Text>
              </TouchableOpacity>
            </View>

            {/* Redes sociales */}
            {(productor.sitio_web || productor.instagram || productor.facebook) && (
              <View style={[styles.socialRow, { marginTop: 12 }]}>
                {productor.sitio_web && (
                  <TouchableOpacity style={styles.socialBtn} onPress={handleWeb}>
                    <Ionicons name="globe-outline" size={20} color={C.primary} />
                    <Text style={[styles.socialText, { color: C.primary }]}>Sitio web</Text>
                  </TouchableOpacity>
                )}
                {productor.instagram && (
                  <TouchableOpacity style={[styles.socialBtn, { borderColor: '#e1306c40' }]} onPress={handleInstagram}>
                    <Ionicons name="logo-instagram" size={20} color="#e1306c" />
                    <Text style={[styles.socialText, { color: '#e1306c' }]}>Instagram</Text>
                  </TouchableOpacity>
                )}
                {productor.facebook && (
                  <TouchableOpacity
                    style={[styles.socialBtn, { borderColor: '#1877f240' }]}
                    onPress={() => Linking.openURL(productor.facebook)}>
                    <Ionicons name="logo-facebook" size={20} color="#1877f2" />
                    <Text style={[styles.socialText, { color: '#1877f2' }]}>Facebook</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Reseñas */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Reseñas ({reviews.length})</Text>
                {rating > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Stars rating={rating} size={12} />
                    <Text style={{ color: C.yellow, fontSize: 13, fontWeight: '700' }}>{rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
              {visibleReviews.map(r => (
                <View key={r.id} style={[styles.reviewCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <View style={styles.reviewAvatar}>
                      {r.foto_perfil
                        ? <Image source={{ uri: r.foto_perfil }} style={{ width: 34, height: 34, borderRadius: 17 }} />
                        : <Text style={[styles.reviewAvatarText, { color: C.primary }]}>{(r.usuario_nombre?.[0] || 'U').toUpperCase()}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: C.text, fontSize: 13 }}>{r.usuario_nombre}</Text>
                      <Text style={{ fontSize: 11, color: C.muted }}>{r.producto_nombre}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Stars rating={r.calificacion} size={11} />
                      {r.fecha && (
                        <Text style={{ fontSize: 10, color: C.dim }}>
                          {new Date(r.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
                        </Text>
                      )}
                    </View>
                  </View>
                  {r.comentario ? <Text style={{ fontSize: 13, color: C.sub, lineHeight: 19 }}>{r.comentario}</Text> : null}
                  {r.respuesta ? (
                    <View style={styles.reviewReply}>
                      <Text style={[styles.reviewReplyLabel, { color: C.primary }]}>Respuesta del productor</Text>
                      <Text style={{ fontSize: 12, color: C.muted }}>{r.respuesta}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
              {reviews.length > 3 && (
                <TouchableOpacity
                  style={[styles.showMoreBtn, { borderColor: C.border }]}
                  onPress={() => setShowAllReviews(v => !v)}>
                  <Text style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>
                    {showAllReviews ? 'Ver menos' : `Ver las ${reviews.length - 3} reseñas restantes`}
                  </Text>
                  <Ionicons name={showAllReviews ? 'chevron-up' : 'chevron-down'} size={16} color={C.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Productos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos ({productos.length})</Text>

            {/* Nota peso mínimo */}
            {productos.some(p => p.unidad === 'kg' || p.unidad === 'Kg' || p.unidad === 'KG') && (
              <View style={styles.notaPesoBanner}>
                <Ionicons name="information-circle-outline" size={16} color={C.orange} />
                <Text style={[styles.notaPesoText, { color: C.orange }]}>
                  Los productos por kilo se venden desde 800g en adelante. El precio final puede variar según el peso exacto.
                </Text>
              </View>
            )}

            {productos.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name="fish-outline" size={36} color={C.dim} />
                <Text style={{ color: C.dim, marginTop: 8, fontSize: 13 }}>Sin productos disponibles</Text>
              </View>
            ) : (
              <View style={styles.productsGrid}>
                {[...productos]
                  .sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0))
                  .map(producto => {
                    const imgUri  = getProductImg(producto);
                    const agotado = !producto.stock || producto.stock <= 0;
                    const esPorKg = ['kg','Kg','KG'].includes(producto.unidad);
                    return (
                      <TouchableOpacity
                        key={producto.id}
                        style={[styles.productCard, agotado && { opacity: 0.72 }]}
                        onPress={() => { setDetailProduct(producto); setModalQty(1); }}
                        activeOpacity={0.85}
                      >
                        {/* imagen cuadrada */}
                        <View style={styles.productImageBox}>
                          {imgUri
                            ? <ExpoImage source={{ uri: imgUri }} style={styles.productImg} contentFit="cover" transition={250} placeholder={BLURHASH} />
                            : <View style={styles.productImgPlaceholder}>
                                <Ionicons name="fish-outline" size={28} color={C.dim} />
                              </View>
                          }
                          {agotado && (
                            <View style={{ position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.38)', borderRadius: 0 }}>
                              <View style={{ backgroundColor: 'rgba(239,68,68,0.85)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>Agotado</Text>
                              </View>
                            </View>
                          )}
                          {esPorKg && !agotado && (
                            <View style={styles.porKiloBadge}>
                              <Text style={{ fontSize: 8, fontWeight: '700', color: C.orange }}>⚖ x kilo</Text>
                            </View>
                          )}
                        </View>
                        {/* footer */}
                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={1}>{producto.nombre}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                              <Text style={[styles.productPrice, { color: agotado ? C.dim : C.primary }]}>
                                Bs {parseFloat(producto.precio || 0).toFixed(2)}
                              </Text>
                              {producto.unidad && <Text style={{ fontSize: 10, color: C.dim }}>/{producto.unidad}</Text>}
                            </View>
                            <TouchableOpacity
                              style={[styles.addButton, { backgroundColor: agotado ? C.dim : C.primary }]}
                              onPress={() => !agotado && addToCart(producto, 1)}
                              disabled={agotado}
                            >
                              <Ionicons name="cart-outline" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                }
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal detalle de producto */}
      <Modal visible={!!detailProduct} transparent animationType="slide" onRequestClose={() => setDetailProduct(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setDetailProduct(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}
            style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
            {/* imagen */}
            {(() => {
              if (!detailProduct) return null;
              const imgUri  = getProductImg(detailProduct);
              const agotado = !detailProduct.stock || detailProduct.stock <= 0;
              const esPorKg = ['kg','Kg','KG'].includes(detailProduct.unidad);
              return (
                <>
                  <View style={{ height: 240, backgroundColor: 'rgba(34,197,94,0.05)', position: 'relative' }}>
                    {imgUri
                      ? <ExpoImage source={{ uri: imgUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={250} placeholder={BLURHASH} />
                      : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="fish-outline" size={64} color="rgba(34,197,94,0.2)" />
                        </View>
                    }
                    {agotado && (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.42)' }}>
                        <View style={{ backgroundColor: 'rgba(239,68,68,0.85)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 }}>
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>Agotado</Text>
                        </View>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => setDetailProduct(null)}
                      style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ padding: 22 }}>
                    {/* nombre + stock */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, flex: 1, lineHeight: 26 }}>{detailProduct.nombre}</Text>
                      <View style={{ backgroundColor: agotado ? 'rgba(248,113,113,0.14)' : 'rgba(74,222,128,0.14)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: agotado ? C.red : C.green }}>
                          {agotado ? 'Sin stock' : `${detailProduct.stock} ${detailProduct.unidad || 'kg'}`}
                        </Text>
                      </View>
                    </View>
                    {esPorKg && !agotado && (
                      <View style={{ backgroundColor: 'rgba(251,146,60,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: C.orange }}>⚖ por kilo · mín. 800g</Text>
                      </View>
                    )}
                    {detailProduct.descripcion && (
                      <Text style={{ fontSize: 13, color: C.sub, lineHeight: 20, marginBottom: 16 }}>{detailProduct.descripcion}</Text>
                    )}
                    {/* precio */}
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: agotado ? 0 : 16 }}>
                      <Text style={{ fontSize: 30, fontWeight: '900', color: agotado ? C.dim : C.primary }}>
                        Bs {parseFloat(detailProduct.precio || 0).toFixed(2)}
                      </Text>
                      {detailProduct.unidad && <Text style={{ fontSize: 13, color: C.dim }}>/ {detailProduct.unidad}</Text>}
                    </View>

                    {!agotado && (
                      <>
                        {/* Reservar — acción principal: agrega y lleva a elegir la fecha */}
                        <TouchableOpacity
                          onPress={async () => { await addToCart(detailProduct, modalQty); setDetailProduct(null); navigation.navigate('ConsumerTabs', { screen: 'Carrito' }); }}
                          style={{ height: 50, borderRadius: 14, backgroundColor: C.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 10, shadowColor: C.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 }}>
                          <Ionicons name="calendar-outline" size={19} color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Reservar para una fecha</Text>
                        </TouchableOpacity>

                        {/* Agregar a la reserva — acción secundaria, con selector de cantidad */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden' }}>
                            <TouchableOpacity onPress={() => setModalQty(q => Math.max(1, q - 1))}
                              style={{ width: 38, height: 44, justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ fontSize: 22, color: C.sub, lineHeight: 26 }}>−</Text>
                            </TouchableOpacity>
                            <Text style={{ width: 34, textAlign: 'center', fontSize: 16, fontWeight: '700', color: C.text }}>{modalQty}</Text>
                            <TouchableOpacity onPress={() => setModalQty(q => q + 1)}
                              style={{ width: 38, height: 44, justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ fontSize: 22, color: C.sub, lineHeight: 26 }}>+</Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            onPress={async () => { await addToCart(detailProduct, modalQty); setDetailProduct(null); }}
                            style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: C.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 18 }}>
                            <Ionicons name="add" size={18} color={C.primary} />
                            <Text style={{ color: C.primary, fontWeight: '700', fontSize: 14 }}>Agregar a la reserva</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                </>
              );
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Visor galería */}
      <Modal visible={!!visorItem} transparent animationType="fade" onRequestClose={() => setVisorItem(null)}>
        <View style={styles.visorBg}>
          <TouchableOpacity style={styles.visorClose} onPress={() => setVisorItem(null)}>
            <Ionicons name="close-circle" size={38} color="#fff" />
          </TouchableOpacity>
          {visorItem?.tipo === 'video' ? (
            <Video source={{ uri: visorItem.url }} style={styles.visorMedia}
              useNativeControls resizeMode={ResizeMode.CONTAIN} shouldPlay />
          ) : (
            <Image source={{ uri: visorItem?.url }} style={styles.visorMedia} resizeMode="contain" />
          )}
          {visorItem?.titulo ? (
            <View style={styles.visorTituloBar}>
              <Text style={styles.visorTituloText}>{visorItem.titulo}</Text>
            </View>
          ) : null}
        </View>
      </Modal>

      {/* Carrito flotante */}
      {cartCount > 0 && (
        <TouchableOpacity style={[styles.floatingCart, { backgroundColor: C.primary, shadowColor: C.primary }]}
          onPress={() => navigation.navigate('ConsumerTabs', { screen: 'Carrito' })}>
          <Ionicons name="cart" size={24} color="#fff" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const makeStyles = (C, W) => StyleSheet.create({
  container:    { flex: 1 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Hero
  heroWrapper:  { position: 'relative', minHeight: 340 },
  heroBg:       { ...StyleSheet.absoluteFillObject },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  glowOrb1:     { position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(34,197,94,0.08)' },
  glowOrb2:     { position: 'absolute', bottom: 0, left: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(74,222,128,0.06)' },
  accentLine:   { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },

  topBar:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  iconBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },

  profileSection:  { alignItems: 'center', paddingHorizontal: 16, marginTop: 12, paddingBottom: 8 },
  avatarRing:      { width: 92, height: 92, borderRadius: 46, padding: 2, borderWidth: 2.5, borderColor: '#22C55E', marginBottom: 10, position: 'relative', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  avatarImg:       { width: '100%', height: '100%', borderRadius: 44, resizeMode: 'cover' },
  avatarFallback:  { width: '100%', height: '100%', borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  avatarInitials:  { fontSize: 28, fontWeight: 'bold', color: '#22C55E' },
  onlineDot:       { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#4ade80', borderWidth: 2, borderColor: '#0a0f1e' },

  verificadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(74,222,128,0.12)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.35)', marginBottom: 8 },
  verificadoText:  { fontSize: 12, fontWeight: '600', color: '#4ade80' },

  producerName: { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', textAlign: 'center' },
  empresaText:  { fontSize: 14, color: '#22C55E', marginTop: 2 },

  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, justifyContent: 'center' },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.07)' },
  chipText:     { fontSize: 11, fontWeight: '600' },

  statsBar:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 4, backgroundColor: 'rgba(34,197,94,0.06)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(34,197,94,0.12)' },
  statItem:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statValue:    { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  statLabel:    { fontSize: 11, color: C.muted },
  statDivider:  { width: 1, height: 18, backgroundColor: 'rgba(34,197,94,0.15)', marginHorizontal: 12 },

  // Content
  content:      { paddingHorizontal: 14, paddingTop: 14 },
  section:      { backgroundColor: C.card, borderRadius: 16, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  description:  { fontSize: 14, lineHeight: 21, color: C.muted },

  miniLabel:    { fontSize: 12, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3 },

  // Tags / certs
  tagsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  certTag:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)', backgroundColor: 'rgba(74,222,128,0.07)' },
  tagText:      { fontSize: 12, fontWeight: '600' },

  // Galería
  galeriaTab:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, marginRight: 8, backgroundColor: C.surface },
  galeriaTabIcono: { fontSize: 13 },
  galeriaTabLabel: { fontSize: 12, fontWeight: '600' },
  galeriaEmpty:    { alignItems: 'center', paddingVertical: 20, gap: 8 },
  galeriaEmptyText:{ fontSize: 13 },
  galeriaTile:     { width: 145, height: 145, borderRadius: 12 },
  galeriaVideoBadge: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 },
  galeriaTituloBar:{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, paddingHorizontal: 6, paddingVertical: 4 },
  galeriaTitulo:   { color: '#fff', fontSize: 10, fontWeight: '600' },

  // Horario / días
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoText:     { fontSize: 14, fontWeight: '600' },
  daysRow:      { flexDirection: 'row', gap: 7 },
  dayBadge:     { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  dayBadgeActive: { backgroundColor: 'rgba(34,197,94,0.18)', borderColor: 'rgba(34,197,94,0.4)' },
  dayText:      { fontSize: 12, fontWeight: '700' },

  // Chips de próximas fechas disponibles

  // Contacto
  contactButtons: { flexDirection: 'row', gap: 7 },
  contactBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 12, borderWidth: 1, gap: 4, backgroundColor: C.surface },
  contactBtnText: { fontSize: 11, fontWeight: '600' },
  whatsappBtn:    { backgroundColor: 'rgba(37,211,102,0.15)', borderColor: 'rgba(37,211,102,0.35)' },

  // Redes sociales
  socialRow:    { flexDirection: 'row', gap: 8 },
  socialBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: `${C.primary}40`, backgroundColor: C.surface },
  socialText:   { fontSize: 12, fontWeight: '600' },

  // Reseñas
  reviewCard:      { borderRadius: 12, borderWidth: 1, padding: 13, marginBottom: 9 },
  reviewAvatar:    { width: 34, height: 34, borderRadius: 17, backgroundColor: C.primary + '22', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  reviewAvatarText: { fontWeight: '700', fontSize: 14 },
  reviewReply:     { marginTop: 9, padding: 9, backgroundColor: C.primary + '10', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: C.primary },
  reviewReplyLabel: { fontSize: 11, fontWeight: '700', marginBottom: 3 },
  showMoreBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 4 },

  // Nota peso
  notaPesoBanner:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 11, borderRadius: 12, backgroundColor: 'rgba(251,146,60,0.08)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.25)', marginBottom: 12 },
  notaPesoText:    { flex: 1, fontSize: 12, lineHeight: 17 },

  // Productos
  productsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productCard:     { width: (W - 70) / 2, borderRadius: 14, overflow: 'hidden', backgroundColor: C.surface, borderWidth: 1, borderColor: 'rgba(34,197,94,0.1)' },
  productImageBox: { width: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', position: 'relative', backgroundColor: 'rgba(34,197,94,0.05)' },
  productImg:      { width: '100%', height: '100%', resizeMode: 'cover' },
  productImgPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  porKiloBadge:    { position: 'absolute', bottom: 6, left: 6, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(251,146,60,0.18)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.35)' },
  productInfo:     { padding: 10, paddingBottom: 10 },
  productName:     { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  productPrice:    { fontSize: 14, fontWeight: 'bold' },
  addButton:       { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },

  // Carrito flotante
  floatingCart: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  cartBadge:    { position: 'absolute', top: -4, right: -4, backgroundColor: C.red, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: C.bg },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Visor
  visorBg:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center', alignItems: 'center' },
  visorClose:    { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  visorMedia:    { width: W, height: W, maxHeight: '80%' },
  visorTituloBar: { position: 'absolute', bottom: 60, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12 },
  visorTituloText: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
});

export default DetalleProductorScreen;
