// src/screens/common/ConversacionesScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { mensajeService } from '../../api/services/mensaje.service';

const ConversacionesScreen = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();

  const [conversaciones, setConversaciones] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [busqueda,       setBusqueda]       = useState('');

  const C = {
    bg:      isDarkMode ? '#080C14' : colors.background,
    surface: isDarkMode ? '#0D1525' : colors.surface,
    card:    isDarkMode ? '#111827' : '#FFFFFF',
    border:  isDarkMode ? 'rgba(56,189,248,0.15)' : colors.border,
    text:    isDarkMode ? '#E8F0FF' : colors.text,
    muted:   isDarkMode ? '#64748B' : colors.textSecondary,
    primary: isDarkMode ? '#38bdf8' : colors.primary,
    input:   isDarkMode ? 'rgba(56,189,248,0.06)' : colors.inputBackground,
    unread:  isDarkMode ? '#38bdf8' : colors.primary,
  };

  const fetchConversaciones = useCallback(async () => {
    const result = await mensajeService.getConversaciones();
    if (result.success) {
      const data = Array.isArray(result.data) ? result.data : [];
      setConversaciones(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversaciones();
    }, [fetchConversaciones])
  );

  const filtradas = conversaciones.filter(c => {
    const q = busqueda.toLowerCase();
    return !q || (c.partner_nombre || '').toLowerCase().includes(q) || (c.ultimo_mensaje || '').toLowerCase().includes(q);
  });

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7)  return d.toLocaleDateString('es-BO', { weekday: 'short' });
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <View style={[s.centered, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: C.bg }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: C.text }]}>Mensajes</Text>
          {conversaciones.length > 0 && (
            <Text style={[s.headerSub, { color: C.muted }]}>
              {conversaciones.length} conversación{conversaciones.length !== 1 ? 'es' : ''}
            </Text>
          )}
        </View>
      </View>

      {/* Búsqueda */}
      <View style={[s.searchWrap, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <View style={[s.searchBar, { backgroundColor: C.input, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.muted} />
          <TextInput
            style={[s.searchInput, { color: C.text }]}
            placeholder="Buscar conversaciones..."
            placeholderTextColor={C.muted}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={16} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchConversaciones(); }}
            tintColor={C.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filtradas.length === 0 ? (
          <View style={[s.emptyBox]}>
            <View style={[s.emptyIcon, { backgroundColor: isDarkMode ? 'rgba(56,189,248,0.08)' : '#EFF6FF' }]}>
              <Ionicons name="chatbubbles-outline" size={40} color={C.primary} />
            </View>
            <Text style={[s.emptyTitle, { color: C.text }]}>
              {busqueda ? 'Sin resultados' : 'Sin conversaciones'}
            </Text>
            <Text style={[s.emptySub, { color: C.muted }]}>
              {busqueda
                ? 'Intenta con otro nombre o mensaje.'
                : 'Inicia un chat desde el perfil de un productor o desde tus reservas.'}
            </Text>
          </View>
        ) : (
          filtradas.map((conv) => {
            const tieneNoLeidos = (conv.no_leidos || 0) > 0;
            return (
              <TouchableOpacity
                key={conv.partner_id}
                onPress={() => navigation.navigate('Chat', {
                  destinatarioId: conv.partner_id,
                  nombre:         conv.partner_nombre || 'Chat',
                  foto:           conv.partner_foto,
                })}
                style={[s.convRow, { backgroundColor: C.card, borderBottomColor: C.border }]}
                activeOpacity={0.7}
              >
                {/* Avatar */}
                {conv.partner_foto ? (
                  <Image source={{ uri: conv.partner_foto }} style={s.avatar} />
                ) : (
                  <View style={[s.avatarFallback, { backgroundColor: isDarkMode ? 'rgba(56,189,248,0.12)' : '#DBEAFE' }]}>
                    <Ionicons name="person-outline" size={22} color={C.primary} />
                  </View>
                )}

                {/* Contenido */}
                <View style={s.convContent}>
                  <View style={s.convTop}>
                    <Text style={[s.convNombre, { color: C.text, fontWeight: tieneNoLeidos ? '800' : '600' }]} numberOfLines={1}>
                      {conv.partner_nombre || 'Usuario'}
                    </Text>
                    <Text style={[s.convTime, { color: tieneNoLeidos ? C.primary : C.muted }]}>
                      {formatTime(conv.ultimo_mensaje_at)}
                    </Text>
                  </View>
                  <View style={s.convBottom}>
                    <Text
                      style={[s.convPreview, { color: tieneNoLeidos ? C.text : C.muted, fontWeight: tieneNoLeidos ? '600' : '400' }]}
                      numberOfLines={1}
                    >
                      {conv.ultimo_mensaje || 'Iniciar conversación'}
                    </Text>
                    {tieneNoLeidos && (
                      <View style={[s.badge, { backgroundColor: C.unread }]}>
                        <Text style={s.badgeText}>{conv.no_leidos > 9 ? '9+' : conv.no_leidos}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={16} color={C.muted} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:    { flex: 1 },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn:      { padding: 8, marginRight: 4 },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  headerSub:    { fontSize: 12, marginTop: 1 },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchBar:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  searchInput:{ flex: 1, fontSize: 14, padding: 0 },

  emptyBox:  { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle:{ fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptySub:  { fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  convRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  avatar:      { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  avatarFallback: { width: 52, height: 52, borderRadius: 26, marginRight: 14, justifyContent: 'center', alignItems: 'center' },
  convContent: { flex: 1, minWidth: 0 },
  convTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convNombre:  { fontSize: 15, flex: 1, marginRight: 8 },
  convTime:    { fontSize: 11 },
  convBottom:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  convPreview: { fontSize: 13, flex: 1, marginRight: 8 },
  badge:       { minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText:   { fontSize: 11, fontWeight: '700', color: '#fff' },
});

export default ConversacionesScreen;
