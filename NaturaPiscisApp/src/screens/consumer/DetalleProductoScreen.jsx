// src/screens/consumer/DetalleProductoScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, ActivityIndicator, Dimensions, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios.config';

const { width } = Dimensions.get('window');
const MAX_MENSAJE = 200;

const DetalleProductoScreen = ({ navigation, route }) => {
  const { id, fechaPreseleccionada } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading,         setLoading]         = useState(true);
  const [producto,        setProducto]        = useState(null);
  const [mensajeReserva,  setMensajeReserva]  = useState('');
  const [cantidadReserva, setCantidadReserva] = useState('1');
  const [horaReserva,     setHoraReserva]     = useState('');
  const [fechaReserva,    setFechaReserva]    = useState(fechaPreseleccionada || '');
  const [calendario,      setCalendario]      = useState([]);
  const [calendarioLoading, setCalendarioLoading] = useState(false);
  const [calCursor,       setCalCursor]       = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [reservando,      setReservando]      = useState(false);
  const [opiniones,       setOpiniones]       = useState([]);
  const [loadingOpiniones,setLoadingOpiniones]= useState(false);
  const [miCalificacion,  setMiCalificacion]  = useState(0);
  const [miComentario,    setMiComentario]    = useState('');
  const [enviandoOpinion, setEnviandoOpinion] = useState(false);
  const [imgIndex,        setImgIndex]        = useState(0);

  // Galería del producto: usa imagenes[] o cae a la imagen única
  const galeriaDe = (p) => {
    let arr = [];
    if (Array.isArray(p?.imagenes)) arr = p.imagenes.filter(Boolean);
    else if (typeof p?.imagenes === 'string') { try { arr = JSON.parse(p.imagenes).filter(Boolean); } catch { arr = []; } }
    if (arr.length === 0) {
      const unica = p?.imagen || p?.imagen_url || p?.foto_principal;
      if (unica) arr = [unica];
    }
    return arr;
  };

  useEffect(() => { fetchProducto(); fetchOpiniones(); }, [id]);

  // Cargar calendario del rango visible (6 semanas alrededor del mes actual del cursor)
  useEffect(() => {
    if (!producto?.productor_id) return;
    const cargar = async () => {
      setCalendarioLoading(true);
      try {
        // primer lunes visible (retrocede al lunes)
        const desde = new Date(calCursor);
        desde.setDate(1);
        const dow = (desde.getDay() + 6) % 7;
        desde.setDate(desde.getDate() - dow);
        const hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 41); // 6 semanas

        const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const r = await api.get(`/productores/${producto.productor_id}/calendario`, {
          params: { desde: ymd(desde), hasta: ymd(hasta) },
        });
        setCalendario(r.data?.data || []);
      } catch {
        setCalendario([]);
      } finally {
        setCalendarioLoading(false);
      }
    };
    cargar();
  }, [producto?.productor_id, calCursor]);

  const fetchProducto = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/productos/${id}`);
      setProducto(res.data.data || res.data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el producto');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchOpiniones = async () => {
    try {
      setLoadingOpiniones(true);
      const res = await api.get(`/opiniones/producto/${id}`);
      setOpiniones(res.data.data || []);
    } catch { /* silent */ } finally {
      setLoadingOpiniones(false);
    }
  };

  const submitOpinion = async () => {
    if (!miCalificacion) {
      Alert.alert('Calificación requerida', 'Toca las estrellas para calificar el producto');
      return;
    }
    setEnviandoOpinion(true);
    try {
      await api.post('/opiniones', {
        producto_id: id,
        calificacion: miCalificacion,
        comentario: miComentario.trim() || undefined,
      });
      Alert.alert('¡Gracias!', 'Tu reseña fue publicada correctamente');
      setMiCalificacion(0);
      setMiComentario('');
      fetchOpiniones();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo publicar la reseña');
    } finally {
      setEnviandoOpinion(false);
    }
  };

  const getStockInfo = (stock) => {
    if (!stock || stock === 0) return { label: 'Sin stock',                   color: '#ef4444', bg: '#fef2f2' };
    if (stock <= 5)            return { label: `Últimas ${stock} unidades`,   color: '#f97316', bg: '#fff7ed' };
    if (stock <= 20)           return { label: `${stock} kg disponibles`,     color: '#eab308', bg: '#fefce8' };
    return                            { label: `${stock} kg disponibles`,     color: '#22c55e', bg: '#f0fdf4' };
  };

  const handleReservar = async () => {
    if (!fechaReserva) {
      Alert.alert('Selecciona fecha', 'Elige una fecha disponible del productor');
      return;
    }
    const cant = parseFloat(cantidadReserva);
    if (!Number.isFinite(cant) || cant <= 0) {
      Alert.alert('Cantidad inválida');
      return;
    }

    setReservando(true);
    try {
      await api.post('/reservas', {
        productor_id:  producto.productor_id,
        producto_id:   producto.id,
        cantidad:      cant,
        fecha_reserva: fechaReserva,
        hora_reserva:  horaReserva || null,
        notas:         mensajeReserva.trim() || null,
      });

      Alert.alert(
        '✅ Reserva enviada',
        'El productor tiene 24 h para aceptar o rechazar tu reserva. Te avisaremos.',
        [{ text: 'Ver mis reservas', onPress: () => navigation.navigate('MisReservas') }]
      );
      setMensajeReserva(''); setFechaReserva(''); setHoraReserva(''); setCantidadReserva('1');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo enviar la reserva.');
    } finally {
      setReservando(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!producto) return null;

  const stockInfo   = getStockInfo(producto.stock);
  const disponible  = producto.disponible !== false && (producto.stock || 0) > 0;
  const charCount   = mensajeReserva.length;
  const galeria     = galeriaDe(producto);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Galería de fotos — carrusel deslizable */}
        <View style={styles.imageContainer}>
          {galeria.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e => {
                  const i = Math.round(e.nativeEvent.contentOffset.x / width);
                  setImgIndex(i);
                }}
              >
                {galeria.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={[styles.productImage, { width }]} />
                ))}
              </ScrollView>

              {/* Indicador de puntos */}
              {galeria.length > 1 && (
                <View style={styles.dotsRow}>
                  {galeria.map((_, i) => (
                    <View key={i} style={[
                      styles.dot,
                      { backgroundColor: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.45)', width: i === imgIndex ? 18 : 6 },
                    ]} />
                  ))}
                </View>
              )}

              {/* Contador de fotos */}
              {galeria.length > 1 && (
                <View style={styles.imgCounter}>
                  <Ionicons name="images-outline" size={12} color="#fff" />
                  <Text style={styles.imgCounterText}>{imgIndex + 1}/{galeria.length}</Text>
                </View>
              )}
            </>
          ) : (
            <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.imagePlaceholder}>
              <Ionicons name="fish-outline" size={80} color="#3B82F6" />
            </LinearGradient>
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Info principal */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: colors.text }]}>{producto.nombre}</Text>
              <View style={styles.categoryBadge}>
                <Ionicons name="fish-outline" size={12} color="#3B82F6" />
                <Text style={styles.categoryText}>{producto.categoria_nombre || producto.categoria || 'Pescado Fresco'}</Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Precio</Text>
              <Text style={styles.price}>Bs {parseFloat(producto.precio || 0).toFixed(2)}</Text>
              <Text style={[styles.priceUnit, { color: colors.textSecondary }]}>por kg</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.surfaceVariant }]}>
            <View style={styles.statItem}>
              <Ionicons name="cube-outline" size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{producto.stock || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Stock (kg)</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Number(producto.promedio_valoracion) > 0 ? Number(producto.promedio_valoracion).toFixed(1) : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calificación</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <View style={[styles.stockDot, { backgroundColor: stockInfo.bg }]}>
                <Ionicons
                  name={disponible ? 'checkmark-circle-outline' : 'close-circle-outline'}
                  size={18}
                  color={stockInfo.color}
                />
              </View>
              <Text style={[styles.statValue, { color: stockInfo.color, fontSize: 12 }]}>
                {disponible ? 'Sí' : 'No'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Disponible</Text>
            </View>
          </View>

          {/* Badge de stock */}
          <View style={[styles.stockBadge, { backgroundColor: stockInfo.bg, borderColor: stockInfo.color + '40' }]}>
            <Ionicons name="layers-outline" size={14} color={stockInfo.color} />
            <Text style={[styles.stockText, { color: stockInfo.color }]}>{stockInfo.label}</Text>
          </View>
        </View>

        {/* Descripción */}
        {producto.descripcion && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Descripción</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {producto.descripcion}
            </Text>
          </View>
        )}

        {/* Productor */}
        {(producto.productor_nombre || producto.productor_id) && (
          <TouchableOpacity
            style={[styles.section, styles.productorCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('DetalleProductor', { id: producto.productor_id })}
          >
            <View style={[styles.productorAvatar, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.productorLabel, { color: colors.textSecondary }]}>Productor</Text>
              <Text style={[styles.productorNombre, { color: colors.text }]}>
                {producto.productor_nombre || 'Ver productor'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Reseñas */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reseñas{opiniones.length > 0 ? ` (${opiniones.length})` : ''}
          </Text>

          {opiniones.length > 0 && (() => {
            const avg = opiniones.reduce((s, o) => s + o.calificacion, 0) / opiniones.length;
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text }}>{avg.toFixed(1)}</Text>
                <View>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1,2,3,4,5].map(s => (
                      <Ionicons key={s} name={s <= Math.round(avg) ? 'star' : 'star-outline'} size={14} color="#F59E0B" />
                    ))}
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    {opiniones.length} reseña{opiniones.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            );
          })()}

          {loadingOpiniones ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
          ) : opiniones.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 14, fontStyle: 'italic' }}>
              Aún no hay reseñas. ¡Sé el primero!
            </Text>
          ) : (
            opiniones.slice(0, 3).map((op, i) => (
              <View key={op.id} style={[styles.reviewItem, i === 0 ? { borderTopWidth: 0 } : { borderTopColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <View style={[styles.reviewAvatar, { backgroundColor: colors.primary + '20' }]}>
                    {op.foto_perfil
                      ? <Image source={{ uri: op.foto_perfil }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                      : <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>{op.usuario_nombre?.[0]?.toUpperCase()}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{op.usuario_nombre}</Text>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {[1,2,3,4,5].map(s => (
                        <Ionicons key={s} name={s <= op.calificacion ? 'star' : 'star-outline'} size={11} color="#F59E0B" />
                      ))}
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    {new Date(op.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
                  </Text>
                </View>
                {op.comentario ? (
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>{op.comentario}</Text>
                ) : null}
                {op.respuesta ? (
                  <View style={{ marginTop: 6, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: colors.primary, marginLeft: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary, marginBottom: 2 }}>Respuesta del productor:</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{op.respuesta}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )}

          {opiniones.length > 3 && (
            <Text style={{ fontSize: 12, color: colors.primary, marginBottom: 6 }}>
              +{opiniones.length - 3} reseña{opiniones.length - 3 !== 1 ? 's' : ''} más
            </Text>
          )}

          <View style={[styles.reviewFormBox, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>Tu calificación</Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>🔒 Solo compradores</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {[1,2,3,4,5].map(s => (
                <TouchableOpacity key={s} onPress={() => setMiCalificacion(s)} activeOpacity={0.7}>
                  <Ionicons name={s <= miCalificacion ? 'star' : 'star-outline'} size={30} color={s <= miCalificacion ? '#F59E0B' : colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.reviewInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
              placeholder="Escribe un comentario (opcional)"
              placeholderTextColor={colors.placeholder || colors.textMuted}
              multiline
              numberOfLines={2}
              maxLength={300}
              value={miComentario}
              onChangeText={setMiComentario}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.reviewBtn, { backgroundColor: miCalificacion ? colors.primary : colors.border }]}
              onPress={submitOpinion}
              disabled={enviandoOpinion || !miCalificacion}
              activeOpacity={0.8}
            >
              {enviandoOpinion
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Publicar reseña</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sección de reserva ──────────────────────────── */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hacer una reserva</Text>

          {/* Explicación del flujo */}
          <View style={[styles.flowBanner, { backgroundColor: colors.surfaceVariant, borderColor: colors.primary + '30' }]}>
            {[
              { icon: 'chatbubble-ellipses-outline', text: 'Tú escribes lo que quieres (ej: "quiero 8 pescados")' },
              { icon: 'scale-outline',               text: 'El productor pesa y confirma el precio exacto'        },
              { icon: 'time-outline',                text: 'Tienes 30 min para aceptar o cancelar'                },
              { icon: 'qr-code-outline',             text: 'Confirmas y pagas — pedido finalizado'                },
            ].map((step, i) => (
              <View key={i} style={styles.flowStep}>
                <View style={[styles.flowStepNum, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.flowStepNumText, { color: colors.primary }]}>{i + 1}</Text>
                </View>
                <Ionicons name={step.icon} size={16} color={colors.primary} style={{ marginHorizontal: 8 }} />
                <Text style={[styles.flowStepText, { color: colors.textSecondary }]}>{step.text}</Text>
              </View>
            ))}
          </View>

          {/* Cantidad + hora */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Cantidad (kg) *</Text>
              <TextInput
                style={[styles.mensajeBox, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text, padding: 10, fontSize: 14 }]}
                keyboardType="decimal-pad"
                value={cantidadReserva}
                onChangeText={setCantidadReserva}
                placeholder="1"
                placeholderTextColor={colors.placeholder}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Hora (opcional)</Text>
              <TextInput
                style={[styles.mensajeBox, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text, padding: 10, fontSize: 14 }]}
                value={horaReserva}
                onChangeText={setHoraReserva}
                placeholder="ej. 10:00"
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>

          {/* Calendario mensual */}
          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 4 }]}>Fecha de retiro * (toca un día verde)</Text>

          {/* Header mes con flechas */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <TouchableOpacity onPress={() => setCalCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
              style={{ padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
              <Ionicons name="chevron-back" size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, textTransform: 'capitalize' }}>
              {calCursor.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => setCalCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
              style={{ padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
              <Ionicons name="chevron-forward" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Cabecera L M X J V S D */}
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            {['L','M','X','J','V','S','D'].map((l, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>{l}</Text>
              </View>
            ))}
          </View>

          {/* Grid 6 semanas */}
          {calendarioLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
              {(() => {
                const desde = new Date(calCursor); desde.setDate(1);
                const dow0 = (desde.getDay() + 6) % 7;
                desde.setDate(desde.getDate() - dow0);
                const ymdStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                const hoyStr = ymdStr(new Date());
                const byFecha = new Map(calendario.map(d => [d.fecha, d]));
                const cells = [];
                for (let i = 0; i < 42; i++) {
                  const dt = new Date(desde); dt.setDate(desde.getDate() + i);
                  const fecha = ymdStr(dt);
                  const enMes = dt.getMonth() === calCursor.getMonth();
                  const dia = byFecha.get(fecha);
                  const disponible = dia?.disponible === true;
                  const esPasado = fecha < hoyStr;
                  const esHoy = fecha === hoyStr;
                  const sel = fechaReserva === fecha;
                  const clickable = disponible && !esPasado;
                  let bg = 'transparent', color = colors.textMuted, borderColor = colors.border, borderWidth = 1;
                  if (disponible && !esPasado) {
                    bg = sel ? 'rgba(34,197,94,0.32)' : 'rgba(34,197,94,0.14)';
                    color = '#22c55e';
                    borderColor = sel ? '#22c55e' : 'rgba(34,197,94,0.35)';
                    borderWidth = sel ? 2 : 1;
                  } else if (dia && !disponible) {
                    bg = 'rgba(239,68,68,0.10)';
                    color = '#ef4444';
                    borderColor = 'rgba(239,68,68,0.25)';
                  }
                  if (esHoy) { borderColor = colors.primary; borderWidth = 2; }
                  cells.push(
                    <TouchableOpacity
                      key={fecha}
                      disabled={!clickable}
                      onPress={() => clickable && setFechaReserva(fecha)}
                      style={{
                        width: `${100/7}%`,
                        aspectRatio: 1,
                        padding: 2,
                      }}>
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: 'rgba(34,197,94,0.4)' }} />
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Disponible</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: 'rgba(239,68,68,0.4)' }} />
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Bloqueado</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 9, height: 9, borderRadius: 2, borderWidth: 1, borderColor: colors.border }} />
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Inactivo</Text>
            </View>
          </View>

          {/* Fecha seleccionada feedback */}
          {fechaReserva && (
            <View style={{ padding: 10, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.10)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: '#22c55e', fontWeight: '600', textAlign: 'center', textTransform: 'capitalize' }}>
                ✓ {new Date(fechaReserva + 'T00:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
          )}

          {/* Notas */}
          <Text style={[styles.inputLabel, { color: colors.text }]}>Notas (opcional)</Text>
          <View style={[styles.mensajeBox, { borderColor: mensajeReserva ? colors.primary : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
            <TextInput
              style={[styles.mensajeInput, { color: colors.text }]}
              placeholder={'Ej: prefiero pescados medianos'}
              placeholderTextColor={colors.placeholder || colors.textMuted}
              multiline numberOfLines={2}
              maxLength={MAX_MENSAJE}
              value={mensajeReserva}
              onChangeText={setMensajeReserva}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Footer — botón Reservar */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {!disponible ? (
          <View style={styles.sinStockBtn}>
            <Ionicons name="close-circle-outline" size={20} color="#9CA3AF" />
            <Text style={styles.sinStockText}>Producto no disponible</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.reservarBtn, { backgroundColor: colors.primary }, reservando && { opacity: 0.7 }]}
            onPress={handleReservar}
            disabled={reservando}
          >
            {reservando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="bookmark-outline" size={22} color="#fff" />
                <Text style={styles.reservarText}>Enviar reserva</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  imageContainer:  { position: 'relative', height: 280 },
  productImage:    { height: 280, resizeMode: 'cover' },
  imagePlaceholder:{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  dotsRow:         { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot:             { height: 6, borderRadius: 3 },
  imgCounter:      { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  imgCounterText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  backButton: {
    position: 'absolute', top: 50, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },

  infoCard:      { margin: 16, borderRadius: 16, padding: 16, marginTop: -24 },
  headerRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  productName:   { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  categoryText:  { fontSize: 12, color: '#3B82F6', fontWeight: '500' },
  priceContainer:{ alignItems: 'flex-end' },
  priceLabel:    { fontSize: 12, color: '#6B7280' },
  price:         { fontSize: 28, fontWeight: 'bold', color: '#3B82F6' },
  priceUnit:     { fontSize: 12 },

  statsRow:   { flexDirection: 'row', borderRadius: 12, padding: 14, justifyContent: 'space-around', marginBottom: 12 },
  statItem:   { alignItems: 'center', gap: 4 },
  statValue:  { fontSize: 16, fontWeight: '700' },
  statLabel:  { fontSize: 11 },
  statDivider:{ width: 1, height: '100%' },
  stockDot:   { borderRadius: 20, padding: 2 },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  stockText:  { fontSize: 12, fontWeight: '600' },

  section:        { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16 },
  sectionTitle:   { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  description:    { fontSize: 14, lineHeight: 22 },
  productorCard:  { flexDirection: 'row', alignItems: 'center' },
  productorAvatar:{ width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  productorLabel: { fontSize: 12 },
  productorNombre:{ fontSize: 15, fontWeight: '600', marginTop: 2 },

  // Flujo de reserva
  flowBanner:   { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16, gap: 10 },
  flowStep:     { flexDirection: 'row', alignItems: 'center' },
  flowStepNum:  { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  flowStepNumText: { fontSize: 11, fontWeight: '700' },
  flowStepText: { fontSize: 12, flex: 1, lineHeight: 17 },

  inputLabel:   { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  mensajeBox:   { borderWidth: 1.5, borderRadius: 12, padding: 12, minHeight: 90 },
  mensajeInput: { fontSize: 15, lineHeight: 22, minHeight: 70 },
  charCount:    { fontSize: 11, textAlign: 'right', marginTop: 4 },

  footer:     { padding: 16, paddingBottom: 24, borderTopWidth: 1 },
  reservarBtn:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 10 },
  reservarText:{ color: '#fff', fontSize: 17, fontWeight: '700' },
  sinStockBtn:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 8, backgroundColor: '#F3F4F6' },
  sinStockText:{ fontSize: 16, color: '#9CA3AF', fontWeight: '600' },

  reviewItem:    { paddingVertical: 10, borderTopWidth: 1 },
  reviewAvatar:  { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  reviewFormBox: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 10 },
  reviewInput:   { borderWidth: 1.5, borderRadius: 10, padding: 10, fontSize: 13, minHeight: 55, marginBottom: 10 },
  reviewBtn:     { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
});

export default DetalleProductoScreen;
