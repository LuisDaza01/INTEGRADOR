// src/screens/consumer/CarritoScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, RefreshControl, Alert, ActivityIndicator, Dimensions, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import Constants from 'expo-constants';
import { useTheme } from '../../contexts/ThemeContext';

const BLURHASH = { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' };
import { useCarrito } from '../../contexts/CarritoContext';
import api from '../../api/axios.config';

// ✅ Solo cargar mapa en build nativo (no en Expo Go)
const isWeb = Platform.OS === 'web';
const isExpoGo = Constants.appOwnership === 'expo';
let MapView = null, Marker = null, PROVIDER_GOOGLE = null;
if (!isExpoGo && !isWeb) {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (e) {
    MapView = null;
  }
}

const { width } = Dimensions.get('window');

const PRECIO_KG            = 35;   // Bs/kg — sincronizado con backend
const PESO_PROMEDIO_ESTIMADO = 0.9; // kg promedio por pescado (800g–1kg)
const PESO_MIN_KG          = 0.8;  // mínimo por pedido (un pescado mínimo = 800g)


const CarritoScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { refresh: refreshCarrito, setCount } = useCarrito();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [paradaSeleccionada, setParadaSeleccionada] = useState(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [procesando, setProcesando] = useState(false);
  // modo de pedido por item: 'cantidad' (# pescados) | 'peso' (kg exactos)
  const [modos,   setModos]   = useState({});
  // peso en kg ingresado por el consumidor (solo cuando modo==='peso')
  const [pesosKg, setPesosKg] = useState({});
  // Reserva: fecha elegida + fechas disponibles del productor + reservas creadas
  const [fechaSel, setFechaSel]             = useState(null);
  const [fechasDisp, setFechasDisp]         = useState([]);
  const [cargandoFechas, setCargandoFechas] = useState(false);
  const [reservasCreadas, setReservasCreadas] = useState(null); // [{ codigo, productor, total }]

  useEffect(() => {
    fetchCarrito();
    fetchParadas();
  }, []);

  const fetchCarrito = async () => {
    try {
      setLoading(true);
      const response = await api.get('/carrito');
      const raw = response.data;
      const items = raw?.items ?? raw?.data?.items ?? raw?.data ?? [];
      const arr = Array.isArray(items) ? items : [];
      setCarrito(arr);
      setCount(arr.reduce((t, it) => t + (it.cantidad || 0), 0));
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      setCarrito([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchParadas = async () => {
    try {
      const res = await api.get('/paradas');
      const data = res.data.data || res.data || [];
      setParadas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar paradas:', error);
      setParadas([
        { id: 1, nombre: 'Parada Villa Tunari', descripcion: 'Parada principal del Chapare', lat: -16.677077, lng: -65.627742 },
        { id: 2, nombre: 'Terminal Cochabamba', descripcion: 'Terminal de buses Cochabamba', lat: -17.4005875, lng: -66.1478935 },
      ]);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCarrito();
    setRefreshing(false);
  }, []);

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await api.put(`/carrito/${id}`, { cantidad: newQuantity });
      setCarrito(prev => {
        const next = prev.map(item => item.id === id ? { ...item, cantidad: newQuantity } : item);
        setCount(next.reduce((t, it) => t + (it.cantidad || 0), 0));
        return next;
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la cantidad');
    }
  };

  const removeItem = (id) => {
    Alert.alert('Eliminar producto', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/carrito/${id}`);
            setCarrito(prev => {
              const next = prev.filter(item => item.id !== id);
              setCount(next.reduce((t, it) => t + (it.cantidad || 0), 0));
              return next;
            });
            setModos(prev   => { const n = { ...prev }; delete n[id]; return n; });
            setPesosKg(prev => { const n = { ...prev }; delete n[id]; return n; });
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el producto');
          }
        }
      },
    ]);
  };

  const safeCarrito = Array.isArray(carrito) ? carrito : [];

  const getModo = (id) => modos[id] || 'cantidad';

  // Precio por item según modo
  const precioItem = (item) => {
    const precioKg = parseFloat(item.precio) || PRECIO_KG;
    if (getModo(item.id) === 'peso') {
      const kg = parseFloat(pesosKg[item.id]) || 0;
      return kg * precioKg;
    }
    return precioKg * PESO_PROMEDIO_ESTIMADO * item.cantidad;
  };

  const subtotal = safeCarrito.reduce((sum, item) => sum + precioItem(item), 0);
  const envio    = subtotal > 100 ? 0 : 15;
  const total    = subtotal + envio;
  // ¿Hay algún item con precio a confirmar?
  const hayEstimado = safeCarrito.some(item => getModo(item.id) === 'cantidad');

  // Cargar fechas disponibles del productor (calendario público)
  const cargarFechas = async () => {
    const pids = [...new Set(safeCarrito.map(i => i.productor_id).filter(Boolean))];
    if (pids.length === 0) { setFechasDisp([]); return; }
    setCargandoFechas(true);
    try {
      const fmt = (d) => d.toISOString().slice(0, 10);
      const hoy = new Date();
      const hasta = new Date(); hasta.setDate(hasta.getDate() + 30);
      // Negocio mono-productor en la práctica: usamos el calendario del primer productor
      const res = await api.get(`/productores/${pids[0]}/calendario?desde=${fmt(hoy)}&hasta=${fmt(hasta)}`);
      const dias = (res.data?.data || res.data || []).filter(d => d.disponible);
      setFechasDisp(dias);
    } catch {
      setFechasDisp([]);
    } finally {
      setCargandoFechas(false);
    }
  };

  // Confirmar: crea una reserva por productor (sin pago — el precio se fija al pesar)
  const handleConfirmarReserva = async () => {
    if (!fechaSel) { setStep(2); return; }

    // Validar items por peso: mínimo 800g (= un pescado)
    for (const item of safeCarrito) {
      if (getModo(item.id) === 'peso') {
        const kg = parseFloat(pesosKg[item.id]) || 0;
        if (kg < PESO_MIN_KG) {
          Alert.alert('Peso mínimo', `El mínimo es 0.8 kg (un pescado).\nRevisa "${item.nombre}".`);
          setStep(1);
          return;
        }
      }
    }

    setProcesando(true);
    try {
      // Agrupar por productor → una reserva por productor
      const grupos = {};
      for (const item of safeCarrito) {
        const pid = item.productor_id;
        (grupos[pid] = grupos[pid] || []).push(item);
      }

      const creadas = [];
      for (const [pid, items] of Object.entries(grupos)) {
        const payload = {
          productor_id: Number(pid),
          fecha_reserva: fechaSel,
          items: items.map(it => {
            const modo = getModo(it.id);
            if (modo === 'peso') {
              return { producto_id: it.producto_id || it.id, modo: 'peso', peso_solicitado_kg: parseFloat(pesosKg[it.id]) || 0 };
            }
            return { producto_id: it.producto_id || it.id, modo: 'cantidad', cantidad: it.cantidad };
          }),
        };
        const res = await api.post('/reservas', payload);
        const r = res.data?.data || res.data;
        creadas.push({
          codigo: r.codigo,
          productor: items[0].productor_nombre || 'Productor',
          total: r.precio_estimado,
        });
      }

      // Vaciar carrito (best-effort, ítem por ítem)
      await Promise.allSettled(safeCarrito.map(it => api.delete(`/carrito/${it.id}`)));
      setCarrito([]); setCount(0);
      setReservasCreadas(creadas);
    } catch (e) {
      Alert.alert('No se pudo reservar', e?.response?.data?.message || 'Intenta de nuevo en un momento.');
    } finally {
      setProcesando(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      // Validar pesos antes de avanzar
      for (const item of safeCarrito) {
        if (getModo(item.id) === 'peso') {
          const kg = parseFloat(pesosKg[item.id]) || 0;
          if (kg < PESO_MIN_KG) {
            Alert.alert('Peso mínimo', `El mínimo es 0.8 kg (un pescado).\nRevisa "${item.nombre}".`);
            return;
          }
        }
      }
      cargarFechas();
      setStep(2);
    } else if (step === 2) {
      if (!fechaSel) {
        Alert.alert('Elige una fecha', 'Selecciona el día de tu reserva para continuar.');
        return;
      }
      setStep(3);
    } else {
      handleConfirmarReserva();
    }
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepContainer, { backgroundColor: colors.surface }]}>
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <View style={[styles.step, step >= s && { backgroundColor: colors.primary }]}>
            <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
          </View>
          {s < 3 && <View style={[styles.stepLine, step > s && { backgroundColor: colors.primary }]} />}
        </React.Fragment>
      ))}
      <View style={styles.stepLabels}>
        {['Reserva', 'Fecha', 'Confirmar'].map((label, i) => (
          <Text key={i} style={[styles.stepLabel, { color: step >= i + 1 ? colors.primary : colors.textMuted }]}>{label}</Text>
        ))}
      </View>
    </View>
  );

  // ── Selector de modo de pedido ────────────────────────────────
  const renderModoSelector = (item) => {
    const modo = getModo(item.id);
    const kgStr = pesosKg[item.id] || '';
    const kgNum = parseFloat(kgStr) || 0;
    const pesoValido = kgNum >= PESO_MIN_KG;
    const precioMostrado = pesoValido ? (kgNum * PRECIO_KG).toFixed(2) : null;

    return (
      <View style={[styles.modoContainer, { borderTopColor: colors.divider }]}>
        {/* Toggle modo */}
        <View style={[styles.modoToggle, { backgroundColor: colors.surfaceVariant }]}>
          <TouchableOpacity
            style={[styles.modoBtn, modo === 'cantidad' && { backgroundColor: colors.primary }]}
            onPress={() => setModos(prev => ({ ...prev, [item.id]: 'cantidad' }))}
          >
            <Ionicons name="fish-outline" size={14} color={modo === 'cantidad' ? colors.background : colors.textSecondary} />
            <Text style={[styles.modoBtnText, { color: modo === 'cantidad' ? colors.background : colors.textSecondary }]}>
              Por pescados
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modoBtn, modo === 'peso' && { backgroundColor: colors.secondary }]}
            onPress={() => setModos(prev => ({ ...prev, [item.id]: 'peso' }))}
          >
            <Ionicons name="scale-outline" size={14} color={modo === 'peso' ? colors.background : colors.textSecondary} />
            <Text style={[styles.modoBtnText, { color: modo === 'peso' ? colors.background : colors.textSecondary }]}>
              Por kilos
            </Text>
          </TouchableOpacity>
        </View>

        {modo === 'cantidad' ? (
          /* ── Modo: cantidad de pescados ── */
          <View style={styles.cantidadRow}>
            <View style={[styles.quantityControl, { backgroundColor: colors.surfaceVariant }]}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.cantidad - 1)}>
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.quantityText, { color: colors.text }]}>{item.cantidad} 🐟</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.cantidad + 1)}>
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.cantidadInfo}>
              <Text style={[styles.precioEst, { color: colors.textSecondary }]}>
                ~Bs. {(PRECIO_KG * PESO_PROMEDIO_ESTIMADO * item.cantidad).toFixed(2)} estimado
              </Text>
              <Text style={[styles.pendientePesaje, { color: colors.textMuted }]}>
                Cada pescado pesa ~1 kg · precio confirmado tras pesaje
              </Text>
            </View>
          </View>
        ) : (
          /* ── Modo: kilos exactos ── */
          <View style={styles.pesoRow}>
            <View style={[
              styles.pesoInputBox,
              { borderColor: kgStr && !pesoValido ? colors.error : colors.inputBorder, backgroundColor: colors.inputBackground }
            ]}>
              <Ionicons name="scale-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.pesoInput, { color: colors.text }]}
                placeholder="ej: 1.5"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
                value={kgStr}
                onChangeText={v => setPesosKg(prev => ({ ...prev, [item.id]: v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') }))}
              />
              <Text style={[styles.pesoUnit, { color: colors.textSecondary }]}>kg</Text>
            </View>
            <View style={styles.pesoInfo}>
              {kgStr === '' && (
                <Text style={[styles.pesoHint, { color: colors.textMuted }]}>Mínimo 0.8 kg</Text>
              )}
              {kgStr !== '' && !pesoValido && (
                <Text style={[styles.pesoError, { color: colors.error }]}>Mínimo 0.8 kg (1 pescado)</Text>
              )}
              {pesoValido && (
                <Text style={[styles.precioFijo, { color: colors.secondary }]}>
                  Bs. {precioMostrado}
                </Text>
              )}
              {pesoValido && (
                <Text style={[styles.pesoKgLabel, { color: colors.textMuted }]}>
                  {kgNum.toFixed(2)} kg × Bs. {PRECIO_KG}/kg
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };


  const renderCarrito = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Mi Reserva</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{safeCarrito.length} productos</Text>

      {/* Banner informativo del proceso de pesaje */}
      <View style={[styles.pesoInfoBanner, { backgroundColor: colors.infoBg, borderColor: colors.info + '40' }]}>
        <Ionicons name="scale-outline" size={20} color={colors.info} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.pesoInfoTitle, { color: colors.text }]}>Precio por pesaje</Text>
          <Text style={[styles.pesoInfoText, { color: colors.textSecondary }]}>
            Cada pescado pesa entre 800g y 1kg · Bs. {PRECIO_KG}/kg · Mínimo 0.8 kg por pedido
          </Text>
        </View>
      </View>

      {safeCarrito.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Ionicons name="bag-outline" size={60} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Tu reserva está vacía</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Añade productos para reservar</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('Productores')}>
            <Text style={styles.emptyButtonText}>Ver Productores</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {safeCarrito.map((item) => (
            <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.surface }]}>
              {/* Cabecera: imagen + nombre + precio ref + eliminar */}
              <View style={styles.cartItemTop}>
                <View style={[styles.cartItemImage, { backgroundColor: colors.surfaceVariant }]}>
                  {item.imagen_url
                    ? <ExpoImage source={{ uri: item.imagen_url }} style={styles.itemImg} contentFit="cover" transition={250} placeholder={BLURHASH} />
                    : <Ionicons name="fish-outline" size={30} color={colors.textMuted} />
                  }
                </View>
                <View style={styles.cartItemInfo}>
                  <Text style={[styles.cartItemName, { color: colors.text }]} numberOfLines={1}>{item.nombre}</Text>
                  <Text style={[styles.cartItemPrice, { color: colors.textSecondary }]}>
                    Bs. {PRECIO_KG}/kg
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
              {renderModoSelector(item)}
            </View>
          ))}
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal estimado</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>Bs {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Envío</Text>
              <Text style={[styles.summaryValue, { color: envio === 0 ? colors.success : colors.text }]}>
                {envio === 0 ? 'Gratis' : `Bs ${envio.toFixed(2)}`}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                {hayEstimado ? 'Total estimado' : 'Total'}
              </Text>
              <Text style={styles.totalValue}>Bs {total.toFixed(2)}</Text>
            </View>
            {hayEstimado && (
              <Text style={[styles.estimadoNote, { color: colors.textSecondary }]}>
                * Precio final confirmado tras el pesaje del productor
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );

  const fmtFechaCorta = (ymd) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const renderFecha = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>¿Para qué día?</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        Elige un día de venta del productor. Te recordaremos cuando se acerque.
      </Text>

      {cargandoFechas ? (
        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : fechasDisp.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin fechas disponibles</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Este productor no tiene días de venta próximos configurados.
          </Text>
        </View>
      ) : (
        <View style={styles.fechasGrid}>
          {fechasDisp.map((d) => {
            const sel = fechaSel === d.fecha;
            return (
              <TouchableOpacity
                key={d.fecha}
                style={[styles.fechaChip, { backgroundColor: sel ? colors.primary : colors.surface, borderColor: sel ? colors.primary : colors.border }]}
                onPress={() => setFechaSel(d.fecha)}
              >
                <Text style={[styles.fechaChipText, { color: sel ? '#fff' : colors.text }]}>{fmtFechaCorta(d.fecha)}</Text>
                {d.cupo_restante != null && (
                  <Text style={[styles.fechaCupo, { color: sel ? 'rgba(255,255,255,0.85)' : colors.textMuted }]}>{d.cupo_restante} cupos</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderConfirmar = () => {
    const fmtLargo = (ymd) => {
      if (!ymd) return '';
      const [y, m, d] = ymd.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' });
    };
    return (
      <View style={styles.stepContent}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Confirmar reserva</Text>

        {/* Fecha elegida */}
        <View style={[styles.paradaResumen, { backgroundColor: colors.primary + '12', borderColor: colors.primary }]}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>Reservas para:</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary, textTransform: 'capitalize' }}>{fmtLargo(fechaSel)}</Text>
          </View>
          <TouchableOpacity onPress={() => setStep(2)}>
            <Text style={{ fontSize: 12, color: colors.primary }}>Cambiar</Text>
          </TouchableOpacity>
        </View>

        {/* Aviso del flujo */}
        <View style={[styles.pesoInfoBanner, { backgroundColor: colors.infoBg, borderColor: colors.info + '40' }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.pesoInfoTitle, { color: colors.text }]}>Sin pago por ahora</Text>
            <Text style={[styles.pesoInfoText, { color: colors.textSecondary }]}>
              El día de la venta el productor pesa tu pedido y te avisa el precio final. Recién ahí pagas por QR.
            </Text>
          </View>
        </View>

        {/* Resumen estimado */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Resumen estimado</Text>
          {safeCarrito.map((it) => (
            <View key={it.id} style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {it.nombre} · {getModo(it.id) === 'peso' ? `${parseFloat(pesosKg[it.id]) || 0} kg` : `${it.cantidad} 🐟`}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>Bs {precioItem(it).toFixed(2)}</Text>
            </View>
          ))}
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total estimado</Text>
            <Text style={styles.totalValue}>Bs {subtotal.toFixed(2)}</Text>
          </View>
          <Text style={[styles.estimadoNote, { color: colors.textSecondary }]}>
            * Estimado con 0.9 kg por pescado. El precio final se calcula al pesar.
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Pantalla de éxito con el código de reserva
  if (reservasCreadas) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', padding: 24 }]}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6 }}>¡Reserva creada!</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
            Guarda tu código: identifica tu reserva y lo muestras al recoger.
          </Text>
          {reservasCreadas.map((r, i) => (
            <View key={i} style={{ width: '100%', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{r.productor}</Text>
              <Text style={{ fontSize: 30, fontWeight: '900', color: colors.primary, letterSpacing: 2, marginVertical: 4 }}>{r.codigo}</Text>
              {r.total != null && <Text style={{ fontSize: 13, color: colors.textSecondary }}>≈ Bs {Number(r.total).toFixed(2)} (estimado)</Text>}
            </View>
          ))}
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8, width: '100%', alignItems: 'center' }}
            onPress={() => { setReservasCreadas(null); setStep(1); setFechaSel(null); navigation.navigate('Reservas'); }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Ver mis reservas</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderStepIndicator()}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderCarrito()}
        {step === 2 && renderFecha()}
        {step === 3 && renderConfirmar()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {safeCarrito.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.footerTotal}>
            <Text style={[styles.footerTotalLabel, { color: colors.textSecondary }]}>Total estimado</Text>
            <Text style={styles.footerTotalValue}>Bs {total.toFixed(2)}</Text>
          </View>
          <View style={styles.footerButtons}>
            {step > 1 && (
              <TouchableOpacity style={[styles.backButton, { borderColor: colors.border }]} onPress={() => setStep(step - 1)}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextButton, procesando && styles.buttonDisabled]}
              onPress={handleNextStep}
              disabled={procesando}
            >
              {procesando ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {step === 1 ? 'Elegir Fecha' : step === 2 ? 'Continuar' : 'Confirmar Reserva'}
                  </Text>
                  <Ionicons name={step < 3 ? 'arrow-forward' : 'checkmark'} size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stepContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 40 },
  step: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  stepNumber: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  stepNumberActive: { color: '#FFF' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 8 },
  stepLabels: { position: 'absolute', bottom: -8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  stepLabel: { fontSize: 11, fontWeight: '500' },
  fechasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  fechaChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', minWidth: 96 },
  fechaChipText: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  fechaCupo: { fontSize: 10, marginTop: 2 },
  content: { flex: 1 },
  stepContent: { padding: 16 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, marginBottom: 16 },
  emptyState: { padding: 40, borderRadius: 12, alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8, marginBottom: 20 },
  emptyButton: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  cartItem: { borderRadius: 12, marginBottom: 12, padding: 12 },
  cartItemTop: { flexDirection: 'row', alignItems: 'center' },
  cartItemImage: { width: 60, height: 60, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemImg: { width: '100%', height: '100%', borderRadius: 10 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cartItemPrice: { fontSize: 14 },
  cartItemActions: { alignItems: 'flex-end', gap: 8 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 8 },
  quantityText: { fontSize: 14, fontWeight: '600', minWidth: 32, textAlign: 'center' },
  summaryCard: { borderRadius: 12, padding: 16, marginTop: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '500' },
  summaryDivider: { height: 1, marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#3B82F6' },
  mapContainer: { height: 250, borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  map: { flex: 1 },
  mapPlaceholder: { height: 160, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16, gap: 8 },
  mapPlaceholderText: { fontSize: 14 },
  paradaMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6B7280', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 4 },
  paradaMarkerSelected: { backgroundColor: '#3B82F6', transform: [{ scale: 1.2 }] },
  paradasTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  paradaCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 2, marginBottom: 10 },
  paradaIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  paradaNombre: { fontSize: 15, fontWeight: '600' },
  paradaDesc: { fontSize: 12, marginTop: 2 },
  paradaResumen: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  formCard: { borderRadius: 12, padding: 16 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 2, borderRadius: 12, marginBottom: 12, gap: 12 },
  paymentOptionText: { flex: 1, fontSize: 15, fontWeight: '500' },
  footer: { padding: 16, borderTopWidth: 1 },
  footerTotal: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  footerTotalLabel: { fontSize: 14 },
  footerTotalValue: { fontSize: 20, fontWeight: 'bold', color: '#3B82F6' },
  footerButtons: { flexDirection: 'row', gap: 12 },
  backButton: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  nextButton: { flex: 1, flexDirection: 'row', backgroundColor: '#3B82F6', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
  nextButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.7 },
  // Banner informativo de pesaje
  pesoInfoBanner:  { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  pesoInfoTitle:   { fontSize: 13, fontWeight: '600', marginBottom: 3 },
  pesoInfoText:    { fontSize: 12, lineHeight: 17 },
  // Nota de precio estimado
  estimadoNote:    { fontSize: 11, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  // Modo selector (cantidad / peso)
  modoContainer:   { borderTopWidth: 1, paddingTop: 12, marginTop: 10 },
  modoToggle:      { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', marginBottom: 12 },
  modoBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 6 },
  modoBtnText:     { fontSize: 13, fontWeight: '600' },
  cantidadRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cantidadInfo:    { flex: 1 },
  precioEst:       { fontSize: 13, fontWeight: '500' },
  pendientePesaje: { fontSize: 11, marginTop: 2 },
  pesoRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pesoInputBox:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, gap: 8, flex: 1 },
  pesoInput:       { flex: 1, fontSize: 16, fontWeight: '600' },
  pesoUnit:        { fontSize: 14, fontWeight: '500' },
  pesoInfo:        { flex: 1, justifyContent: 'center' },
  pesoHint:        { fontSize: 12 },
  pesoError:       { fontSize: 12, fontWeight: '500' },
  precioFijo:      { fontSize: 16, fontWeight: '700' },
  pesoKgLabel:     { fontSize: 11, marginTop: 2 },
  deleteBtn:       { padding: 6 },
});

export default CarritoScreen;