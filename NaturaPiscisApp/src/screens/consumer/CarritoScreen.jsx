// src/screens/consumer/CarritoScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, RefreshControl, Alert, ActivityIndicator, Dimensions, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../../contexts/ThemeContext';
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
      setCarrito(Array.isArray(items) ? items : []);
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
      setCarrito(prev => prev.map(item =>
        item.id === id ? { ...item, cantidad: newQuantity } : item
      ));
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
            setCarrito(prev => prev.filter(item => item.id !== id));
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
    if (getModo(item.id) === 'peso') {
      const kg = parseFloat(pesosKg[item.id]) || 0;
      return kg * PRECIO_KG;
    }
    return PRECIO_KG * PESO_PROMEDIO_ESTIMADO * item.cantidad;
  };

  const subtotal = safeCarrito.reduce((sum, item) => sum + precioItem(item), 0);
  const envio    = subtotal > 100 ? 0 : 15;
  const total    = subtotal + envio;
  // ¿Hay algún item con precio a confirmar?
  const hayEstimado = safeCarrito.some(item => getModo(item.id) === 'cantidad');

  const handleConfirmarPedido = async () => {
    if (!paradaSeleccionada) {
      Alert.alert('Error', 'Por favor selecciona una parada de entrega');
      setStep(2);
      return;
    }

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

    const metodoPagoIds = { efectivo: 4, qr: 7, transferencia: 8 };
    const metodoPagoId  = metodoPagoIds[metodoPago] || 4;

    const pedidoData = {
      items: safeCarrito.map(item => {
        const modo = getModo(item.id);
        return {
          producto_id:       item.producto_id || item.id,
          cantidad:          modo === 'peso'
                               ? parseFloat(pesosKg[item.id])  // kg exactos
                               : item.cantidad,                // # pescados
          tipo_pedido:       modo,      // 'cantidad' | 'peso'
          precio:            PRECIO_KG, // Bs/kg — referencia
        };
      }),
      metodo_pago_id: metodoPagoId,
      metodo_envio:   'parada',
      subtotal,
      costo_envio:    envio,
      total,
      notas: `Entrega en: ${paradaSeleccionada.nombre}`,
      parada_id:      paradaSeleccionada.id,
    };

    if (metodoPago === 'qr') {
      const primerItem = safeCarrito[0];
      navigation.navigate('PagoQR', {
        total,
        pedidoData,
        paradaSeleccionada,
        qrPagoUrl:       primerItem?.productor_qr_pago_url || null,
        productorNombre: primerItem?.productor_nombre || null,
      });
      return;
    }

    setProcesando(true);
    try {
      await api.post('/pedidos', pedidoData);
      Alert.alert(
        '¡Pedido confirmado! 🎉',
        `Tu pedido será entregado en:\n${paradaSeleccionada.nombre}`,
        [{ text: 'OK', onPress: () => { setCarrito([]); setStep(1); navigation.navigate('MisPedidos'); } }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar el pedido');
    } finally {
      setProcesando(false);
    }
  };

  const handleNextStep = () => {
    if (step === 2 && !paradaSeleccionada) {
      Alert.alert('Selecciona una parada', 'Debes elegir una parada de entrega para continuar.');
      return;
    }
    if (step < 3) setStep(step + 1);
    else handleConfirmarPedido();
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
        {['Carrito', 'Parada', 'Pago'].map((label, i) => (
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
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Mi Carrito</Text>
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
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Tu carrito está vacío</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Añade productos para comenzar</Text>
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
                    ? <Image source={{ uri: item.imagen_url }} style={styles.itemImg} />
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

  const renderSeleccionParada = () => {
    const initialRegion = paradas.length > 0 ? {
      latitude: (parseFloat(paradas[0].lat) + parseFloat(paradas[paradas.length - 1].lat)) / 2,
      longitude: (parseFloat(paradas[0].lng) + parseFloat(paradas[paradas.length - 1].lng)) / 2,
      latitudeDelta: 1.5,
      longitudeDelta: 1.5,
    } : { latitude: -17.0, longitude: -66.0, latitudeDelta: 2, longitudeDelta: 2 };

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Selecciona tu parada</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Elige la parada donde recibirás tu pedido
        </Text>

        {MapView !== null ? (
          <View style={styles.mapContainer}>
            <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={initialRegion}>
              {paradas.map((parada) => (
                <Marker
                  key={parada.id}
                  coordinate={{ latitude: parseFloat(parada.lat), longitude: parseFloat(parada.lng) }}
                  title={parada.nombre}
                  description={parada.descripcion}
                  onPress={() => setParadaSeleccionada(parada)}
                >
                  <View style={[styles.paradaMarker, paradaSeleccionada?.id === parada.id && styles.paradaMarkerSelected]}>
                    <Ionicons name="bus" size={18} color="#fff" />
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>
        ) : (
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="map-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.mapPlaceholderText, { color: colors.textSecondary }]}>
              Selecciona una parada de la lista
            </Text>
          </View>
        )}

        <Text style={[styles.paradasTitle, { color: colors.text }]}>Paradas disponibles</Text>
        {paradas.map((parada) => (
          <TouchableOpacity
            key={parada.id}
            style={[
              styles.paradaCard,
              { backgroundColor: colors.surface, borderColor: paradaSeleccionada?.id === parada.id ? colors.primary : colors.border },
              paradaSeleccionada?.id === parada.id && { backgroundColor: colors.primary + '10' }
            ]}
            onPress={() => setParadaSeleccionada(parada)}
          >
            <View style={[styles.paradaIcon, { backgroundColor: paradaSeleccionada?.id === parada.id ? colors.primary : colors.surfaceVariant }]}>
              <Ionicons name="bus" size={22} color={paradaSeleccionada?.id === parada.id ? '#fff' : colors.textSecondary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.paradaNombre, { color: colors.text }]}>{parada.nombre}</Text>
              {parada.descripcion && (
                <Text style={[styles.paradaDesc, { color: colors.textSecondary }]}>{parada.descripcion}</Text>
              )}
            </View>
            {paradaSeleccionada?.id === parada.id && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPago = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Método de Pago</Text>

      {paradaSeleccionada && (
        <View style={[styles.paradaResumen, { backgroundColor: '#EFF6FF', borderColor: colors.primary }]}>
          <Ionicons name="bus" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>Entrega en parada:</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary }}>{paradaSeleccionada.nombre}</Text>
          </View>
          <TouchableOpacity onPress={() => setStep(2)}>
            <Text style={{ fontSize: 12, color: colors.primary }}>Cambiar</Text>
          </TouchableOpacity>
        </View>
      )}


      <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
        {['efectivo', 'transferencia', 'qr'].map((metodo) => (
          <TouchableOpacity
            key={metodo}
            style={[
              styles.paymentOption,
              { borderColor: metodoPago === metodo ? colors.primary : colors.border },
              metodoPago === metodo && { backgroundColor: '#EFF6FF' }
            ]}
            onPress={() => setMetodoPago(metodo)}
          >
            <Ionicons
              name={metodo === 'efectivo' ? 'cash-outline' : metodo === 'transferencia' ? 'card-outline' : 'qr-code-outline'}
              size={24}
              color={metodoPago === metodo ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.paymentOptionText, { color: metodoPago === metodo ? colors.primary : colors.text }]}>
              {metodo === 'efectivo' ? 'Efectivo' : metodo === 'transferencia' ? 'Transferencia' : 'QR BCP'}
            </Text>
            {metodoPago === metodo && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Resumen del Pedido</Text>
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
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        {step === 2 && renderSeleccionParada()}
        {step === 3 && renderPago()}
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
                    {step === 1 ? 'Elegir Parada' : step === 2 ? 'Continuar al Pago' : 'Confirmar Pedido'}
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