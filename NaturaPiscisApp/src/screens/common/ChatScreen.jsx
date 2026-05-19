// src/screens/common/ChatScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, SafeAreaView, Modal,
  ActionSheetIOS, Alert,
} from 'react-native';
import { io } from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { mensajeService } from '../../api/services';
import { API_BASE_URL } from '../../constants/config';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

const timeLabel = (iso) => {
  if (!iso) return '';
  const d   = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ayer';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

const Avatar = ({ nombre, foto, size = 32 }) => {
  if (foto) {
    return <Image source={{ uri: foto }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.4 }}>{nombre?.[0]?.toUpperCase() || '?'}</Text>
    </View>
  );
};

const ChatScreen = ({ route, navigation }) => {
  const { destinatarioId, nombre, foto } = route?.params || {};
  const { colors }  = useTheme();
  const { user, token } = useAuth();
  const C = colors;

  const [mensajes, setMensajes]         = useState([]);
  const [texto, setTexto]               = useState('');
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);
  const [error, setError]               = useState(null);
  const [connected, setConnected]       = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null); // { uri, type:'image'|'video', mimeType }
  const [uploading, setUploading]       = useState(false);
  const [videoVisor, setVideoVisor]     = useState(null); // URL para visor de video

  const flatListRef = useRef(null);
  const socketRef   = useRef(null);
  const myId = user?.id;

  useEffect(() => {
    if (!destinatarioId) navigation?.goBack?.();
  }, [destinatarioId, navigation]);

  // ── Socket.IO ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !destinatarioId) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_chat', destinatarioId);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      setConnected(false);
      if (__DEV__) console.warn('Socket connect_error:', err?.message);
    });
    socket.on('nuevo_mensaje', (msg) => {
      setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    });

    socketRef.current = socket;
    return () => {
      try { socket.emit('leave_chat', destinatarioId); } catch {}
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [destinatarioId, token]);

  // ── Cargar mensajes ────────────────────────────────────────────────
  const fetchMensajes = useCallback(async (silent = false) => {
    if (!destinatarioId) return;
    if (!silent) setLoading(true);
    const res = await mensajeService.getMensajes(destinatarioId);
    if (res.success) {
      setMensajes(res.data || []);
      setError(null);
    } else if (!silent) {
      setError(res.error);
    }
    setLoading(false);
  }, [destinatarioId]);

  useEffect(() => { fetchMensajes(); }, [fetchMensajes]);

  // ── Enviar texto ───────────────────────────────────────────────────
  const handleSend = async () => {
    const contenido = texto.trim();
    if (!contenido || sending || !destinatarioId) return;
    setSending(true);
    setTexto('');
    const res = await mensajeService.enviar(destinatarioId, contenido);
    if (res.success) {
      setMensajes(prev => prev.some(m => m.id === res.data?.id) ? prev : [...prev, res.data]);
    } else {
      setTexto(contenido);
      setError(res.error);
    }
    setSending(false);
  };

  // ── Seleccionar imagen/video ───────────────────────────────────────
  const pickMedia = async (source) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para enviar archivos.');
      return;
    }

    let result;
    if (source === 'camera') {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (cam.status !== 'granted') return;
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        videoMaxDuration: 60,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        videoMaxDuration: 60,
      });
    }

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const isVideo = asset.type === 'video';
      const mimeType = isVideo
        ? (asset.uri.endsWith('.mov') ? 'video/quicktime' : 'video/mp4')
        : 'image/jpeg';
      setMediaPreview({ uri: asset.uri, type: isVideo ? 'video' : 'image', mimeType });
    }
  };

  const showMediaPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Galería', 'Cámara'], cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) pickMedia('gallery'); if (idx === 2) pickMedia('camera'); }
      );
    } else {
      Alert.alert('Enviar archivo', '', [
        { text: 'Galería',  onPress: () => pickMedia('gallery') },
        { text: 'Cámara',   onPress: () => pickMedia('camera') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  // ── Enviar media ───────────────────────────────────────────────────
  const handleSendMedia = async () => {
    if (!mediaPreview || uploading) return;
    setUploading(true);
    const res = await mensajeService.enviarMedia(destinatarioId, mediaPreview.uri, mediaPreview.mimeType);
    if (res.success) {
      setMensajes(prev => prev.some(m => m.id === res.data?.id) ? prev : [...prev, res.data]);
      setMediaPreview(null);
    } else {
      Alert.alert('Error', res.error || 'No se pudo enviar el archivo');
    }
    setUploading(false);
  };

  // ── Render de burbuja ──────────────────────────────────────────────
  const renderItem = ({ item: m, index }) => {
    const isMine     = m.remitente_id === myId;
    const prevMsg    = mensajes[index - 1];
    const showAvatar = !isMine && prevMsg?.remitente_id !== m.remitente_id;
    const isImagen   = m.tipo === 'imagen';
    const isVideo    = m.tipo === 'video';

    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}>
        {!isMine && (
          <View style={{ width: 28, alignItems: 'center', justifyContent: 'flex-end', marginRight: 6 }}>
            {showAvatar && <Avatar nombre={nombre} foto={foto} size={28} />}
          </View>
        )}
        <View style={{ maxWidth: '72%' }}>
          {isImagen ? (
            <TouchableOpacity onPress={() => setVideoVisor(m.archivo_url)} activeOpacity={0.9}>
              <Image
                source={{ uri: m.archivo_url }}
                style={{
                  width: 210, height: 160, borderRadius: 14,
                  borderBottomRightRadius: isMine ? 4 : 14,
                  borderBottomLeftRadius:  isMine ? 14 : 4,
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : isVideo ? (
            <TouchableOpacity
              onPress={() => setVideoVisor(m.archivo_url)}
              style={{ width: 210, height: 160, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="play-circle" size={52} color="rgba(255,255,255,0.85)" />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 }}>Toca para reproducir</Text>
            </TouchableOpacity>
          ) : (
            <View style={[
              styles.bubble,
              isMine
                ? { backgroundColor: '#3B82F6', borderBottomRightRadius: 4 }
                : { backgroundColor: C.surface, borderBottomLeftRadius: 4 },
            ]}>
              <Text style={[styles.bubbleText, { color: isMine ? '#fff' : C.text }]}>{m.contenido}</Text>
            </View>
          )}
          <Text style={[styles.timeText, { color: C.muted, textAlign: isMine ? 'right' : 'left' }]}>
            {timeLabel(m.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Avatar nombre={nombre} foto={foto} size={34} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>{nombre || 'Chat'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connected ? '#34d399' : '#9ca3af' }} />
            <Text style={[styles.headerSub, { color: connected ? '#34d399' : C.muted }]}>
              {connected ? 'En vivo' : 'Reconectando...'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => fetchMensajes()} style={styles.backBtn}>
          <Ionicons name="refresh" size={20} color={C.muted} />
        </TouchableOpacity>
      </View>

      {/* Mensajes */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#3B82F6" />
          <Text style={[styles.loadingText, { color: C.muted }]}>Cargando mensajes...</Text>
        </View>
      ) : error && mensajes.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          <Text style={{ color: C.muted, marginTop: 8, fontSize: 14 }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchMensajes()} style={[styles.retryBtn, { borderColor: '#3B82F6' }]}>
            <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 14 }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={m => String(m.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 12, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="chatbubbles-outline" size={48} color={C.muted} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: C.muted }]}>Sé el primero en escribir</Text>
            </View>
          }
          onContentSizeChange={() => mensajes.length > 0 && flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => mensajes.length > 0 && flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Preview de media antes de enviar */}
      {mediaPreview && (
        <View style={[styles.previewBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <View style={{ flex: 1, position: 'relative' }}>
            {mediaPreview.type === 'image' ? (
              <Image source={{ uri: mediaPreview.uri }} style={styles.previewThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.previewThumb, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="videocam" size={28} color="#fff" />
              </View>
            )}
            <TouchableOpacity onPress={() => setMediaPreview(null)}
              style={styles.previewClose}>
              <Ionicons name="close-circle" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSendMedia} disabled={uploading}
            style={[styles.sendBtn, { opacity: uploading ? 0.55 : 1, marginLeft: 8 }]}>
            {uploading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputRow, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          {/* Botón imagen/video */}
          <TouchableOpacity onPress={showMediaPicker}
            style={[styles.mediaBtn, { backgroundColor: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.25)' }]}>
            <Ionicons name="image-outline" size={20} color="#38bdf8" />
          </TouchableOpacity>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={C.muted}
            multiline
            style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!texto.trim() || sending}
            style={[styles.sendBtn, { opacity: !texto.trim() || sending ? 0.45 : 1 }]}>
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Visor de imagen/video a pantalla completa */}
      <Modal visible={!!videoVisor} transparent animationType="fade" onRequestClose={() => setVideoVisor(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setVideoVisor(null)}
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          {videoVisor && (
            videoVisor.match(/\.(mp4|mov|avi|webm)$/i) ? (
              <Video
                source={{ uri: videoVisor }}
                style={{ width: '100%', height: '60%' }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
            ) : (
              <Image
                source={{ uri: videoVisor }}
                style={{ width: '100%', height: '80%' }}
                resizeMode="contain"
              />
            )
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, gap: 8 },
  backBtn:      { padding: 4 },
  headerTitle:  { fontSize: 15, fontWeight: '700' },
  headerSub:    { fontSize: 11, marginTop: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText:  { fontSize: 13, marginTop: 8 },
  emptyText:    { fontSize: 14, marginTop: 10, opacity: 0.6 },
  retryBtn:     { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  msgRow:       { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' },
  msgRowMine:   { justifyContent: 'flex-end' },
  msgRowOther:  { justifyContent: 'flex-start' },
  bubble:       { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  bubbleText:   { fontSize: 14, lineHeight: 20 },
  timeText:     { fontSize: 10, marginTop: 3, marginHorizontal: 4 },
  inputRow:     { flexDirection: 'row', alignItems: 'flex-end', padding: 10, gap: 8, borderTopWidth: 1 },
  mediaBtn:     { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', flexShrink: 0, borderWidth: 1 },
  input:        { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 100 },
  sendBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  previewBar:   { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1 },
  previewThumb: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden' },
  previewClose: { position: 'absolute', top: -6, right: -6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10 },
});

export default ChatScreen;
