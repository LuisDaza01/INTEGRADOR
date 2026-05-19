// src/components/common/FloatingAssistant.jsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios.config';

const SUGERENCIAS = {
  productor: [
    '¿Cuántos pedidos tengo pendientes?',
    '¿Cómo registro el peso de un pedido?',
    '¿Qué hago si se acaba el stock?',
  ],
  consumidor: [
    '¿Cómo hago una reserva?',
    '¿En qué estado está mi pedido?',
    '¿Cómo confirmo el precio?',
  ],
};

const FloatingAssistant = ({ rol = 'consumidor' }) => {
  const { colors, isDarkMode } = useTheme();
  const [abierto,  setAbierto]  = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [input,    setInput]    = useState('');
  const [cargando, setCargando] = useState(false);
  const scrollRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  const C = {
    bg:     isDarkMode ? '#0D1525' : '#FFFFFF',
    surface:isDarkMode ? '#111827' : '#F9FAFB',
    border: isDarkMode ? 'rgba(56,189,248,0.18)' : '#E5E7EB',
    text:   isDarkMode ? '#E8F0FF' : '#111827',
    muted:  isDarkMode ? '#64748B' : '#6B7280',
    input:  isDarkMode ? '#1E293B' : '#F3F4F6',
    bubble: isDarkMode ? '#1E3A5F' : '#EFF6FF',
  };

  const abrir = () => {
    setAbierto(true);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
      Animated.timing(opacAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const cerrar = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 5 }),
      Animated.timing(opacAnim,  { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => setAbierto(false));
  };

  const enviar = useCallback(async (texto) => {
    const msg = (texto || input).trim();
    if (!msg || cargando) return;
    setInput('');

    const previos = mensajes;
    setMensajes(prev => [...prev, { role: 'user', content: msg }]);
    setCargando(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await api.post('/asistente', {
        mensaje:   msg,
        historial: previos.slice(-8),
      });
      const respuesta = res.data?.respuesta || 'Sin respuesta.';
      setMensajes(prev => [...prev, { role: 'assistant', content: respuesta }]);
    } catch {
      setMensajes(prev => [...prev, { role: 'assistant', content: 'No pude conectar con el asistente. Intenta de nuevo.' }]);
    } finally {
      setCargando(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [input, mensajes, cargando]);

  const sugerencias = SUGERENCIAS[rol] || SUGERENCIAS.consumidor;

  return (
    <>
      {abierto && (
        <Animated.View style={[s.panel, { backgroundColor: C.bg, borderColor: C.border, opacity: opacAnim, transform: [{ scale: scaleAnim }] }]}>

          {/* Header */}
          <LinearGradient colors={['#0ea5e9', '#14b8a6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.avatarCircle}>
                <Ionicons name="fish" size={16} color="#fff" />
              </View>
              <View>
                <Text style={s.headerTitle}>Asistente NaturaPiscis</Text>
              </View>
            </View>
            <TouchableOpacity onPress={cerrar} style={s.closeBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Mensajes */}
          <ScrollView
            ref={scrollRef}
            style={[s.mensajesArea, { backgroundColor: C.surface }]}
            contentContainerStyle={{ padding: 12, gap: 10 }}
            showsVerticalScrollIndicator={false}
          >
            {mensajes.length === 0 && (
              <View>
                <View style={[s.bubble, s.bubbleBot, { backgroundColor: C.bubble }]}>
                  <Text style={[s.bubbleText, { color: C.text }]}>
                    ¡Hola! ¿En qué te puedo ayudar hoy?
                  </Text>
                </View>
                <View style={s.sugerencias}>
                  {sugerencias.map((sg, i) => (
                    <TouchableOpacity key={i} onPress={() => enviar(sg)}
                      style={[s.chip, { borderColor: '#0ea5e9', backgroundColor: isDarkMode ? 'rgba(14,165,233,0.08)' : '#EFF6FF' }]}>
                      <Text style={[s.chipText, { color: '#0ea5e9' }]}>{sg}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {mensajes.map((m, i) => (
              <View key={i} style={[s.bubble, m.role === 'user' ? s.bubbleUser : [s.bubbleBot, { backgroundColor: C.bubble }]]}>
                {m.role === 'assistant' && (
                  <View style={s.botIcon}>
                    <Ionicons name="fish" size={12} color="#0ea5e9" />
                  </View>
                )}
                <Text style={[s.bubbleText, { color: m.role === 'user' ? '#fff' : C.text }, m.role === 'assistant' && { flex: 1 }]}>
                  {m.content}
                </Text>
              </View>
            ))}

            {cargando && (
              <View style={[s.bubble, s.bubbleBot, { backgroundColor: C.bubble }]}>
                <ActivityIndicator size="small" color="#0ea5e9" />
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[s.inputRow, { backgroundColor: C.bg, borderTopColor: C.border }]}>
              <TextInput
                style={[s.input, { backgroundColor: C.input, color: C.text }]}
                placeholder="Escribe tu pregunta..."
                placeholderTextColor={C.muted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => enviar()}
                returnKeyType="send"
                multiline
              />
              <TouchableOpacity
                onPress={() => enviar()}
                disabled={!input.trim() || cargando}
                style={[s.sendBtn, { opacity: input.trim() && !cargando ? 1 : 0.4 }]}
              >
                <LinearGradient colors={['#0ea5e9', '#14b8a6']} style={s.sendGrad}>
                  <Ionicons name="send" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* FAB */}
      {!abierto && (
        <TouchableOpacity onPress={abrir} activeOpacity={0.85} style={s.fab}>
          <LinearGradient colors={['#0ea5e9', '#14b8a6']} style={s.fabGrad}>
            <Ionicons name="sparkles" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </>
  );
};

const s = StyleSheet.create({
  panel: {
    position: 'absolute', bottom: 90, right: 16,
    width: 320, height: 470,
    borderRadius: 20, borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 20,
    zIndex: 9000,
  },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle:{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 10 },
  closeBtn:    { padding: 4 },

  mensajesArea: { flex: 1 },

  bubble:     { maxWidth: '85%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: '#0ea5e9' },
  bubbleBot:  { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  botIcon:    { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(14,165,233,0.15)', justifyContent: 'center', alignItems: 'center', marginTop: 1, flexShrink: 0 },
  bubbleText: { fontSize: 13, lineHeight: 19 },

  sugerencias: { marginTop: 10, gap: 6 },
  chip:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  chipText:    { fontSize: 12, fontWeight: '500' },

  inputRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, borderTopWidth: 1 },
  input:      { flex: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, maxHeight: 80 },
  sendBtn:    { width: 38, height: 38, borderRadius: 19, overflow: 'hidden' },
  sendGrad:   { flex: 1, justifyContent: 'center', alignItems: 'center' },

  fab:     { position: 'absolute', bottom: 94, right: 16, width: 52, height: 52, borderRadius: 26, overflow: 'hidden', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12, zIndex: 9000 },
  fabGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default FloatingAssistant;
