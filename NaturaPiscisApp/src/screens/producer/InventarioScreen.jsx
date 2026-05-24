import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth }  from '../../contexts/AuthContext';
import api from '../../api/axios.config';

const TAB_LAGUNAS     = 'lagunas';
const TAB_ALIMENTO    = 'alimento';
const TAB_PRODUCTOS   = 'productos';
const TAB_MOVIMIENTOS = 'movimientos';

const ESTADO_COLOR = { normal: '#22c55e', bajo: '#f59e0b', critico: '#ef4444' };

function estadoLaguna(pct) {
  if (pct > 30) return 'normal';
  if (pct > 10) return 'bajo';
  return 'critico';
}

export default function InventarioScreen() {
  const { colors: C } = useTheme();
  const { user }      = useAuth();
  const S = styles(C);

  // ── Estado principal ───────────────────────────────────────────
  const [tab,          setTab]          = useState(TAB_LAGUNAS);
  const [lagunas,      setLagunas]      = useState([]);
  const [stockAlimento,setStockAlimento]= useState([]);
  const [especies,     setEspecies]     = useState([]);
  const [productos,    setProductos]    = useState([]);
  const [movimientos,  setMovimientos]  = useState([]);
  const [filtroMov,    setFiltroMov]    = useState('');
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  // Quick action modals (productos)
  const [precioFor,  setPrecioFor]  = useState(null);
  const [ventaFor,   setVentaFor]   = useState(null);
  const [precioVal,  setPrecioVal]  = useState('');
  const [ventaCant,  setVentaCant]  = useState('');
  const [ventaDesc,  setVentaDesc]  = useState('');
  const [savingQuick,setSavingQuick]= useState(false);

  // CRUD de productos
  const [categorias,      setCategorias]      = useState([]);
  const [productoModal,   setProductoModal]   = useState(false);
  const [editandoProd,    setEditandoProd]    = useState(null); // producto o null
  const [productoForm,    setProductoForm]    = useState({ nombre: '', descripcion: '', precio: '', stock: '', categoria_id: '' });
  const [iaGenerando,     setIaGenerando]     = useState(false);

  // Genera descripción del producto con IA (Claude). Reusa nombre + categoría seleccionada.
  const generarDescripcionIA = async () => {
    if (!productoForm.nombre.trim()) { Alert.alert('Escribe primero el nombre del producto'); return; }
    setIaGenerando(true);
    try {
      const catNombre = categorias.find(c => String(c.id) === String(productoForm.categoria_id))?.nombre || '';
      const res = await api.post('/productos/generar-descripcion', {
        nombre:    productoForm.nombre.trim(),
        categoria: catNombre,
      });
      const desc = res.data?.data?.descripcion || res.data?.descripcion;
      if (desc) setProductoForm(f => ({ ...f, descripcion: desc }));
      else Alert.alert('Sin respuesta', 'La IA no devolvió texto. Intenta de nuevo.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo generar la descripción.');
    } finally { setIaGenerando(false); }
  };
  const [imagenesProd,    setImagenesProd]    = useState([]);   // [{ id, url?, uri?, nuevo }]
  const [savingProducto,  setSavingProducto]  = useState(false);
  const [togglingId,      setTogglingId]      = useState(null);

  // ── Modal state ────────────────────────────────────────────────
  const [modal,        setModal]        = useState(null);
  const [lagunaActiva, setLagunaActiva] = useState(null);
  const [detalle,      setDetalle]      = useState(null);
  const [historial,    setHistorial]    = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [saving,       setSaving]       = useState(false);

  // Campos formularios
  const [formLaguna,   setFormLaguna]   = useState({ nombre: '', capacidad_maxima: '', descripcion: '' });
  const [formSiembra,  setFormSiembra]  = useState({ especie_id: '', cantidad_inicial: '', peso_inicial_g: '20', peso_objetivo_g: '800', duracion_dias: '210', precio_alevines_bs: '', precio_venta_kg_bs: '35' });
  const [formMov,      setFormMov]      = useState({ tipo: 'alimentacion', cantidad: '', descripcion: '' });
  const [formCompra,   setFormCompra]   = useState({ tipo_alimento_id: '', sacos: '', costo_por_saco: '135' });
  const [formEspecie,  setFormEspecie]  = useState({ nombre: '', peso_inicial_g: '20', peso_objetivo_g: '800', duracion_ciclo_dias: '210' });

  // ── Carga de datos ─────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    try {
      const [resLagunas, resStock, resEspecies, resProductos, resCategorias] = await Promise.all([
        api.get('/lagunas'),
        api.get('/lagunas/alimento/stock'),
        api.get('/lagunas/especies'),
        api.get('/inventario/stock'),
        api.get('/categorias').catch(() => ({ data: { data: [] } })),
      ]);
      setLagunas(resLagunas.data?.data || []);
      setStockAlimento(resStock.data?.data || []);
      setEspecies(resEspecies.data?.data || []);
      setProductos(resProductos.data?.data || []);
      setCategorias(resCategorias.data?.data || resCategorias.data || []);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const cargarMovimientos = useCallback(async () => {
    try {
      const r = await api.get('/inventario/historial', {
        params: filtroMov ? { tipo: filtroMov, limit: 100 } : { limit: 100 },
      });
      setMovimientos(r.data?.data || []);
    } catch (e) {
      // silencioso, solo limpiar
      setMovimientos([]);
    }
  }, [filtroMov]);

  useEffect(() => {
    if (tab === TAB_MOVIMIENTOS) cargarMovimientos();
  }, [tab, cargarMovimientos]);

  // Quick: actualizar precio
  const guardarPrecio = async () => {
    const v = parseFloat(precioVal);
    if (!Number.isFinite(v) || v <= 0) { Alert.alert('Precio inválido'); return; }
    setSavingQuick(true);
    try {
      await api.patch(`/productos/${precioFor.id}/precio`, { precio: v });
      Alert.alert('Precio actualizado', `${precioFor.nombre}: Bs ${v.toFixed(2)}/kg`);
      setPrecioFor(null); setPrecioVal('');
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo actualizar');
    } finally { setSavingQuick(false); }
  };

  // Quick: registrar venta presencial
  const guardarVenta = async () => {
    const c = parseFloat(ventaCant);
    if (!Number.isFinite(c) || c <= 0) { Alert.alert('Cantidad inválida'); return; }
    if (c > (ventaFor.stock || 0)) {
      Alert.alert('Stock insuficiente', `Disponible: ${ventaFor.stock || 0}`);
      return;
    }
    setSavingQuick(true);
    try {
      await api.post('/inventario/movimientos', {
        producto_id: ventaFor.id,
        tipo: 'venta_offline',
        cantidad: c,
        descripcion: ventaDesc || undefined,
      });
      Alert.alert('Venta registrada', `${c} ${ventaFor.unidad || 'unid'} de ${ventaFor.nombre}`);
      setVentaFor(null); setVentaCant(''); setVentaDesc('');
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo registrar');
    } finally { setSavingQuick(false); }
  };

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const onRefresh = () => { setRefreshing(true); cargarDatos(); };

  // ── CRUD de productos ──────────────────────────────────────────
  const galeriaDe = (p) => {
    let arr = [];
    if (Array.isArray(p?.imagenes)) arr = p.imagenes.filter(Boolean);
    else if (typeof p?.imagenes === 'string') { try { arr = JSON.parse(p.imagenes).filter(Boolean); } catch { arr = []; } }
    if (arr.length === 0 && (p?.imagen || p?.foto_principal)) arr = [p.imagen || p.foto_principal];
    return arr;
  };

  const abrirCrearProducto = () => {
    setEditandoProd(null);
    setProductoForm({ nombre: '', descripcion: '', precio: '', stock: '', categoria_id: String(categorias[0]?.id ?? '') });
    setImagenesProd([]);
    setProductoModal(true);
  };
  const abrirEditarProducto = (p) => {
    setEditandoProd(p);
    setProductoForm({
      nombre: p.nombre || '', descripcion: p.descripcion || '',
      precio: String(p.precio ?? ''), stock: String(p.stock ?? ''),
      categoria_id: String(p.categoria_id ?? ''),
    });
    setImagenesProd(galeriaDe(p).map((url, i) => ({ id: `e${i}`, url, nuevo: false })));
    setProductoModal(true);
  };

  const elegirImagenes = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir fotos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6 - imagenesProd.length,
      quality: 0.7,
    });
    if (res.canceled) return;
    const nuevas = (res.assets || []).map((a, i) => ({
      id: `n${Date.now()}_${i}`,
      uri: a.uri,
      mime: a.mimeType || 'image/jpeg',
      nuevo: true,
    }));
    setImagenesProd(prev => [...prev, ...nuevas].slice(0, 6));
  };
  const quitarImagenProd = (id) => setImagenesProd(prev => prev.filter(x => x.id !== id));
  const moverImagenProd = (id, dir) => {
    setImagenesProd(prev => {
      const idx = prev.findIndex(x => x.id === id);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const guardarProducto = async () => {
    if (!productoForm.nombre.trim()) { Alert.alert('Falta el nombre'); return; }
    if (!productoForm.categoria_id)  { Alert.alert('Selecciona una categoría'); return; }
    const precio = parseFloat(productoForm.precio);
    const stock  = parseInt(productoForm.stock, 10);
    if (!Number.isFinite(precio) || precio <= 0) { Alert.alert('Precio inválido'); return; }
    if (!Number.isFinite(stock)  || stock < 0)   { Alert.alert('Stock inválido'); return; }

    setSavingProducto(true);
    try {
      const fd = new FormData();
      fd.append('nombre', productoForm.nombre.trim());
      fd.append('descripcion', productoForm.descripcion.trim());
      fd.append('precio', String(precio));
      fd.append('stock', String(stock));
      fd.append('categoria_id', String(productoForm.categoria_id));
      // URLs existentes conservadas (en su orden)
      const existentes = imagenesProd.filter(x => !x.nuevo && x.url).map(x => x.url);
      fd.append('imagenes_existentes', JSON.stringify(existentes));
      // Archivos nuevos
      imagenesProd.filter(x => x.nuevo).forEach((x, i) => {
        const ext = (x.mime.split('/')[1] || 'jpg');
        fd.append('imagenes', { uri: x.uri, type: x.mime, name: `foto_${i}.${ext}` });
      });

      if (editandoProd) {
        await api.put(`/productos/${editandoProd.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/productos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      Alert.alert('Listo', editandoProd ? 'Producto actualizado' : 'Producto creado');
      setProductoModal(false);
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar el producto');
    } finally { setSavingProducto(false); }
  };

  const eliminarProducto = (p) => {
    Alert.alert('Eliminar producto', `¿Seguro que quieres eliminar "${p.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await api.delete(`/productos/${p.id}`); cargarDatos(); }
        catch (e) { Alert.alert('Error', e.response?.data?.message || 'No se pudo eliminar'); }
      }},
    ]);
  };

  const toggleDisponibleProducto = async (p) => {
    setTogglingId(p.id);
    try {
      await api.patch(`/productos/${p.id}/disponibilidad`, { disponible: !p.disponible });
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo cambiar');
    } finally { setTogglingId(null); }
  };

  const cargarDetalle = async (lagunaId) => {
    setLoadingDetalle(true);
    setHistorial([]);
    try {
      const [resDet, resHist] = await Promise.all([
        api.get(`/lagunas/${lagunaId}`),
        api.get(`/lagunas/${lagunaId}/historial`),
      ]);
      setDetalle(resDet.data?.data || null);
      setHistorial(resHist.data?.data || []);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el detalle');
    } finally {
      setLoadingDetalle(false);
    }
  };

  // ── Acciones ───────────────────────────────────────────────────
  const abrirModal = (tipo, laguna = null) => {
    setLagunaActiva(laguna);
    if (tipo === 'detalle' && laguna) cargarDetalle(laguna.id);
    setModal(tipo);
  };

  const cerrarModal = () => {
    setModal(null);
    setLagunaActiva(null);
    setDetalle(null);
    setHistorial([]);
    setFormLaguna({ nombre: '', capacidad_maxima: '', descripcion: '' });
    setFormSiembra({ especie_id: '', cantidad_inicial: '', peso_inicial_g: '20', peso_objetivo_g: '800', duracion_dias: '210', precio_alevines_bs: '', precio_venta_kg_bs: '35' });
    setFormMov({ tipo: 'alimentacion', cantidad: '', descripcion: '' });
    setFormCompra({ tipo_alimento_id: '', sacos: '', costo_por_saco: '135' });
    setFormEspecie({ nombre: '', peso_inicial_g: '20', peso_objetivo_g: '800', duracion_ciclo_dias: '210' });
  };

  const guardarLaguna = async () => {
    if (!formLaguna.nombre.trim()) return Alert.alert('Error', 'Ingresa un nombre para la laguna');
    setSaving(true);
    try {
      await api.post('/lagunas', { ...formLaguna, capacidad_maxima: parseInt(formLaguna.capacidad_maxima) || null });
      cerrarModal();
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo crear la laguna');
    } finally { setSaving(false); }
  };

  const guardarSiembra = async () => {
    if (!formSiembra.especie_id) return Alert.alert('Error', 'Selecciona una especie');
    if (!formSiembra.cantidad_inicial) return Alert.alert('Error', 'Ingresa la cantidad de alevines');
    setSaving(true);
    try {
      await api.post(`/lagunas/${lagunaActiva.id}/siembras`, {
        especie_id:       parseInt(formSiembra.especie_id),
        cantidad_inicial: parseInt(formSiembra.cantidad_inicial),
        peso_inicial_g:   parseFloat(formSiembra.peso_inicial_g),
        peso_objetivo_g:  parseFloat(formSiembra.peso_objetivo_g),
        duracion_dias:    parseInt(formSiembra.duracion_dias),
        precio_alevines_bs:  parseFloat(formSiembra.precio_alevines_bs) || 0,
        precio_venta_kg_bs:  parseFloat(formSiembra.precio_venta_kg_bs) || 35,
        fecha_siembra:    new Date().toISOString().split('T')[0],
      });
      cerrarModal();
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo iniciar la siembra');
    } finally { setSaving(false); }
  };

  const guardarMovimiento = async () => {
    if (!formMov.cantidad && formMov.tipo !== 'alimentacion')
      return Alert.alert('Error', 'Ingresa la cantidad');
    setSaving(true);
    try {
      await api.post(`/lagunas/${lagunaActiva.id}/movimientos`, {
        tipo:        formMov.tipo,
        cantidad:    parseFloat(formMov.cantidad) || 0,
        descripcion: formMov.descripcion,
      });
      cerrarModal();
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo registrar');
    } finally { setSaving(false); }
  };

  const guardarCompra = async () => {
    if (!formCompra.tipo_alimento_id) return Alert.alert('Error', 'Selecciona el tipo de alimento');
    if (!formCompra.sacos || parseInt(formCompra.sacos) < 1) return Alert.alert('Error', 'Ingresa la cantidad de sacos');
    setSaving(true);
    try {
      await api.post('/lagunas/alimento/compra', {
        tipo_alimento_id: parseInt(formCompra.tipo_alimento_id),
        sacos:            parseInt(formCompra.sacos),
        costo_por_saco:   parseFloat(formCompra.costo_por_saco) || 135,
      });
      cerrarModal();
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo registrar la compra');
    } finally { setSaving(false); }
  };

  const guardarEspecie = async () => {
    if (!formEspecie.nombre.trim()) return Alert.alert('Error', 'Ingresa un nombre');
    setSaving(true);
    try {
      await api.post('/lagunas/especies', {
        nombre:             formEspecie.nombre,
        peso_inicial_g:     parseFloat(formEspecie.peso_inicial_g),
        peso_objetivo_g:    parseFloat(formEspecie.peso_objetivo_g),
        duracion_ciclo_dias:parseInt(formEspecie.duracion_ciclo_dias),
      });
      cerrarModal();
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo crear la especie');
    } finally { setSaving(false); }
  };

  const confirmarCosecha = (laguna) => {
    Alert.prompt(
      'Cosechar Laguna',
      `¿Cuántos kg cosechas de ${laguna.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cosechar',
          onPress: async (kg) => {
            if (!kg || isNaN(parseFloat(kg))) return Alert.alert('Error', 'Ingresa los kg cosechados');
            try {
              await api.post(`/lagunas/${laguna.id}/cosechar`, { kg_cosechados: parseFloat(kg) });
              cargarDatos();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'No se pudo registrar la cosecha');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // ── Helpers visuales ───────────────────────────────────────────
  const fmtNum  = (n) => (n || 0).toLocaleString('es-BO');
  const fmtKg   = (n) => `${(n || 0).toFixed(1)} kg`;
  const fmtBs   = (n) => `${fmtNum(Math.round(n || 0))} Bs`;

  // ── RENDER LAGUNA CARD ─────────────────────────────────────────
  const renderLagunaCard = (laguna) => {
    const p = laguna.produccion;
    const pctPeces = p && laguna.capacidad_maxima
      ? Math.round((p.peces_actuales / laguna.capacidad_maxima) * 100)
      : null;
    const estadoColor = pctPeces !== null ? ESTADO_COLOR[estadoLaguna(pctPeces)] : C.textSecondary;

    return (
      <TouchableOpacity key={laguna.id} style={S.card} onPress={() => abrirModal('detalle', laguna)}>
        {/* Cabecera */}
        <View style={S.cardHeader}>
          <View style={S.cardTitleRow}>
            <Ionicons name="water" size={18} color={C.primary} />
            <Text style={S.cardTitle}>{laguna.nombre}</Text>
          </View>
          {p ? (
            <View style={[S.estadoBadge, { backgroundColor: estadoColor + '22' }]}>
              <View style={[S.estadoDot, { backgroundColor: estadoColor }]} />
              <Text style={[S.estadoText, { color: estadoColor }]}>
                {p.peces_actuales} peces
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={S.btnSiembra} onPress={() => abrirModal('siembra', laguna)}>
              <Text style={S.btnSiembraText}>+ Siembra</Text>
            </TouchableOpacity>
          )}
        </View>

        {p ? (
          <>
            {/* Progreso del ciclo */}
            <View style={S.progresoRow}>
              <Text style={S.progresoLabel}>
                Día {p.dias} de {laguna.duracion_dias} · {p.especie_nombre}
              </Text>
              <Text style={S.progresoPct}>{p.progresoPct}%</Text>
            </View>
            <View style={S.barBg}>
              <View style={[S.barFill, { width: `${p.progresoPct}%`, backgroundColor: C.primary }]} />
            </View>

            {/* Info rápida */}
            <View style={S.infoRow}>
              <View style={S.infoItem}>
                <Ionicons name="scale-outline" size={14} color={C.textSecondary} />
                <Text style={S.infoText}>{p.pesoActualG}g/pez</Text>
              </View>
              <View style={S.infoItem}>
                <Ionicons name="layers-outline" size={14} color={C.textSecondary} />
                <Text style={S.infoText}>{fmtKg(p.biomasaKg)}</Text>
              </View>
              <View style={S.infoItem}>
                <Ionicons name="time-outline" size={14} color={C.textSecondary} />
                <Text style={S.infoText}>{p.diasRestantes}d restantes</Text>
              </View>
            </View>

            {/* Alimentación de hoy */}
            <View style={S.alimentacionBox}>
              <Ionicons name="restaurant-outline" size={14} color={C.primary} />
              <Text style={S.alimentacionText}>
                Hoy: {fmtKg(p.alimentacion.totalDiaKg)} · {p.alimentacion.tipo.nombre}
              </Text>
              <Text style={S.alimentacionSub}>
                {fmtKg(p.alimentacion.porSesionKg)} × {p.alimentacion.tipo.frecuenciaDia} veces
              </Text>
            </View>

            {/* Acciones rápidas */}
            <View style={S.accionesRow}>
              <TouchableOpacity style={S.accionBtn} onPress={() => abrirModal('movimiento', laguna)}>
                <Ionicons name="add-circle-outline" size={16} color={C.primary} />
                <Text style={[S.accionText, { color: C.primary }]}>Registrar</Text>
              </TouchableOpacity>
              {p.diasRestantes === 0 && (
                <TouchableOpacity style={[S.accionBtn, { backgroundColor: '#f59e0b22' }]} onPress={() => confirmarCosecha(laguna)}>
                  <Ionicons name="basket-outline" size={16} color="#f59e0b" />
                  <Text style={[S.accionText, { color: '#f59e0b' }]}>Cosechar</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <Text style={S.sinSiembra}>Sin siembra activa</Text>
        )}
      </TouchableOpacity>
    );
  };

  // ── RENDER STOCK ALIMENTO ──────────────────────────────────────
  const renderStockItem = (item) => {
    const sacos    = item.sacos_disponibles || 0;
    const kgTotal  = sacos * (item.peso_saco_kg || 25);
    const colorFase = item.fase === 'inicial' ? '#3b82f6'
      : item.fase === 'crecimiento' ? '#10b981' : '#f59e0b';

    return (
      <View key={item.id || item.codigo} style={S.stockCard}>
        <View style={[S.stockFaseBadge, { backgroundColor: colorFase + '22' }]}>
          <Text style={[S.stockFaseText, { color: colorFase }]}>{item.fase || '—'}</Text>
        </View>
        <Text style={S.stockNombre}>{item.nombre}</Text>
        <View style={S.stockRow}>
          <View style={S.stockInfo}>
            <Text style={S.stockSacos}>{sacos}</Text>
            <Text style={S.stockLabel}>sacos</Text>
          </View>
          <View style={S.stockInfo}>
            <Text style={S.stockSacos}>{kgTotal}</Text>
            <Text style={S.stockLabel}>kg total</Text>
          </View>
          <View style={S.stockInfo}>
            <Text style={S.stockSacos}>{item.costo_por_saco_bs || 135}</Text>
            <Text style={S.stockLabel}>Bs/saco</Text>
          </View>
        </View>
        {sacos === 0 && (
          <View style={S.sinStockBadge}>
            <Text style={S.sinStockText}>Sin stock</Text>
          </View>
        )}
      </View>
    );
  };

  // ── MODAL: DETALLE LAGUNA ──────────────────────────────────────
  const renderDetalleContent = () => {
    if (loadingDetalle) return <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />;
    if (!detalle) return null;
    const fin = detalle.financiero;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {detalle.produccion && fin && (
          <>
            <Text style={S.detalleSeccion}>Financiero</Text>
            <View style={S.finRow}>
              <View style={S.finItem}>
                <Text style={S.finLabel}>Invertido hoy</Text>
                <Text style={[S.finValor, { color: '#ef4444' }]}>{fmtBs(fin.invertidoHoy)}</Text>
              </View>
              <View style={S.finItem}>
                <Text style={S.finLabel}>Ingresos reales</Text>
                <Text style={[S.finValor, { color: '#22c55e' }]}>{fmtBs(fin.totalIngresos)}</Text>
              </View>
            </View>
            <View style={S.finRow}>
              <View style={S.finItem}>
                <Text style={S.finLabel}>Ingreso proyectado</Text>
                <Text style={[S.finValor, { color: C.primary }]}>{fmtBs(fin.ingresoProyectado)}</Text>
              </View>
              <View style={S.finItem}>
                <Text style={S.finLabel}>Ganancia estimada</Text>
                <Text style={[S.finValor, { color: fin.gananciaProyectada >= 0 ? '#22c55e' : '#ef4444' }]}>
                  {fmtBs(fin.gananciaProyectada)}
                </Text>
              </View>
            </View>
          </>
        )}

        {detalle.planAlimento?.length > 0 && (
          <>
            <Text style={S.detalleSeccion}>Plan de alimento</Text>
            {detalle.planAlimento.map((fase, i) => (
              <View key={i} style={S.planRow}>
                <View style={{ flex: 1 }}>
                  <Text style={S.planNombre}>{fase.tipo.nombre}</Text>
                  <Text style={S.planDias}>Días {fase.diaInicio}–{fase.diaFin} ({fase.dias} días)</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={S.planSacos}>{fase.sacos} sacos</Text>
                  <Text style={S.planCosto}>{fmtBs(fase.costo)}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {detalle.movimientos?.length > 0 && (
          <>
            <Text style={S.detalleSeccion}>Últimos movimientos</Text>
            {detalle.movimientos.slice(0, 10).map((mov, i) => (
              <View key={i} style={S.movRow}>
                <View style={[S.movIconBox, { backgroundColor: mov.tipo === 'venta' ? '#22c55e22' : mov.tipo === 'mortalidad' ? '#ef444422' : C.primary + '22' }]}>
                  <Ionicons
                    name={mov.tipo === 'alimentacion' ? 'restaurant-outline' : mov.tipo === 'mortalidad' ? 'skull-outline' : mov.tipo === 'venta' ? 'cash-outline' : 'construct-outline'}
                    size={14}
                    color={mov.tipo === 'venta' ? '#22c55e' : mov.tipo === 'mortalidad' ? '#ef4444' : C.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.movTipo}>{mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}</Text>
                  <Text style={S.movDesc}>{mov.descripcion || mov.tipo_alimento_nombre || ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={S.movCantidad}>{mov.cantidad} {mov.unidad}</Text>
                  {(mov.costo_bs > 0 || mov.ingreso_bs > 0) && (
                    <Text style={{ fontSize: 11, color: mov.ingreso_bs > 0 ? '#22c55e' : '#ef4444' }}>
                      {mov.ingreso_bs > 0 ? '+' : '-'}{fmtBs(mov.ingreso_bs || mov.costo_bs)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {historial.filter(h => h.estado !== 'activa').length > 0 && (
          <>
            <Text style={S.detalleSeccion}>Historial de ciclos</Text>
            {historial.filter(h => h.estado !== 'activa').map((h, i) => (
              <View key={i} style={[S.movRow, { alignItems: 'flex-start', paddingVertical: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={S.movTipo}>{h.especie_nombre || 'Tambaqui'}</Text>
                  <Text style={S.movDesc}>
                    {new Date(h.fecha_siembra).toLocaleDateString('es-BO')} · {h.cantidad_inicial} alevines
                  </Text>
                </View>
                <View style={{ backgroundColor: h.estado === 'cosechada' ? '#22c55e22' : '#ef444422', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: h.estado === 'cosechada' ? '#22c55e' : '#ef4444' }}>
                    {h.estado}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    );
  };

  // ── RENDER PRINCIPAL ───────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[S.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <Text style={S.titulo}>Inventario</Text>
        <TouchableOpacity style={S.btnAdd} onPress={() => {
          if (tab === TAB_PRODUCTOS) return abrirCrearProducto();
          if (tab === TAB_LAGUNAS)   return abrirModal('nueva_laguna');
          if (tab === TAB_ALIMENTO)  return abrirModal('compra');
          abrirModal('nueva_laguna');
        }}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[S.tabs, { flexWrap: 'wrap' }]}>
        {[
          { key: TAB_LAGUNAS,     label: 'Lagunas',     icon: 'water-outline' },
          { key: TAB_ALIMENTO,    label: 'Alimento',    icon: 'restaurant-outline' },
          { key: TAB_PRODUCTOS,   label: 'Productos',   icon: 'cube-outline' },
          { key: TAB_MOVIMIENTOS, label: 'Movs.',       icon: 'swap-vertical-outline' },
        ].map(t => (
          <TouchableOpacity key={t.key} style={[S.tab, tab === t.key && S.tabActivo]} onPress={() => setTab(t.key)}>
            <Ionicons name={t.icon} size={16} color={tab === t.key ? C.primary : C.textSecondary} />
            <Text style={[S.tabText, tab === t.key && { color: C.primary }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido */}
      <ScrollView
        contentContainerStyle={S.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
      >
        {tab === TAB_LAGUNAS && (
          <>
            {lagunas.length === 0 ? (
              <View style={S.empty}>
                <Ionicons name="water-outline" size={48} color={C.textSecondary} />
                <Text style={S.emptyText}>No tienes lagunas registradas</Text>
                <TouchableOpacity style={[S.btnAdd, { marginTop: 16, paddingHorizontal: 20 }]} onPress={() => abrirModal('nueva_laguna')}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Crear primera laguna</Text>
                </TouchableOpacity>
              </View>
            ) : (
              lagunas.map(renderLagunaCard)
            )}
          </>
        )}

        {tab === TAB_ALIMENTO && (
          <>
            <TouchableOpacity style={S.btnEspecie} onPress={() => abrirModal('especie')}>
              <Ionicons name="fish-outline" size={16} color={C.primary} />
              <Text style={[S.btnEspecieText, { color: C.primary }]}>Agregar nueva especie</Text>
            </TouchableOpacity>
            {stockAlimento.map(renderStockItem)}
          </>
        )}

        {tab === TAB_PRODUCTOS && (
          <>
            {productos.length === 0 ? (
              <View style={S.empty}>
                <Ionicons name="cube-outline" size={48} color={C.textSecondary} />
                <Text style={S.emptyText}>Aún no tienes productos</Text>
                <TouchableOpacity style={[S.btnAdd, { marginTop: 16, paddingHorizontal: 20 }]} onPress={abrirCrearProducto}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Crear primer producto</Text>
                </TouchableOpacity>
              </View>
            ) : productos.map(p => {
              const stock = parseInt(p.stock) || 0;
              const stockColor = stock === 0 ? '#ef4444' : stock < 10 ? '#f59e0b' : '#22c55e';
              const galeria = galeriaDe(p);
              const img = galeria[0] || null;
              const rating = parseFloat(p.promedio_valoracion || 0);
              const nReviews = parseInt(p.total_valoraciones || 0);
              const vendidos = parseInt(p.total_vendido || 0);
              return (
                <View key={p.id} style={[S.card, { padding: 0, overflow: 'hidden', opacity: p.disponible ? 1 : 0.65 }]}>
                  {/* Foto + acciones */}
                  <View style={{ position: 'relative' }}>
                    {img ? (
                      <Image source={{ uri: img }} style={{ width: '100%', height: 150 }} />
                    ) : (
                      <View style={{ width: '100%', height: 150, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="fish-outline" size={36} color={C.textSecondary} />
                      </View>
                    )}
                    {galeria.length > 1 && (
                      <View style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,.6)', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="images-outline" size={11} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{galeria.length}</Text>
                      </View>
                    )}
                    <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity onPress={() => abrirEditarProducto(p)}
                        style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,.6)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="create-outline" size={15} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => eliminarProducto(p)}
                        style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(239,68,68,.8)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="trash-outline" size={15} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    {/* Toggle disponible */}
                    <TouchableOpacity onPress={() => toggleDisponibleProducto(p)} disabled={togglingId === p.id}
                      style={{
                        position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 5,
                        paddingVertical: 3, paddingHorizontal: 9, borderRadius: 14,
                        backgroundColor: p.disponible ? 'rgba(34,197,94,.92)' : 'rgba(107,114,128,.92)',
                        opacity: togglingId === p.id ? 0.6 : 1,
                      }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' }} />
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                        {p.disponible ? 'Visible' : 'Oculto'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Info */}
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ color: C.text, fontWeight: '700', fontSize: 15, flex: 1, paddingRight: 8 }}>{p.nombre}</Text>
                      <Text style={{ color: C.text, fontWeight: '800', fontSize: 16 }}>Bs {Number(p.precio || 0).toFixed(2)}</Text>
                    </View>

                    {/* Métricas */}
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="star" size={12} color={nReviews > 0 ? '#f59e0b' : C.textSecondary} />
                        <Text style={{ fontSize: 11, color: nReviews > 0 ? '#f59e0b' : C.textSecondary }}>
                          {nReviews > 0 ? `${rating.toFixed(1)} (${nReviews})` : 'Sin reseñas'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="bag-handle-outline" size={12} color={vendidos > 0 ? '#22c55e' : C.textSecondary} />
                        <Text style={{ fontSize: 11, color: vendidos > 0 ? '#22c55e' : C.textSecondary }}>
                          {vendidos} vendido{vendidos === 1 ? '' : 's'}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 6 }}>
                      Stock: <Text style={{ color: stockColor, fontWeight: '700' }}>{stock} {p.unidad || 'unid'}</Text>
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: 'rgba(34,197,94,.15)', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        onPress={() => { setPrecioFor(p); setPrecioVal(String(p.precio || '')); }}>
                        <Ionicons name="cash-outline" size={14} color="#22c55e" />
                        <Text style={{ color: '#22c55e', fontWeight: '700', fontSize: 12 }}>Precio</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: 'rgba(139,92,246,.15)', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        onPress={() => { setVentaFor(p); setVentaCant(''); setVentaDesc(''); }}>
                        <Ionicons name="home-outline" size={14} color="#8b5cf6" />
                        <Text style={{ color: '#8b5cf6', fontWeight: '700', fontSize: 12 }}>Venta</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {tab === TAB_MOVIMIENTOS && (
          <>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                { k: '',              l: 'Todos' },
                { k: 'venta_online',  l: 'Online' },
                { k: 'venta_offline', l: 'Presencial' },
                { k: 'alta',          l: 'Entradas' },
                { k: 'devolucion',    l: 'Devolución' },
                { k: 'ajuste',        l: 'Ajustes' },
                { k: 'merma',         l: 'Mermas' },
              ].map(f => (
                <TouchableOpacity key={f.k}
                  style={[S.chipEspecie, filtroMov === f.k && S.chipEspecieActivo]}
                  onPress={() => setFiltroMov(f.k)}>
                  <Text style={[S.chipEspecieText, filtroMov === f.k && { color: '#fff' }]}>{f.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {movimientos.length === 0 ? (
              <View style={S.empty}>
                <Ionicons name="swap-vertical-outline" size={48} color={C.textSecondary} />
                <Text style={S.emptyText}>Sin movimientos para este filtro</Text>
              </View>
            ) : movimientos.map(m => {
              const cant = parseFloat(m.cantidad);
              const meta = {
                alta:           { label: 'Entrada',          color: '#22c55e', icon: 'arrow-up-outline' },
                venta_online:   { label: 'Venta online',     color: '#3b82f6', icon: 'cart-outline' },
                venta_offline:  { label: 'Venta presencial', color: '#8b5cf6', icon: 'home-outline' },
                ajuste:         { label: 'Ajuste',           color: '#f59e0b', icon: 'construct-outline' },
                merma:          { label: 'Merma',            color: '#ef4444', icon: 'skull-outline' },
                devolucion:     { label: 'Devolución',       color: '#22c55e', icon: 'arrow-undo-outline' },
              }[m.tipo] || { label: m.tipo, color: C.textSecondary, icon: 'cube-outline' };
              const fecha = new Date(m.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
              return (
                <View key={m.id} style={[S.card, { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }]}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: meta.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={meta.icon} size={18} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                        {m.producto_nombre || `#${m.producto_id}`}
                      </Text>
                      <Text style={{ color: cant >= 0 ? '#22c55e' : '#ef4444', fontWeight: '700', fontSize: 14 }}>
                        {cant >= 0 ? '+' : ''}{cant} {m.unidad}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                      <Text style={{ color: meta.color, fontSize: 11, fontWeight: '600' }}>{meta.label}</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 11 }}>{fecha}</Text>
                    </View>
                    {m.descripcion && (
                      <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 4, fontStyle: 'italic' }} numberOfLines={2}>
                        {m.descripcion}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Modal: Actualizar precio */}
      <Modal visible={!!precioFor} transparent animationType="fade" onRequestClose={() => setPrecioFor(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <View style={S.modalBox}>
            <Text style={S.modalTitulo}>Actualizar precio</Text>
            <Text style={S.modalSubtitulo}>{precioFor?.nombre}</Text>
            <Text style={S.inputLabel}>Precio por kg (Bs)</Text>
            <TextInput
              style={S.input}
              keyboardType="decimal-pad"
              autoFocus
              value={precioVal}
              onChangeText={setPrecioVal}
              placeholderTextColor={C.textSecondary}
            />
            <View style={S.modalBtns}>
              <TouchableOpacity style={S.btnCancelar} onPress={() => setPrecioFor(null)}>
                <Text style={S.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.btnGuardar} onPress={guardarPrecio} disabled={savingQuick}>
                {savingQuick ? <ActivityIndicator color="#fff" /> : <Text style={S.btnGuardarText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Venta presencial */}
      <Modal visible={!!ventaFor} transparent animationType="fade" onRequestClose={() => setVentaFor(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <View style={S.modalBox}>
            <Text style={S.modalTitulo}>Venta presencial</Text>
            <Text style={S.modalSubtitulo}>
              {ventaFor?.nombre} · stock: {ventaFor?.stock || 0} {ventaFor?.unidad || 'unid'}
            </Text>
            <Text style={S.inputLabel}>Cantidad vendida</Text>
            <TextInput
              style={S.input}
              keyboardType="decimal-pad"
              autoFocus
              value={ventaCant}
              onChangeText={setVentaCant}
              placeholderTextColor={C.textSecondary}
            />
            <Text style={S.inputLabel}>Notas (opcional)</Text>
            <TextInput
              style={S.input}
              placeholder="Ej. cliente Pedro, pago efectivo"
              value={ventaDesc}
              onChangeText={setVentaDesc}
              placeholderTextColor={C.textSecondary}
            />
            <View style={S.modalBtns}>
              <TouchableOpacity style={S.btnCancelar} onPress={() => setVentaFor(null)}>
                <Text style={S.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.btnGuardar} onPress={guardarVenta} disabled={savingQuick}>
                {savingQuick ? <ActivityIndicator color="#fff" /> : <Text style={S.btnGuardarText}>Registrar venta</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Crear / Editar Producto */}
      <Modal visible={productoModal} transparent animationType="slide" onRequestClose={() => setProductoModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <View style={[S.modalBox, { maxHeight: '88%' }]}>
            <Text style={S.modalTitulo}>{editandoProd ? 'Editar producto' : 'Nuevo producto'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Galería de fotos */}
              <Text style={S.inputLabel}>Fotos ({imagenesProd.length}/6) — la primera es la portada</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {imagenesProd.map((img, i) => (
                    <View key={img.id} style={{ width: 84, height: 84, borderRadius: 10, overflow: 'hidden', borderWidth: i === 0 ? 2 : 1, borderColor: i === 0 ? C.primary : C.border }}>
                      <Image source={{ uri: img.uri || img.url }} style={{ width: '100%', height: '100%' }} />
                      {i === 0 && (
                        <View style={{ position: 'absolute', top: 2, left: 2, backgroundColor: C.primary, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1 }}>
                          <Text style={{ color: '#fff', fontSize: 7, fontWeight: '700' }}>PORTADA</Text>
                        </View>
                      )}
                      <TouchableOpacity onPress={() => quitarImagenProd(img.id)}
                        style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(239,68,68,.9)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="close" size={11} color="#fff" />
                      </TouchableOpacity>
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,.55)' }}>
                        <TouchableOpacity onPress={() => moverImagenProd(img.id, -1)} disabled={i === 0} style={{ flex: 1, alignItems: 'center', paddingVertical: 1 }}>
                          <Text style={{ color: i === 0 ? '#666' : '#fff', fontSize: 13 }}>‹</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => moverImagenProd(img.id, 1)} disabled={i === imagenesProd.length - 1} style={{ flex: 1, alignItems: 'center', paddingVertical: 1 }}>
                          <Text style={{ color: i === imagenesProd.length - 1 ? '#666' : '#fff', fontSize: 13 }}>›</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  {imagenesProd.length < 6 && (
                    <TouchableOpacity onPress={elegirImagenes}
                      style={{ width: 84, height: 84, borderRadius: 10, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <Ionicons name="add" size={22} color={C.textSecondary} />
                      <Text style={{ fontSize: 9, color: C.textSecondary }}>Agregar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>

              <Text style={S.inputLabel}>Nombre *</Text>
              <TextInput style={S.input} value={productoForm.nombre}
                onChangeText={t => setProductoForm(f => ({ ...f, nombre: t }))}
                placeholder="Ej. Trucha fresca" placeholderTextColor={C.textSecondary} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={S.inputLabel}>Descripción</Text>
                <TouchableOpacity
                  onPress={generarDescripcionIA}
                  disabled={iaGenerando || !productoForm.nombre.trim()}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
                    backgroundColor: productoForm.nombre.trim() ? C.primary + '22' : 'transparent',
                    borderWidth: 1, borderColor: productoForm.nombre.trim() ? C.primary + '55' : C.border,
                    opacity: productoForm.nombre.trim() ? 1 : 0.5,
                    marginBottom: 4,
                  }}>
                  {iaGenerando
                    ? <ActivityIndicator size="small" color={C.primary} />
                    : <Ionicons name="sparkles" size={12} color={C.primary} />}
                  <Text style={{ fontSize: 11, fontWeight: '700', color: C.primary }}>
                    {iaGenerando ? 'Generando…' : 'Generar IA'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput style={[S.input, { height: 64, textAlignVertical: 'top' }]} multiline
                value={productoForm.descripcion}
                onChangeText={t => setProductoForm(f => ({ ...f, descripcion: t }))}
                placeholder="Detalles del producto" placeholderTextColor={C.textSecondary} />

              <Text style={S.inputLabel}>Categoría *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {categorias.map(c => {
                    const sel = String(productoForm.categoria_id) === String(c.id);
                    return (
                      <TouchableOpacity key={c.id} onPress={() => setProductoForm(f => ({ ...f, categoria_id: String(c.id) }))}
                        style={{
                          paddingVertical: 7, paddingHorizontal: 13, borderRadius: 16, borderWidth: 1.5,
                          borderColor: sel ? C.primary : C.border,
                          backgroundColor: sel ? C.primary + '1f' : C.surface,
                        }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: sel ? C.primary : C.textSecondary }}>{c.nombre}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={S.inputLabel}>Precio (Bs) *</Text>
                  <TextInput style={S.input} keyboardType="decimal-pad" value={productoForm.precio}
                    onChangeText={t => setProductoForm(f => ({ ...f, precio: t }))}
                    placeholder="0.00" placeholderTextColor={C.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.inputLabel}>Stock *</Text>
                  <TextInput style={S.input} keyboardType="number-pad" value={productoForm.stock}
                    onChangeText={t => setProductoForm(f => ({ ...f, stock: t }))}
                    placeholder="0" placeholderTextColor={C.textSecondary} />
                </View>
              </View>
            </ScrollView>

            <View style={S.modalBtns}>
              <TouchableOpacity style={S.btnCancelar} onPress={() => setProductoModal(false)}>
                <Text style={S.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.btnGuardar} onPress={guardarProducto} disabled={savingProducto}>
                {savingProducto ? <ActivityIndicator color="#fff" /> : <Text style={S.btnGuardarText}>{editandoProd ? 'Actualizar' : 'Crear'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════ MODALES ═══════════════════════════════════════════ */}

      {/* Modal: Nueva Laguna */}
      <Modal visible={modal === 'nueva_laguna'} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <View style={S.modalBox}>
            <Text style={S.modalTitulo}>Nueva Laguna</Text>
            <TextInput style={S.input} placeholder="Nombre de la laguna" placeholderTextColor={C.textSecondary} value={formLaguna.nombre} onChangeText={v => setFormLaguna(f => ({ ...f, nombre: v }))} />
            <TextInput style={S.input} placeholder="Capacidad máxima (peces)" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formLaguna.capacidad_maxima} onChangeText={v => setFormLaguna(f => ({ ...f, capacidad_maxima: v }))} />
            <TextInput style={[S.input, { height: 80 }]} placeholder="Descripción (opcional)" placeholderTextColor={C.textSecondary} multiline value={formLaguna.descripcion} onChangeText={v => setFormLaguna(f => ({ ...f, descripcion: v }))} />
            <View style={S.modalBtns}>
              <TouchableOpacity style={S.btnCancelar} onPress={cerrarModal}><Text style={S.btnCancelarText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={S.btnGuardar} onPress={guardarLaguna} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.btnGuardarText}>Crear</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Iniciar Siembra */}
      <Modal visible={modal === 'siembra'} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <ScrollView contentContainerStyle={S.modalBox}>
            <Text style={S.modalTitulo}>Iniciar Siembra</Text>
            <Text style={S.modalSubtitulo}>{lagunaActiva?.nombre}</Text>

            <Text style={S.inputLabel}>Especie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {especies.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[S.chipEspecie, formSiembra.especie_id === String(e.id) && S.chipEspecieActivo]}
                  onPress={() => setFormSiembra(f => ({ ...f, especie_id: String(e.id), peso_inicial_g: String(e.peso_inicial_g), peso_objetivo_g: String(e.peso_objetivo_g), duracion_dias: String(e.duracion_ciclo_dias) }))}
                >
                  <Text style={[S.chipEspecieText, formSiembra.especie_id === String(e.id) && { color: '#fff' }]}>{e.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput style={S.input} placeholder="Cantidad de alevines" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formSiembra.cantidad_inicial} onChangeText={v => setFormSiembra(f => ({ ...f, cantidad_inicial: v }))} />
            <View style={S.inputRow}>
              <TextInput style={[S.input, { flex: 1, marginRight: 8 }]} placeholder="Peso inicial (g)" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formSiembra.peso_inicial_g} onChangeText={v => setFormSiembra(f => ({ ...f, peso_inicial_g: v }))} />
              <TextInput style={[S.input, { flex: 1 }]} placeholder="Peso objetivo (g)" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formSiembra.peso_objetivo_g} onChangeText={v => setFormSiembra(f => ({ ...f, peso_objetivo_g: v }))} />
            </View>
            <TextInput style={S.input} placeholder="Duración ciclo (días)" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formSiembra.duracion_dias} onChangeText={v => setFormSiembra(f => ({ ...f, duracion_dias: v }))} />
            <View style={S.inputRow}>
              <TextInput style={[S.input, { flex: 1, marginRight: 8 }]} placeholder="Costo alevines (Bs)" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formSiembra.precio_alevines_bs} onChangeText={v => setFormSiembra(f => ({ ...f, precio_alevines_bs: v }))} />
              <TextInput style={[S.input, { flex: 1 }]} placeholder="Precio venta kg (Bs)" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formSiembra.precio_venta_kg_bs} onChangeText={v => setFormSiembra(f => ({ ...f, precio_venta_kg_bs: v }))} />
            </View>

            <View style={S.modalBtns}>
              <TouchableOpacity style={S.btnCancelar} onPress={cerrarModal}><Text style={S.btnCancelarText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={S.btnGuardar} onPress={guardarSiembra} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.btnGuardarText}>Iniciar</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Registrar Movimiento */}
      <Modal visible={modal === 'movimiento'} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <View style={S.modalBox}>
            <Text style={S.modalTitulo}>Registrar Movimiento</Text>
            <Text style={S.modalSubtitulo}>{lagunaActiva?.nombre}</Text>

            <View style={S.tiposMovRow}>
              {[
                { key: 'alimentacion', icon: 'restaurant-outline', label: 'Alimentación' },
                { key: 'mortalidad',   icon: 'skull-outline',      label: 'Mortalidad' },
                { key: 'costo',        icon: 'cash-outline',       label: 'Costo' },
                { key: 'venta',        icon: 'bag-outline',        label: 'Venta (kg)' },
              ].map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[S.tipoMovBtn, formMov.tipo === t.key && S.tipoMovBtnActivo]}
                  onPress={() => setFormMov(f => ({ ...f, tipo: t.key }))}
                >
                  <Ionicons name={t.icon} size={18} color={formMov.tipo === t.key ? '#fff' : C.textSecondary} />
                  <Text style={[S.tipoMovText, formMov.tipo === t.key && { color: '#fff' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={S.input}
              placeholder={formMov.tipo === 'alimentacion' ? 'Kg de alimento (opcional)' : formMov.tipo === 'mortalidad' ? 'Número de peces muertos' : formMov.tipo === 'costo' ? 'Monto (Bs)' : 'Kg vendidos'}
              placeholderTextColor={C.textSecondary}
              keyboardType="numeric"
              value={formMov.cantidad}
              onChangeText={v => setFormMov(f => ({ ...f, cantidad: v }))}
            />
            <TextInput style={S.input} placeholder="Descripción (opcional)" placeholderTextColor={C.textSecondary} value={formMov.descripcion} onChangeText={v => setFormMov(f => ({ ...f, descripcion: v }))} />

            <View style={S.modalBtns}>
              <TouchableOpacity style={S.btnCancelar} onPress={cerrarModal}><Text style={S.btnCancelarText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={S.btnGuardar} onPress={guardarMovimiento} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.btnGuardarText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Compra Alimento */}
      <Modal visible={modal === 'compra'} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <View style={S.modalBox}>
            <Text style={S.modalTitulo}>Registrar Compra</Text>
            <Text style={S.inputLabel}>Tipo de alimento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {stockAlimento.map(s => (
                <TouchableOpacity
                  key={s.tipo_alimento_id || s.id}
                  style={[S.chipEspecie, formCompra.tipo_alimento_id === String(s.tipo_alimento_id || s.id) && S.chipEspecieActivo]}
                  onPress={() => setFormCompra(f => ({ ...f, tipo_alimento_id: String(s.tipo_alimento_id || s.id) }))}
                >
                  <Text style={[S.chipEspecieText, formCompra.tipo_alimento_id === String(s.tipo_alimento_id || s.id) && { color: '#fff' }]}>{s.codigo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={S.input} placeholder="Cantidad de sacos" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formCompra.sacos} onChangeText={v => setFormCompra(f => ({ ...f, sacos: v }))} />
            <TextInput style={S.input} placeholder="Costo por saco (Bs)" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formCompra.costo_por_saco} onChangeText={v => setFormCompra(f => ({ ...f, costo_por_saco: v }))} />
            <View style={S.modalBtns}>
              <TouchableOpacity style={S.btnCancelar} onPress={cerrarModal}><Text style={S.btnCancelarText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={S.btnGuardar} onPress={guardarCompra} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.btnGuardarText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Nueva Especie */}
      <Modal visible={modal === 'especie'} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <View style={S.modalBox}>
            <Text style={S.modalTitulo}>Nueva Especie</Text>
            <TextInput style={S.input} placeholder="Nombre (ej: Trucha arcoíris)" placeholderTextColor={C.textSecondary} value={formEspecie.nombre} onChangeText={v => setFormEspecie(f => ({ ...f, nombre: v }))} />
            <View style={S.inputRow}>
              <TextInput style={[S.input, { flex: 1, marginRight: 8 }]} placeholder="Peso inicial (g)" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formEspecie.peso_inicial_g} onChangeText={v => setFormEspecie(f => ({ ...f, peso_inicial_g: v }))} />
              <TextInput style={[S.input, { flex: 1 }]} placeholder="Peso objetivo (g)" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formEspecie.peso_objetivo_g} onChangeText={v => setFormEspecie(f => ({ ...f, peso_objetivo_g: v }))} />
            </View>
            <TextInput style={S.input} placeholder="Duración ciclo (días)" placeholderTextColor={C.textSecondary} keyboardType="numeric" value={formEspecie.duracion_ciclo_dias} onChangeText={v => setFormEspecie(f => ({ ...f, duracion_ciclo_dias: v }))} />
            <View style={S.modalBtns}>
              <TouchableOpacity style={S.btnCancelar} onPress={cerrarModal}><Text style={S.btnCancelarText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={S.btnGuardar} onPress={guardarEspecie} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.btnGuardarText}>Crear</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Detalle Laguna */}
      <Modal visible={modal === 'detalle'} transparent animationType="slide">
        <View style={S.modalOverlay}>
          <View style={[S.modalBox, { maxHeight: '90%' }]}>
            <View style={S.detalleHeader}>
              <Text style={S.modalTitulo}>{lagunaActiva?.nombre}</Text>
              <TouchableOpacity onPress={cerrarModal}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>
            {renderDetalleContent()}
            {detalle && !detalle.produccion && (
              <TouchableOpacity style={[S.btnGuardar, { marginTop: 16 }]} onPress={() => { cerrarModal(); setTimeout(() => abrirModal('siembra', lagunaActiva), 300); }}>
                <Text style={S.btnGuardarText}>Iniciar siembra</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = (C) => StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.background },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  titulo:        { fontSize: 24, fontWeight: '700', color: C.text },
  btnAdd:        { backgroundColor: C.primary, borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  tabs:          { flexDirection: 'row', marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 12, padding: 4, marginBottom: 8 },
  tab:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 6, borderRadius: 10 },
  tabActivo:     { backgroundColor: C.background },
  tabText:       { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  scroll:        { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyText:     { color: C.textSecondary, marginTop: 12, fontSize: 15 },

  // Cards lagunas
  card:          { backgroundColor: C.surface, borderRadius: 16, padding: 16, gap: 10 },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:     { fontSize: 16, fontWeight: '700', color: C.text },
  estadoBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  estadoDot:     { width: 7, height: 7, borderRadius: 4 },
  estadoText:    { fontSize: 12, fontWeight: '600' },
  btnSiembra:    { backgroundColor: C.primary + '22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  btnSiembraText:{ fontSize: 12, fontWeight: '600', color: C.primary },
  progresoRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  progresoLabel: { fontSize: 12, color: C.textSecondary },
  progresoPct:   { fontSize: 12, fontWeight: '700', color: C.primary },
  barBg:         { height: 6, backgroundColor: C.border, borderRadius: 3 },
  barFill:       { height: 6, borderRadius: 3 },
  infoRow:       { flexDirection: 'row', gap: 16 },
  infoItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText:      { fontSize: 12, color: C.textSecondary },
  alimentacionBox: { backgroundColor: C.primary + '11', borderRadius: 10, padding: 10, gap: 2 },
  alimentacionText:{ fontSize: 13, fontWeight: '600', color: C.text },
  alimentacionSub: { fontSize: 11, color: C.textSecondary },
  accionesRow:   { flexDirection: 'row', gap: 8 },
  accionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: C.primary + '15', borderRadius: 20 },
  accionText:    { fontSize: 12, fontWeight: '600' },
  sinSiembra:    { color: C.textSecondary, fontSize: 13 },

  // Stock alimento
  stockCard:     { backgroundColor: C.surface, borderRadius: 12, padding: 14, gap: 8 },
  stockFaseBadge:{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  stockFaseText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  stockNombre:   { fontSize: 15, fontWeight: '700', color: C.text },
  stockRow:      { flexDirection: 'row', gap: 20 },
  stockInfo:     { alignItems: 'center' },
  stockSacos:    { fontSize: 18, fontWeight: '700', color: C.text },
  stockLabel:    { fontSize: 11, color: C.textSecondary },
  sinStockBadge: { backgroundColor: '#ef444422', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  sinStockText:  { color: '#ef4444', fontSize: 11, fontWeight: '600' },

  // Modales
  modalOverlay:  { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalTitulo:   { fontSize: 20, fontWeight: '700', color: C.text },
  modalSubtitulo:{ fontSize: 13, color: C.textSecondary, marginTop: -8 },
  input:         { backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
  inputLabel:    { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  inputRow:      { flexDirection: 'row' },
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 4 },
  btnCancelar:   { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  btnCancelarText:{ color: C.text, fontWeight: '600' },
  btnGuardar:    { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
  btnGuardarText:{ color: '#fff', fontWeight: '700' },
  chipEspecie:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, marginRight: 8, backgroundColor: C.surface },
  chipEspecieActivo: { backgroundColor: C.primary, borderColor: C.primary },
  chipEspecieText:{ fontSize: 13, fontWeight: '600', color: C.text },
  tiposMovRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipoMovBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  tipoMovBtnActivo: { backgroundColor: C.primary, borderColor: C.primary },
  tipoMovText:   { fontSize: 12, fontWeight: '600', color: C.textSecondary },

  // Detalle
  detalleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detalleSeccion:{ fontSize: 14, fontWeight: '700', color: C.textSecondary, marginTop: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  finRow:        { flexDirection: 'row', gap: 12, marginBottom: 4 },
  finItem:       { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 12 },
  finLabel:      { fontSize: 11, color: C.textSecondary, marginBottom: 4 },
  finValor:      { fontSize: 16, fontWeight: '700' },
  planRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  planNombre:    { fontSize: 13, fontWeight: '600', color: C.text },
  planDias:      { fontSize: 11, color: C.textSecondary },
  planSacos:     { fontSize: 14, fontWeight: '700', color: C.text },
  planCosto:     { fontSize: 11, color: C.textSecondary },
  movRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  movIconBox:    { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  movTipo:       { fontSize: 13, fontWeight: '600', color: C.text },
  movDesc:       { fontSize: 11, color: C.textSecondary },
  movCantidad:   { fontSize: 12, fontWeight: '600', color: C.text },
  btnEspecie:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.primary + '44', borderStyle: 'dashed', marginBottom: 4 },
  btnEspecieText:{ fontWeight: '600', fontSize: 14 },
});
