// src/components/common/FloatingAssistant.jsx
// Asistente Flotante Inteligente — Diseño futurista con glassmorphism, brillo neón dinámico, micro-animaciones y tipografía SpaceGrotesk

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios.config';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

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
  
  // Animaciones del panel
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;
  
  // Animación del FAB (pulso infinito)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Colores neón con fallback
  const neonCyan = colors.neonCyan || '#00F5FF';
  const neonGreen = colors.neonGreen || '#00FF88';
  const neonMagenta = colors.neonMagenta || '#FF00E5';

  useEffect(() => {
    // Animación de pulso infinito para el FAB cuando el panel está cerrado
    let animation;
    if (!abierto) {
      pulseAnim.setValue(1);
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }
    return () => animation?.stop();
  }, [abierto]);

  const C = {
    bg:      isDarkMode ? 'rgba(10, 15, 30, 0.94)' : 'rgba(255, 255, 255, 0.95)',
    surface: isDarkMode ? 'rgba(3, 7, 18, 0.6)' : 'rgba(243, 244, 246, 0.6)',
    border:  isDarkMode ? 'rgba(0, 245, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)',
    text:    colors.text,
    muted:   colors.textMuted || '#94a3b8',
    input:   isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    bubble:  isDarkMode ? 'rgba(0, 245, 255, 0.08)' : 'rgba(16, 185, 129, 0.06)',
    bubbleBorder: isDarkMode ? 'rgba(0, 245, 255, 0.15)' : 'rgba(16, 185, 129, 0.12)',
    neonCyan,
    neonGreen,
  };

  const abrir = () => {
    setAbierto(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 8,
      }),
      Animated.timing(opacAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const cerrar = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
      Animated.timing(opacAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
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
        <Animated.View
          style={[
            s.panel,
            {
              backgroundColor: C.bg,
              borderColor: C.border,
              opacity: opacAnim,
              transform: [{ scale: scaleAnim }],
              shadowColor: neonCyan,
            }
          ]}
        >
          {/* Header de gradiente futurista */}
          <LinearGradient
            colors={[neonCyan, neonGreen]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.header}
          >
            <View style={s.headerLeft}>
              <View style={s.avatarCircle}>
                <Ionicons name="sparkles" size={16} color="#030712" />
              </View>
              <View>
                <Text style={[s.headerTitle, { fontFamily: 'SpaceGrotesk-Bold' }]}>NaturaPiscis AI</Text>
                <Text style={[s.headerSub, { fontFamily: 'SpaceGrotesk-Medium' }]}>Asistente Cuántico</Text>
              </View>
            </View>
            <TouchableOpacity onPress={cerrar} style={s.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close-circle-outline" size={24} color="#030712" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Línea de brillo neón debajo del header */}
          <LinearGradient
            colors={['transparent', neonCyan, neonGreen, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.shimmerLine}
          />

          {/* Área de mensajes con scroll */}
          <ScrollView
            ref={scrollRef}
            style={[s.mensajesArea, { backgroundColor: C.surface }]}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {mensajes.length === 0 && (
              <View>
                <View style={[s.bubble, s.bubbleBot, { backgroundColor: C.bubble, borderColor: C.bubbleBorder }]}>
                  <View style={s.botIcon}>
                    <Ionicons name="fish" size={12} color={neonCyan} />
                  </View>
                  <Text style={[s.bubbleText, { color: C.text, fontFamily: 'SpaceGrotesk-Regular' }]}>
                    ¡Saludos! Soy tu asistente inteligente NaturaPiscis. ¿Cómo puedo optimizar tu experiencia hoy?
                  </Text>
                </View>

                <View style={s.sugerencias}>
                  <Text style={[s.sugerenciasTitle, { color: C.muted, fontFamily: 'SpaceGrotesk-SemiBold' }]}>
                    Sugerencias rápidas:
                  </Text>
                  {sugerencias.map((sg, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => enviar(sg)}
                      activeOpacity={0.8}
                      style={[
                        s.chip,
                        {
                          borderColor: `${neonCyan}40`,
                          backgroundColor: isDarkMode ? 'rgba(0,245,255,0.05)' : 'rgba(0,182,212,0.06)'
                        }
                      ]}
                    >
                      <Text style={[s.chipText, { color: isDarkMode ? neonCyan : '#0891b2', fontFamily: 'SpaceGrotesk-Medium' }]}>
                        {sg}
                      </Text>
                      <Ionicons name="chevron-forward-outline" size={12} color={isDarkMode ? neonCyan : '#0891b2'} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {mensajes.map((m, i) => (
              <View
                key={i}
                style={[
                  s.bubble,
                  m.role === 'user'
                    ? [s.bubbleUser, { borderColor: `${neonCyan}30` }]
                    : [s.bubbleBot, { backgroundColor: C.bubble, borderColor: C.bubbleBorder }]
                ]}
              >
                {m.role === 'assistant' && (
                  <View style={s.botIcon}>
                    <Ionicons name="fish" size={12} color={neonCyan} />
                  </View>
                )}
                
                {m.role === 'user' ? (
                  <LinearGradient
                    colors={[neonCyan, `${neonCyan}cc`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}

                <Text
                  style={[
                    s.bubbleText,
                    {
                      color: m.role === 'user' ? '#030712' : C.text,
                      fontFamily: m.role === 'user' ? 'SpaceGrotesk-Medium' : 'SpaceGrotesk-Regular'
                    },
                    m.role === 'assistant' && { flex: 1 }
                  ]}
                >
                  {m.content}
                </Text>
              </View>
            ))}

            {cargando && (
              <View style={[s.bubble, s.bubbleBot, { backgroundColor: C.bubble, borderColor: C.bubbleBorder }]}>
                <View style={s.botIcon}>
                  <Ionicons name="fish" size={12} color={neonCyan} />
                </View>
                <ActivityIndicator size="small" color={neonCyan} />
              </View>
            )}
          </ScrollView>

          {/* Línea de brillo neón sobre el input */}
          <LinearGradient
            colors={['transparent', neonCyan, neonGreen, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.shimmerLine}
          />

          {/* Formulario de Input */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[s.inputRow, { backgroundColor: C.bg, borderTopColor: 'rgba(255,255,255,0.03)' }]}>
              <TextInput
                style={[
                  s.input,
                  {
                    backgroundColor: C.input,
                    color: C.text,
                    fontFamily: 'SpaceGrotesk-Regular',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
                  }
                ]}
                placeholder="Pregunta lo que sea..."
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
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[neonCyan, neonGreen]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.sendGrad}
                >
                  <Ionicons name="send" size={14} color="#030712" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* FAB Botón Flotante con pulso neón y sombras */}
      {!abierto && (
        <Animated.View
          style={[
            s.fabContainer,
            {
              transform: [{ scale: pulseAnim }],
              shadowColor: neonCyan,
            }
          ]}
        >
          <TouchableOpacity onPress={abrir} activeOpacity={0.8} style={s.fabTouch}>
            <LinearGradient
              colors={[neonCyan, neonGreen]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.fabGrad}
            >
              <Ionicons name="sparkles" size={24} color="#030712" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </>
  );
};

const s = StyleSheet.create({
  panel: {
    position: 'absolute', bottom: 90, right: 16,
    width: 330, height: 490,
    borderRadius: 24, borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 22, elevation: 24,
    zIndex: 9000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(3, 7, 18, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#030712', fontWeight: 'bold', fontSize: 14.5 },
  headerSub: { color: 'rgba(3, 7, 18, 0.65)', fontSize: 10.5 },
  closeBtn: { padding: 4 },
  
  shimmerLine: {
    height: 1.5,
    width: '100%',
  },

  mensajesArea: { flex: 1 },

  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    borderColor: 'transparent',
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleBot: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  botIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(3, 7, 18, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    flexShrink: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  bubbleText: { fontSize: 13, lineHeight: 19 },

  sugerencias: { marginTop: 14, gap: 8 },
  sugerenciasTitle: { fontSize: 12.5, marginBottom: 4, paddingHorizontal: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  chipText: { fontSize: 12.5 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    maxHeight: 80,
    borderWidth: 1,
  },
  sendBtn: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden' },
  sendGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  fabContainer: {
    position: 'absolute',
    bottom: 94,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 9000,
  },
  fabTouch: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default FloatingAssistant;
