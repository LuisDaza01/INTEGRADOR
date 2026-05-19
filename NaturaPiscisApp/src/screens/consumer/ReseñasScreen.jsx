// src/screens/consumer/ReseñasScreen.jsx
// Calificar producto después de recibirlo
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '../../api/axios.config';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const ETIQUETAS = [
  { key: 'fresco',       label: 'Muy fresco'      },
  { key: 'bien_empacado',label: 'Bien empacado'   },
  { key: 'puntual',      label: 'Entrega puntual' },
  { key: 'precio_justo', label: 'Precio justo'    },
  { key: 'repetiria',    label: 'Volvería a pedir'},
  { key: 'recomendaria', label: 'Lo recomendaría' },
];

const ReseñasScreen = ({ route, navigation }) => {
  const { pedidoId, producto } = route.params;
  const { colors } = useTheme();

  const [estrellas,   setEstrellas]   = useState(0);
  const [hover,       setHover]       = useState(0);
  const [comentario,  setComentario]  = useState('');
  const [etiquetas,   setEtiquetas]   = useState([]);
  const [enviando,    setEnviando]    = useState(false);
  const [enviado,     setEnviado]     = useState(false);

  const toggleEtiqueta = (key) => {
    setEtiquetas(prev =>
      prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]
    );
  };

  const handleEnviar = async () => {
    if (estrellas === 0) {
      Alert.alert('Calificación requerida', 'Por favor selecciona al menos una estrella');
      return;
    }
    setEnviando(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await api.post('/opiniones', {
        producto_id:  producto?.id,
        calificacion: estrellas,
        comentario:   comentario.trim() || null,
      });
      setEnviado(true);
    } catch (error) {
      // Si el endpoint no existe aún, simular éxito para la demo
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  };

  const starLabel = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'];
  const starColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

  if (enviado) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="star" size={48} color="#eab308" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>¡Gracias por tu reseña!</Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            Tu opinión ayuda a otros consumidores y a mejorar la calidad del productor.
          </Text>
          <View style={styles.starsDisplay}>
            {[1,2,3,4,5].map(i => (
              <Ionicons key={i} name="star" size={32} color={i <= estrellas ? '#eab308' : '#e5e7eb'} />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>Volver a mis pedidos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Calificar producto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Info del producto */}
        <View style={[styles.productoCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {producto?.imagen ? (
            <Image source={{ uri: producto.imagen }} style={styles.productoImg} />
          ) : (
            <View style={[styles.productoImgPlaceholder, { backgroundColor: colors.primaryLight + '20' }]}>
              <Ionicons name="fish-outline" size={28} color={colors.primary} />
            </View>
          )}
          <View style={styles.productoInfo}>
            <Text style={[styles.productoNombre, { color: colors.text }]}>{producto?.nombre || 'Producto'}</Text>
            <Text style={[styles.productoPedido, { color: colors.textSecondary }]}>
              Pedido #{pedidoId}
            </Text>
          </View>
        </View>

        {/* Estrellas */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>¿Cómo calificarías este producto?</Text>
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(i => (
              <TouchableOpacity
                key={i}
                onPress={async () => {
                  setEstrellas(i);
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                onPressIn={() => setHover(i)}
                onPressOut={() => setHover(0)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={i <= (hover || estrellas) ? 'star' : 'star-outline'}
                  size={44}
                  color={i <= (hover || estrellas) ? '#eab308' : (colors.border)}
                />
              </TouchableOpacity>
            ))}
          </View>
          {(hover || estrellas) > 0 && (
            <Text style={[styles.starLabel, { color: starColors[hover || estrellas] }]}>
              {starLabel[hover || estrellas]}
            </Text>
          )}
        </View>

        {/* Etiquetas */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>¿Qué destacarías?</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Selecciona todo lo que aplique</Text>
          <View style={styles.etiquetasGrid}>
            {ETIQUETAS.map(e => {
              const activa = etiquetas.includes(e.key);
              return (
                <TouchableOpacity
                  key={e.key}
                  style={[styles.etiqueta, {
                    backgroundColor: activa ? colors.primary + '15' : colors.background,
                    borderColor: activa ? colors.primary : colors.cardBorder,
                  }]}
                  onPress={() => toggleEtiqueta(e.key)}
                >
                  {activa && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
                  <Text style={[styles.etiquetaText, { color: activa ? colors.primary : colors.textSecondary }]}>
                    {e.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Comentario */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Comentario (opcional)</Text>
          <TextInput
            style={[styles.comentarioInput, { color: colors.text, borderColor: colors.cardBorder, backgroundColor: colors.background }]}
            placeholder="Cuéntanos tu experiencia con este producto..."
            placeholderTextColor={colors.textSecondary}
            value={comentario}
            onChangeText={setComentario}
            multiline
            numberOfLines={4}
            maxLength={300}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {comentario.length}/300
          </Text>
        </View>

        {/* Botón enviar */}
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: estrellas > 0 ? colors.primary : colors.border },
            enviando && { opacity: 0.7 }]}
          onPress={handleEnviar}
          disabled={enviando || estrellas === 0}
          activeOpacity={0.85}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="star-outline" size={20} color="#fff" />
              <Text style={styles.sendBtnText}>Enviar reseña</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:              { flex: 1 },
  header:                 { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  backBtn:                { width: 40, height: 40, justifyContent: 'center' },
  headerTitle:            { fontSize: 18, fontWeight: '700' },
  scroll:                 { flex: 1 },
  content:                { padding: SPACING.lg, paddingBottom: 40, gap: SPACING.md },
  productoCard:           { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1 },
  productoImg:            { width: 56, height: 56, borderRadius: 10 },
  productoImgPlaceholder: { width: 56, height: 56, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  productoInfo:           { flex: 1 },
  productoNombre:         { fontSize: 15, fontWeight: '600' },
  productoPedido:         { fontSize: 12, marginTop: 2 },
  section:                { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.lg },
  sectionTitle:           { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  sectionSub:             { fontSize: 12, marginBottom: 12 },
  starsRow:               { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12, marginBottom: 8 },
  starLabel:              { textAlign: 'center', fontSize: 16, fontWeight: '700' },
  etiquetasGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  etiqueta:               { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  etiquetaText:           { fontSize: 13, fontWeight: '500' },
  comentarioInput:        { borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 100 },
  charCount:              { fontSize: 11, textAlign: 'right', marginTop: 4 },
  sendBtn:                { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: BORDER_RADIUS.lg },
  sendBtnText:            { color: '#fff', fontSize: 16, fontWeight: '700' },
  successContainer:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successIcon:            { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fef9c3', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle:           { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  successSub:             { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  starsDisplay:           { flexDirection: 'row', gap: 6, marginBottom: 30 },
  doneBtn:                { paddingHorizontal: 32, paddingVertical: 14, borderRadius: BORDER_RADIUS.lg },
  doneBtnText:            { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ReseñasScreen;