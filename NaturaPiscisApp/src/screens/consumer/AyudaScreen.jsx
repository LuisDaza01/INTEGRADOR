// src/screens/consumer/AyudaScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const FAQS = [
  { icon: 'cart-outline',         q: '¿Cómo realizar un pedido?',               a: 'Navega a la Tienda, selecciona un producto, elige la cantidad y toca "Agregar al carrito". Luego ve al carrito, selecciona una parada de entrega y escanea el QR de pago BCP.' },
  { icon: 'qr-code-outline',      q: '¿Cómo funciona el pago QR?',              a: 'Al confirmar tu pedido aparece un código QR del banco BCP. Escanéalo con tu app bancaria y transfiere el total. El productor confirmará tu pago manualmente.' },
  { icon: 'navigate-outline',     q: '¿Cómo rastrea mi pedido?',                a: 'En "Mis Pedidos" toca el botón "Seguir pedido". Verás un mapa en tiempo real con la ubicación del conductor, el origen y tu destino.' },
  { icon: 'scan-outline',         q: '¿Qué es la trazabilidad QR?',             a: 'Cada producto tiene un código QR que muestra su historia completa: en qué laguna fue criado, los parámetros del agua (temperatura, pH, turbidez) y quién lo entregó.' },
  { icon: 'pulse-outline',        q: '¿Qué es el monitoreo IoT?',               a: 'Sensores ESP32 miden en tiempo real la temperatura, pH y turbidez del agua donde se crían los peces. Las alertas llegan automáticamente si algo sale del rango óptimo.' },
  { icon: 'star-outline',         q: '¿Cómo calificar un producto?',            a: 'En "Mis Pedidos", los pedidos con estado "Entregado" muestran el botón amarillo "Calificar pedido". Puedes dar de 1 a 5 estrellas y agregar etiquetas y comentario.' },
  { icon: 'person-outline',       q: '¿Cómo contactar a un productor?',         a: 'Entra al perfil de cualquier productor desde la Tienda y usa los botones de Llamar o WhatsApp para contactarlo directamente.' },
  { icon: 'fish-outline',         q: '¿Cómo sé si el pescado es fresco?',       a: 'Todos nuestros productores están verificados. Además puedes ver el historial de parámetros del agua escaneando el QR del producto — si el agua estuvo en rango óptimo, el pez está sano.' },
];

const FAQItem = ({ item, colors }) => {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      onPress={() => setOpen(!open)}
      activeOpacity={0.8}
    >
      <View style={styles.faqHeader}>
        <View style={[styles.faqIcon, { backgroundColor: colors.primaryLight + '20' }]}>
          <Ionicons name={item.icon} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.faqQ, { color: colors.text }]} numberOfLines={open ? 0 : 2}>
          {item.q}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textSecondary}
        />
      </View>
      {open && (
        <Text style={[styles.faqA, { color: colors.textSecondary, borderTopColor: colors.border }]}>
          {item.a}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const AyudaScreen = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ayuda</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          Todo lo que necesitas saber sobre NaturaPiscis
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preguntas frecuentes</Text>
        {FAQS.map((item, i) => (
          <FAQItem key={i} item={item} colors={colors} />
        ))}

        {/* Contacto */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>
          ¿Necesitas más ayuda?
        </Text>

        <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.contactBtn, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            onPress={() => Linking.openURL('mailto:soporte@naturapiscis.com')}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="mail-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>Correo electrónico</Text>
              <Text style={[styles.contactSub, { color: colors.textSecondary }]}>soporte@naturapiscis.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactBtn, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            onPress={() => Linking.openURL('whatsapp://send?phone=59171234567&text=Hola, necesito ayuda con NaturaPiscis')}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="logo-whatsapp" size={20} color="#22c55e" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>WhatsApp</Text>
              <Text style={[styles.contactSub, { color: colors.textSecondary }]}>+591 71234567</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL('tel:+59171234567')}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="call-outline" size={20} color="#ef4444" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>Llamar soporte</Text>
              <Text style={[styles.contactSub, { color: colors.textSecondary }]}>Lun–Vie 8:00–18:00</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Footer versión */}
        <View style={styles.footer}>
          <Ionicons name="fish" size={18} color={colors.textSecondary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            NaturaPiscis v1.0.0 — UNIFRANZ 2025
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  headerTitle:  { fontSize: 26, fontWeight: 'bold' },
  headerSub:    { fontSize: 13, marginTop: 4 },
  scroll:       { flex: 1 },
  content:      { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  sectionTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  faqItem:      { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  faqHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  faqIcon:      { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  faqQ:         { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  faqA:         { fontSize: 13, lineHeight: 19, padding: 14, paddingTop: 10, borderTopWidth: 1 },
  contactCard:  { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  contactBtn:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  contactIcon:  { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  contactInfo:  { flex: 1 },
  contactTitle: { fontSize: 14, fontWeight: '500' },
  contactSub:   { fontSize: 12, marginTop: 1 },
  footer:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  footerText:   { fontSize: 12 },
});

export default AyudaScreen;