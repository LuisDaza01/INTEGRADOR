// src/screens/consumer/PagoQRScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios.config';

const QR_IMAGE_FALLBACK = require('../../assets/qr_bcp.jpeg');

const PagoQRScreen = ({ route, navigation }) => {
  const params = route?.params || {};
  const {
    total, pedidoData, paradaSeleccionada, qrPagoUrl, productorNombre,
    pedidoIdExistente,        // ← pedido ya pesado pendiente de confirmar
  } = params;
  const modoExistente = !!pedidoIdExistente;

  const { colors } = useTheme();
  const [procesando,        setProcesando]        = useState(false);
  // Siempre arranca en la vista de pago (QR + instrucciones). El comprobante se sube DESPUÉS
  // de que el usuario confirma haber pagado.
  const [pagoConfirmado,    setPagoConfirmado]    = useState(false);
  const [pedidoId,          setPedidoId]          = useState(pedidoIdExistente || null);
  const [subiendoComp,      setSubiendoComp]      = useState(false);
  const [comprobanteSubido, setComprobanteSubido] = useState(false);
  const [confirmandoPrecio, setConfirmandoPrecio] = useState(false);

  if ((!modoExistente && !pedidoData) || total == null) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center', padding: 24 }}>
          No se recibieron los datos del pedido. Vuelve al carrito e inténtalo de nuevo.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleConfirmarPago = async () => {
    if (procesando || pagoConfirmado) return;
    Alert.alert(
      '¿Ya realizaste el pago?',
      `Confirma que transferiste Bs ${parseFloat(total).toFixed(2)} al productor ${productorNombre || 'del pedido'}`,
      [
        { text: 'Aún no', style: 'cancel' },
        {
          text: 'Sí, ya pagué',
          onPress: async () => {
            if (procesando || pagoConfirmado) return;
            setProcesando(true);
            try {
              // En modo "pedido ya existe" no creamos uno nuevo — el pedido ya está creado.
              // Sólo avanzamos a la vista de subir comprobante.
              if (modoExistente) {
                setPagoConfirmado(true);
              } else {
                const resp = await api.post('/pedidos', {
                  ...pedidoData,
                  metodo_pago_id: 7,
                  notas: `Pago QR - ${productorNombre || 'productor'}. ${pedidoData.notas || ''}`,
                });
                setPedidoId(resp.data?.data?.id || null);
                setPagoConfirmado(true);
              }
            } catch (error) {
              if (__DEV__) console.warn('Error pedido:', error?.response?.data || error.message);
              Alert.alert('Error', 'No se pudo confirmar el pedido. Intenta de nuevo.');
            } finally {
              setProcesando(false);
            }
          }
        }
      ]
    );
  };

  const handleSubirComprobante = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir el comprobante.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const mime = asset.mimeType || 'image/jpeg';
    if (!mime.startsWith('image/')) {
      Alert.alert('Archivo inválido', 'Selecciona una imagen.');
      return;
    }

    setSubiendoComp(true);
    try {
      const uri = asset.uri;
      const formData = new FormData();
      formData.append('comprobante', { uri, type: mime, name: `comprobante.${mime.split('/')[1] || 'jpg'}` });
      await api.post(`/pedidos/${pedidoId}/comprobante`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setComprobanteSubido(true);

      // En modo "pedido ya pesado", confirmar el precio recién después del comprobante.
      if (modoExistente) {
        setConfirmandoPrecio(true);
        try {
          await api.post(`/pedidos/${pedidoId}/confirmar-precio`);
          Alert.alert('✅ Pago enviado', 'Tu comprobante fue enviado. El productor verificará el pago y preparará tu pedido.');
        } catch (e) {
          Alert.alert('Comprobante enviado', 'El comprobante se subió pero hubo un problema al avanzar el pedido. Inténtalo desde Mis Pedidos.');
        } finally {
          setConfirmandoPrecio(false);
        }
      } else {
        Alert.alert('✅ Comprobante enviado', 'El productor recibió tu comprobante y verificará el pago.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo subir el comprobante. Intenta desde "Mis Pedidos".');
    } finally {
      setSubiendoComp(false);
    }
  };

  if (pagoConfirmado) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <Ionicons
            name={comprobanteSubido ? 'checkmark-circle' : 'cloud-upload-outline'}
            size={80}
            color={comprobanteSubido ? '#22C55E' : '#3B82F6'}
          />
          <Text style={[styles.successTitle, { color: colors.text }]}>
            {comprobanteSubido ? '¡Comprobante enviado!' : 'Sube tu comprobante de pago'}
          </Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            {comprobanteSubido
              ? 'El productor verificará tu pago y confirmará tu pedido pronto.'
              : `Adjunta la captura de la transferencia de Bs ${parseFloat(total).toFixed(2)} para que el productor verifique tu pago.`}
          </Text>
          {paradaSeleccionada && (
            <View style={[styles.paradaInfo, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="bus" size={20} color="#3B82F6" />
              <Text style={[styles.paradaInfoText, { color: '#3B82F6' }]}>
                Entrega en: {paradaSeleccionada.nombre}
              </Text>
            </View>
          )}
          {!comprobanteSubido ? (
            <TouchableOpacity
              style={[styles.subirBtn, (subiendoComp || confirmandoPrecio) && { opacity: 0.7 }]}
              onPress={handleSubirComprobante}
              disabled={subiendoComp || confirmandoPrecio || !pedidoId}
            >
              {(subiendoComp || confirmandoPrecio)
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="camera-outline" size={20} color="#fff" />
                    <Text style={styles.subirBtnText}>Subir comprobante</Text>
                  </>
              }
            </TouchableOpacity>
          ) : (
            <View style={styles.comprobanteListo}>
              <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
              <Text style={{ color: '#22C55E', fontWeight: '600', fontSize: 14 }}>Comprobante enviado</Text>
            </View>
          )}
          <TouchableOpacity style={styles.verPedidoBtn} onPress={() => navigation.navigate('MisPedidos')}>
            <Text style={styles.verPedidoBtnText}>Ver mis pedidos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pago con QR</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={[styles.montoCard, { backgroundColor: '#3B82F6' }]}>
          <Text style={styles.montoLabel}>Monto a pagar</Text>
          <Text style={styles.montoValue}>Bs {parseFloat(total).toFixed(2)}</Text>
          <Text style={styles.montoHint}>Transfiere exactamente este monto</Text>
        </View>

        <View style={[styles.qrCard, { backgroundColor: colors.card }]}>
          <View style={styles.bancoHeader}>
            <Ionicons name="qr-code-outline" size={24} color="#3B82F6" />
            <Text style={[styles.bancoNombre, { color: colors.text }]}>QR de Pago</Text>
          </View>
          {qrPagoUrl ? (
            <Image source={{ uri: qrPagoUrl }} style={styles.qrImage} resizeMode="contain" />
          ) : (
            <Image source={QR_IMAGE_FALLBACK} style={styles.qrImage} resizeMode="contain" />
          )}
          <View style={[styles.cuentaInfo, { backgroundColor: colors.surface }]}>
            <View style={styles.cuentaRow}>
              <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.cuentaLabel, { color: colors.textSecondary }]}>Productor:</Text>
              <Text style={[styles.cuentaValue, { color: colors.text }]}>{productorNombre || '—'}</Text>
            </View>
          </View>
        </View>

        {paradaSeleccionada && (
          <View style={[styles.paradaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="bus" size={20} color="#3B82F6" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Entrega en parada:</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{paradaSeleccionada.nombre}</Text>
            </View>
          </View>
        )}

        <View style={[styles.instruccionesCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.instruccionesTitle, { color: colors.text }]}>¿Cómo pagar?</Text>
          {[
            { num: '1', text: 'Abre tu app bancaria o billetera digital' },
            { num: '2', text: 'Escanea el código QR del productor' },
            { num: '3', text: `Ingresa el monto: Bs ${parseFloat(total).toFixed(2)}` },
            { num: '4', text: 'Confirma la transferencia' },
            { num: '5', text: 'Vuelve aquí y presiona "Ya pagué"' },
          ].map((paso) => (
            <View key={paso.num} style={styles.paso}>
              <View style={[styles.pasoNum, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.pasoNumText, { color: '#3B82F6' }]}>{paso.num}</Text>
              </View>
              <Text style={[styles.pasoText, { color: colors.text }]}>{paso.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.confirmarBtn, procesando && { opacity: 0.7 }]}
          onPress={handleConfirmarPago}
          disabled={procesando}
        >
          {procesando
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                <Text style={styles.confirmarBtnText}>Ya realicé el pago</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16, gap: 14 },
  montoCard: { borderRadius: 16, padding: 24, alignItems: 'center' },
  montoLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  montoValue: { fontSize: 42, fontWeight: 'bold', color: '#fff' },
  montoHint: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  qrCard: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 16 },
  bancoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bancoNombre: { fontSize: 18, fontWeight: '700' },
  qrImage: { width: 220, height: 220, borderRadius: 12 },
  cuentaInfo: { width: '100%', borderRadius: 10, padding: 12, gap: 8 },
  cuentaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cuentaLabel: { fontSize: 13 },
  cuentaValue: { fontSize: 13, fontWeight: '600', flex: 1 },
  paradaCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  instruccionesCard: { borderRadius: 16, padding: 16, gap: 12 },
  instruccionesTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pasoNum: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  pasoNumText: { fontSize: 13, fontWeight: '700' },
  pasoText: { fontSize: 14, flex: 1 },
  footer: { padding: 16, borderTopWidth: 1 },
  confirmarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#22C55E', paddingVertical: 16, borderRadius: 14, gap: 8 },
  confirmarBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  successContainer: { alignItems: 'center', padding: 32, gap: 16 },
  successTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
  successSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  paradaInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10 },
  paradaInfoText: { fontSize: 14, fontWeight: '500' },
  verPedidoBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  verPedidoBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  subirBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#8b5cf6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 4 },
  subirBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  comprobanteListo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
});

export default PagoQRScreen;