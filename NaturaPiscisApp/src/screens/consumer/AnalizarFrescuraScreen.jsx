// src/screens/consumer/AnalizarFrescuraScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios.config';

const VISION_USAGE_KEY = 'np_vision_usage';
const DAILY_LIMIT      = 20;
const SOFT_WARN_AT     = 10;

const todayKey = () => new Date().toISOString().slice(0, 10);

const AnalizarFrescuraScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [imagen,    setImagen]    = useState(null);
  const [analizando, setAnalizando] = useState(false);
  const [resultado,  setResultado]  = useState(null);
  const [usosHoy,    setUsosHoy]    = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(VISION_USAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.date === todayKey()) setUsosHoy(parsed.count || 0);
      } catch { /* ignore */ }
    })();
  }, []);

  const incrementarUso = async () => {
    const next = usosHoy + 1;
    setUsosHoy(next);
    try {
      await AsyncStorage.setItem(
        VISION_USAGE_KEY,
        JSON.stringify({ date: todayKey(), count: next }),
      );
    } catch { /* ignore */ }
  };

  const MAX_BASE64_BYTES = Math.floor((5 * 1024 * 1024) * 4 / 3); // 5 MB decoded
  const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp'];

  const seleccionarImagen = async (fuente) => {
    const opciones = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    };

    let result;
    if (fuente === 'camara') {
      const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          canAskAgain
            ? 'Necesitamos acceso a la cámara.'
            : 'Activa el permiso de cámara desde los ajustes del sistema.',
        );
        return;
      }
      result = await ImagePicker.launchCameraAsync(opciones);
    } else {
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          canAskAgain
            ? 'Necesitamos acceso a tu galería.'
            : 'Activa el permiso de galería desde los ajustes del sistema.',
        );
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(opciones);
    }

    if (result.canceled) return;

    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop().toLowerCase();
    const mediaType = asset.mimeType
      || (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');

    if (!TIPOS_VALIDOS.includes(mediaType)) {
      Alert.alert('Formato no soportado', 'Usa JPG, PNG o WebP.');
      return;
    }
    if (!asset.base64 || asset.base64.length > MAX_BASE64_BYTES) {
      Alert.alert(
        'Imagen demasiado grande',
        'La imagen supera 5 MB. Toma otra foto con menor resolución.',
      );
      return;
    }

    setImagen({ uri: asset.uri, base64: asset.base64, mediaType });
    setResultado(null);
  };

  const analizar = async () => {
    if (!imagen?.base64 || analizando) return;

    if (usosHoy >= DAILY_LIMIT) {
      Alert.alert(
        'Límite diario alcanzado',
        `Ya hiciste ${DAILY_LIMIT} análisis hoy. Intenta de nuevo mañana.`,
      );
      return;
    }

    if (usosHoy + 1 === SOFT_WARN_AT) {
      const proceder = await new Promise(resolve => {
        Alert.alert(
          'Uso elevado',
          `Llevas ${SOFT_WARN_AT - 1} análisis hoy. ¿Continuar?`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Continuar', onPress: () => resolve(true) },
          ],
          { cancelable: true, onDismiss: () => resolve(false) },
        );
      });
      if (!proceder) return;
    }

    setAnalizando(true);
    try {
      const { data } = await api.post(
        '/pescado/analizar-frescura',
        { imageBase64: imagen.base64, mediaType: imagen.mediaType || 'image/jpeg' },
        { timeout: 60000 },
      );
      setResultado(data.data);
      await incrementarUso();
    } catch (e) {
      const msg = e.code === 'ECONNABORTED'
        ? 'El análisis tardó demasiado. Verifica tu conexión e intenta de nuevo.'
        : e.response?.status === 429
          ? 'Has alcanzado el límite de consultas a la IA. Intenta más tarde.'
          : e.response?.data?.message || 'No se pudo analizar. Intenta de nuevo.';
      Alert.alert('Error', msg);
    } finally {
      setAnalizando(false);
    }
  };

  const reiniciar = () => {
    setImagen(null);
    setResultado(null);
  };

  const getColorFrescura = () => {
    if (resultado?.fresco === true)  return '#22C55E';
    if (resultado?.fresco === false) return '#EF4444';
    return '#F59E0B';
  };

  const getIconoFrescura = () => {
    if (resultado?.fresco === true)  return 'checkmark-circle';
    if (resultado?.fresco === false) return 'close-circle';
    return 'help-circle';
  };

  const getEtiquetaFrescura = () => {
    if (resultado?.fresco === true)  return '¡Pescado fresco!';
    if (resultado?.fresco === false) return 'No está fresco';
    return 'No determinado';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analizar frescura</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Intro */}
        {!imagen && (
          <View style={[styles.introCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>🐟</Text>
            <Text style={[styles.introTitle, { color: colors.text }]}>¿Tu pescado está fresco?</Text>
            <Text style={[styles.introSub, { color: colors.textSecondary }]}>
              Toma una foto o sube una imagen del pescado y nuestra IA analizará su frescura en segundos.
            </Text>
            <View style={[styles.tipsRow, { backgroundColor: colors.surface || colors.background }]}>
              {[
                { icon: '', tip: 'Foto bien iluminada' },
                { icon: '', tip: 'Enfoca los ojos y escamas' },
                { icon: '', tip: 'Acerca la cámara' },
              ].map((t) => (
                <View key={t.tip} style={styles.tipItem}>
                  <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>{t.tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Imagen seleccionada */}
        {imagen && (
          <View style={styles.imagenContainer}>
            <Image source={{ uri: imagen.uri }} style={styles.imagenPreview} resizeMode="cover" />
            {!resultado && !analizando && (
              <TouchableOpacity style={styles.cambiarBtn} onPress={reiniciar}>
                <Ionicons name="refresh-outline" size={14} color="#fff" />
                <Text style={styles.cambiarBtnText}>Cambiar foto</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Resultado */}
        {resultado && (
          <View style={[styles.resultadoCard, { backgroundColor: colors.card, borderColor: getColorFrescura() }]}>
            {/* Veredicto principal */}
            <View style={[styles.veredictoRow, { backgroundColor: `${getColorFrescura()}18` }]}>
              <Ionicons name={getIconoFrescura()} size={52} color={getColorFrescura()} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.etiqueta, { color: getColorFrescura() }]}>{getEtiquetaFrescura()}</Text>
                <Text style={[styles.puntaje, { color: colors.textSecondary }]}>
                  Puntaje: {resultado.puntaje}/100 · Confianza: {resultado.confianza}
                </Text>
              </View>
            </View>

            {/* Veredicto texto */}
            <Text style={[styles.veredictoTexto, { color: colors.text }]}>{resultado.veredicto}</Text>

            {/* Indicadores */}
            <Text style={[styles.seccionTitulo, { color: colors.text }]}>Indicadores analizados</Text>
            {Object.entries(resultado.indicadores || {}).map(([key, val]) => (
              <View key={key} style={[styles.indicadorRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.indicadorKey, { color: colors.textSecondary }]}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text style={[styles.indicadorVal, { color: colors.text }]}>{val}</Text>
              </View>
            ))}

            {/* Recomendación */}
            <View style={[styles.recomendacionBox, { backgroundColor: colors.surface || colors.background }]}>
              <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
              <Text style={[styles.recomendacionTexto, { color: colors.text }]}>{resultado.recomendacion}</Text>
            </View>

            <TouchableOpacity style={styles.reiniciarBtn} onPress={reiniciar}>
              <Ionicons name="camera-outline" size={18} color="#3B82F6" />
              <Text style={styles.reiniciarBtnText}>Analizar otro pescado</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer con botones */}
      {!resultado && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {!imagen ? (
            <View style={styles.footerBtns}>
              <TouchableOpacity
                style={[styles.fotoBtn, { backgroundColor: colors.surface || '#F3F4F6', borderColor: colors.border }]}
                onPress={() => seleccionarImagen('galeria')}
              >
                <Ionicons name="image-outline" size={22} color={colors.text} />
                <Text style={[styles.fotoBtnText, { color: colors.text }]}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fotoBtn, styles.fotoBtnPrimary]}
                onPress={() => seleccionarImagen('camara')}
              >
                <Ionicons name="camera-outline" size={22} color="#fff" />
                <Text style={[styles.fotoBtnText, { color: '#fff' }]}>Cámara</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.analizarBtn, analizando && { opacity: 0.7 }]}
              onPress={analizar}
              disabled={analizando}
            >
              {analizando ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.analizarBtnText}>Analizando con IA...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="search-outline" size={22} color="#fff" />
                  <Text style={styles.analizarBtnText}>Analizar frescura</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16, gap: 16 },

  introCard: { borderRadius: 16, padding: 24, alignItems: 'center', gap: 12, borderWidth: 1 },
  introTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  introSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  tipsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', borderRadius: 12, padding: 12, marginTop: 4 },
  tipItem: { alignItems: 'center', gap: 4, flex: 1 },
  tipText: { fontSize: 11, textAlign: 'center' },

  imagenContainer: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imagenPreview: { width: '100%', height: 280, borderRadius: 16 },
  cambiarBtn: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  cambiarBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  resultadoCard: { borderRadius: 16, borderWidth: 2, overflow: 'hidden' },
  veredictoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  etiqueta: { fontSize: 20, fontWeight: '800' },
  puntaje: { fontSize: 12, marginTop: 2 },
  veredictoTexto: { fontSize: 14, lineHeight: 20, paddingHorizontal: 20, paddingBottom: 16 },
  seccionTitulo: { fontSize: 13, fontWeight: '700', paddingHorizontal: 20, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  indicadorRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
  indicadorKey: { fontSize: 13, fontWeight: '600' },
  indicadorVal: { fontSize: 13, flex: 1, textAlign: 'right', paddingLeft: 12 },
  recomendacionBox: { flexDirection: 'row', gap: 10, margin: 16, padding: 14, borderRadius: 12, alignItems: 'flex-start' },
  recomendacionTexto: { fontSize: 13, lineHeight: 19, flex: 1 },
  reiniciarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginTop: 0, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#3B82F6' },
  reiniciarBtnText: { color: '#3B82F6', fontSize: 15, fontWeight: '700' },

  footer: { padding: 16, borderTopWidth: 1 },
  footerBtns: { flexDirection: 'row', gap: 12 },
  fotoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  fotoBtnPrimary: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  fotoBtnText: { fontSize: 15, fontWeight: '700' },
  analizarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 14 },
  analizarBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default AnalizarFrescuraScreen;
