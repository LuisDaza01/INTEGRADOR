// src/navigation/AppNavigator.jsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useCarrito } from '../contexts/CarritoContext';

// ── Tab bar frosted-glass background ──────────────────────────
const TabBarBackground = ({ customColors }) => {
  const { isDarkMode } = useTheme();
  const bgColors = customColors || (isDarkMode
    ? ['rgba(10,22,46,0.97)', 'rgba(5,12,26,0.99)']
    : ['rgba(255,255,255,0.97)', 'rgba(248,250,252,0.99)']);
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={bgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
      />
      {/* Top shimmer line */}
      <LinearGradient
        colors={['transparent', 'rgba(34,197,94,0.25)', 'rgba(74,222,128,0.18)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 1 }}
      />
    </View>
  );
};

// ── Animated tab icon with spring scale + glowing pill + ripple ──
const AnimatedTabIcon = ({ name, size, color, focused, glowColor }) => {
  const scaleAnim     = useRef(new Animated.Value(focused ? 1.2  : 1)).current;
  const pillScale     = useRef(new Animated.Value(focused ? 1    : 0.2)).current;
  const pillOpacity   = useRef(new Animated.Value(focused ? 1    : 0)).current;
  const rippleScale   = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const prevFocused   = useRef(focused);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.22 : 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 16,
      }),
      Animated.spring(pillScale, {
        toValue: focused ? 1 : 0.2,
        useNativeDriver: true,
        speed: 20,
        bounciness: 12,
      }),
      Animated.timing(pillOpacity, {
        toValue: focused ? 1 : 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();

    // Ripple + haptic solo al activarse (no en el render inicial)
    if (focused && !prevFocused.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      rippleScale.setValue(0);
      rippleOpacity.setValue(0.45);
      Animated.parallel([
        Animated.timing(rippleScale,   { toValue: 1.6, duration: 450, useNativeDriver: true }),
        Animated.timing(rippleOpacity, { toValue: 0,   duration: 450, useNativeDriver: true }),
      ]).start();
    }
    prevFocused.current = focused;
  }, [focused]);

  const gc = glowColor || color;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', justifyContent: 'center', width: 48, height: 38 }}>
      {/* Ripple ink effect */}
      <Animated.View style={{
        position: 'absolute',
        width: 46, height: 36,
        borderRadius: 18,
        backgroundColor: gc,
        transform: [{ scale: rippleScale }],
        opacity: rippleOpacity,
      }} />
      {/* Glowing pill background */}
      <Animated.View style={{
        position: 'absolute',
        width: 46, height: 36,
        borderRadius: 18,
        backgroundColor: gc + '1e',
        borderWidth: 1,
        borderColor: gc + '45',
        transform: [{ scale: pillScale }],
        opacity: pillOpacity,
        shadowColor: gc,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 12,
      }} />
      <Ionicons name={name} size={size} color={color} />
      {/* Glowing dot below */}
      {focused && (
        <View style={{
          position: 'absolute', bottom: -4, width: 4, height: 4, borderRadius: 2,
          backgroundColor: gc,
          shadowColor: gc,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1, shadowRadius: 6,
        }} />
      )}
    </Animated.View>
  );
};

import { useAuth }  from '../contexts/AuthContext';
import { usePedidosMonitor } from '../hooks';
import { LoadingScreen } from '../components/common/Loading';
import OfflineBanner      from '../components/common/OfflineBanner';
import FloatingAssistant  from '../components/common/FloatingAssistant';
import useOffline         from '../hooks/useOffline';

// ── Auth ──────────────────────────────────────────────────────
import LoginScreen          from '../screens/auth/LoginScreen';
import OnboardingScreen     from '../screens/auth/OnboardingScreen';
import RegistroScreen       from '../screens/auth/RegistroScreen';

// ── Productor ─────────────────────────────────────────────────
import HomeScreen           from '../screens/producer/HomeScreen';
import DevicesScreen        from '../screens/producer/DevicesScreen';
import OrdersScreen         from '../screens/producer/OrdersScreen';
import ProfileScreen        from '../screens/producer/ProfileScreen';
import InventarioScreen     from '../screens/producer/InventarioScreen';
import MonitoringScreen     from '../screens/producer/MonitoringScreen';
import NotificacionesScreen from '../screens/producer/NotificacionesScreen';
import EstadisticasScreen   from '../screens/producer/EstadisticasScreen';
import GaleriaProductorScreen from '../screens/producer/GaleriaProductorScreen';
import CalendarioScreen       from '../screens/producer/CalendarioScreen';
import ReservasProductorScreen from '../screens/producer/ReservasScreen';

// ── Consumidor ────────────────────────────────────────────────
import HomeScreenConsumer    from '../screens/consumer/HomeScreenConsumer';
import TiendaScreen          from '../screens/consumer/TiendaScreen';
import ProductoresScreen     from '../screens/consumer/ProductoresScreen';
import CarritoScreen         from '../screens/consumer/CarritoScreen';
import PerfilScreen          from '../screens/consumer/PerfilScreen';
import MisPedidosScreen      from '../screens/consumer/MisPedidosScreen';
import AyudaScreen           from '../screens/consumer/AyudaScreen';
import DetalleProductorScreen from '../screens/consumer/DetalleProductorScreen';
import PagoQRScreen          from '../screens/consumer/PagoQRScreen';
import DetalleProductoScreen from '../screens/consumer/DetalleProductoScreen';
import BusquedaScreen        from '../screens/consumer/BusquedaScreen';
import ReseñasScreen         from '../screens/consumer/ReseñasScreen';
import TrazabilidadScreen    from '../screens/consumer/TrazabilidadScreen';
import FavoritosScreen       from '../screens/consumer/FavoritosScreen';
import MisReservasScreen     from '../screens/consumer/MisReservasScreen';
import MapaProductoresScreen    from '../screens/consumer/MapaProductoresScreen';
import AnalizarFrescuraScreen  from '../screens/consumer/AnalizarFrescuraScreen';

// ── Common ────────────────────────────────────────────────────
import ChatScreen              from '../screens/common/ChatScreen';
import ConversacionesScreen    from '../screens/common/ConversacionesScreen';

// ── Repartidor ────────────────────────────────────────────────
import RepartidorScreen     from '../screens/driver/RepartidorScreen';
import TrackingPedidoScreen from '../screens/driver/TrackingPedidoScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ============================================================
// TABS — PRODUCTOR (5 tabs — Monitoreo restaurado)
// ============================================================
const ProducerTabs = () => {
  const { colors, isDarkMode } = useTheme();
  const { stats }  = usePedidosMonitor(true);
  const pendientes = stats?.pendientes || 0;

  const iconMap = {
    Home:       { active: 'home',          inactive: 'home-outline',          glow: '#22C55E' },
    Orders:     { active: 'receipt',       inactive: 'receipt-outline',       glow: '#fb923c' },
    Inventario: { active: 'cube',          inactive: 'cube-outline',          glow: '#4ade80' },
    Devices:    { active: 'hardware-chip', inactive: 'hardware-chip-outline', glow: '#10b981' },
    Profile:    { active: 'person',        inactive: 'person-outline',        glow: '#c084fc' },
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 12,
          right: 12,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(34,197,94,0.18)' : colors.border,
          borderRadius: 28,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          shadowColor: isDarkMode ? '#22C55E' : '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.2 : 0.08,
          shadowRadius: 20,
          elevation: 20,
        },
        tabBarActiveTintColor:   colors.secondary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color }) => {
          const cfg   = iconMap[route.name] || { active: 'ellipse', inactive: 'ellipse', glow: '#22C55E' };
          const icon  = focused ? cfg.active : cfg.inactive;
          const badge = route.name === 'Orders' ? pendientes : 0;
          return (
            <View>
              <AnimatedTabIcon name={icon} size={23} color={color} focused={focused} glowColor={cfg.glow} />
              {badge > 0 && (
                <View style={[styles.tabBadge, styles.tabBadgeOrders]}>
                  <Text style={styles.tabBadgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home"       component={HomeScreen}       options={{ tabBarLabel: 'Inicio'     }} />
      <Tab.Screen name="Orders"     component={OrdersScreen}     options={{ tabBarLabel: 'Pedidos'    }} />
      <Tab.Screen name="Inventario" component={InventarioScreen} options={{ tabBarLabel: 'Inventario' }} />
      <Tab.Screen name="Devices"    component={DevicesScreen}    options={{ tabBarLabel: 'Monitoreo'  }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}    options={{ tabBarLabel: 'Perfil'     }} />
    </Tab.Navigator>
  );
};

// ============================================================
// TABS — CONSUMIDOR (5 tabs — Favoritos reemplaza Productores)
// ============================================================
const ConsumerTabs = () => {
  const { colors, isDarkMode } = useTheme();
  const { count: cartCount } = useCarrito();
  const iconMap = {
    Inicio:      { active: 'home',       inactive: 'home-outline',       glow: '#22C55E' },
    Tienda:      { active: 'storefront', inactive: 'storefront-outline', glow: '#4ade80' },
    Reservas:    { active: 'calendar',   inactive: 'calendar-outline',   glow: '#4ade80' },
    Carrito:     { active: 'cart',       inactive: 'cart-outline',       glow: '#fb923c' },
    Perfil:      { active: 'person',     inactive: 'person-outline',     glow: '#c084fc' },
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 12,
          right: 12,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(34,197,94,0.15)' : colors.border,
          borderRadius: 28,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          shadowColor: isDarkMode ? '#22C55E' : '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.18 : 0.08,
          shadowRadius: 20,
          elevation: 20,
        },
        tabBarActiveTintColor:   colors.secondary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color }) => {
          const cfg  = iconMap[route.name] || { active: 'ellipse', inactive: 'ellipse', glow: '#22C55E' };
          const icon = focused ? cfg.active : cfg.inactive;
          const badge = route.name === 'Carrito' ? cartCount : 0;
          return (
            <View>
              <AnimatedTabIcon name={icon} size={23} color={color} focused={focused} glowColor={cfg.glow} />
              {badge > 0 && (
                <View style={[styles.tabBadge, styles.tabBadgeOrders]}>
                  <Text style={styles.tabBadgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Inicio"    component={HomeScreenConsumer}  options={{ tabBarLabel: 'Inicio'    }} />
      <Tab.Screen name="Tienda"    component={TiendaScreen}        options={{ tabBarLabel: 'Tienda'    }} />
      <Tab.Screen name="Reservas"  component={MisReservasScreen}   options={{ tabBarLabel: 'Reservas'  }} />
      <Tab.Screen name="Carrito"   component={CarritoScreen}       options={{ tabBarLabel: 'Carrito'   }} />
      <Tab.Screen name="Perfil"    component={PerfilScreen}        options={{ tabBarLabel: 'Perfil'    }} />
    </Tab.Navigator>
  );
};

// ============================================================
// TABS — REPARTIDOR
// ============================================================
const RepartidorTabs = () => {
  const { colors, isDarkMode } = useTheme();
  return (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarBackground: () => <TabBarBackground />,
      tabBarStyle: {
        position: 'absolute',
        bottom: 16,
        left: 12,
        right: 12,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        borderWidth: 1,
        borderColor: isDarkMode ? 'rgba(34,197,94,0.15)' : colors.border,
        borderRadius: 28,
        height: 72,
        paddingBottom: 12,
        paddingTop: 8,
        shadowColor: isDarkMode ? '#22C55E' : '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDarkMode ? 0.18 : 0.08,
        shadowRadius: 20,
        elevation: 20,
      },
      tabBarActiveTintColor:   colors.secondary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarIcon: ({ focused, color }) => (
        <AnimatedTabIcon name={focused ? 'bicycle' : 'bicycle-outline'} size={23} color={color} focused={focused} glowColor="#22C55E" />
      ),
    })}
  >
    <Tab.Screen name="Entregas" component={RepartidorScreen} options={{ tabBarLabel: 'Entregas' }} />
  </Tab.Navigator>
  );
};

// ============================================================
// STACKS
// ============================================================
// Shared transition presets
const slideRight  = { animation: 'slide_from_right',  animationDuration: 280 };
const slideUp     = { animation: 'slide_from_bottom', animationDuration: 320 };
const fadeSlide   = { animation: 'fade_from_bottom',  animationDuration: 340 };

const ConsumerStack = () => (
  <View style={{ flex: 1 }}>
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 280 }}>
      <Stack.Screen name="ConsumerTabs"     component={ConsumerTabs}           options={{ animation: 'none' }} />
      <Stack.Screen name="DetalleProductor" component={DetalleProductorScreen} options={slideUp}    />
      <Stack.Screen name="DetalleProducto"  component={DetalleProductoScreen}  options={slideUp}    />
      <Stack.Screen name="PagoQR"           component={PagoQRScreen}           options={slideUp}    />
      <Stack.Screen name="Chat"             component={ChatScreen}             options={slideUp}    />
      <Stack.Screen name="Conversaciones"   component={ConversacionesScreen}   options={slideRight} />
      <Stack.Screen name="MisPedidos"       component={MisPedidosScreen}       options={slideRight} />
      <Stack.Screen name="MisReservas"      component={MisReservasScreen}      options={slideRight} />
      <Stack.Screen name="Ayuda"            component={AyudaScreen}            options={slideRight} />
      <Stack.Screen name="TrackingPedido"   component={TrackingPedidoScreen}   options={slideRight} />
      <Stack.Screen name="Busqueda"         component={BusquedaScreen}         options={fadeSlide}  />
      <Stack.Screen name="Reseñas"          component={ReseñasScreen}          options={slideRight} />
      <Stack.Screen name="Trazabilidad"     component={TrazabilidadScreen}     options={slideRight} />
      <Stack.Screen name="Productores"      component={ProductoresScreen}      options={slideRight} />
      <Stack.Screen name="MapaProductores"  component={MapaProductoresScreen}  options={slideUp}    />
      <Stack.Screen name="AnalizarFrescura" component={AnalizarFrescuraScreen} options={slideRight} />
    </Stack.Navigator>
    <FloatingAssistant rol="consumidor" />
  </View>
);

const ProducerStack = () => (
  <View style={{ flex: 1 }}>
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 280 }}>
      <Stack.Screen name="ProducerTabs"     component={ProducerTabs}           options={{ animation: 'none' }} />
      <Stack.Screen name="Monitoring"       component={MonitoringScreen}       options={slideUp}    />
      <Stack.Screen name="Estadisticas"     component={EstadisticasScreen}     options={slideUp}    />
      <Stack.Screen name="GaleriaProductor" component={GaleriaProductorScreen} options={slideRight} />
      <Stack.Screen name="Notificaciones"   component={NotificacionesScreen}   options={slideRight} />
      <Stack.Screen name="Calendario"       component={CalendarioScreen}       options={slideRight} />
      <Stack.Screen name="ReservasProductor" component={ReservasProductorScreen} options={slideRight} />
      <Stack.Screen name="Chat"             component={ChatScreen}             options={slideUp}    />
      <Stack.Screen name="Conversaciones"   component={ConversacionesScreen}   options={slideRight} />
    </Stack.Navigator>
    <FloatingAssistant rol="productor" />
  </View>
);

const RepartidorStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 280 }}>
    <Stack.Screen name="RepartidorTabs" component={RepartidorTabs}       options={{ animation: 'none' }} />
    <Stack.Screen name="TrackingPedido" component={TrackingPedidoScreen} options={slideUp} />
  </Stack.Navigator>
);

// ============================================================
// APP NAVIGATOR PRINCIPAL
// ============================================================
const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const isOffline = useOffline();

  const [onboardingDone, setOnboardingDone] = React.useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem('onboarding_done')
      .then(v => setOnboardingDone(!!v))
      .catch(() => setOnboardingDone(true));
  }, []);

  const userRole = user?.rol || user?.role || 'consumidor';

  const navigationTheme = {
    dark: isDarkMode,
    colors: {
      primary:      colors.primary,
      background:   colors.background,
      card:         colors.surface,
      text:         colors.text,
      border:       colors.border,
      notification: colors.error,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium:  { fontFamily: 'System', fontWeight: '500' },
      bold:    { fontFamily: 'System', fontWeight: '700' },
      heavy:   { fontFamily: 'System', fontWeight: '900' },
    },
  };

  if (isLoading || onboardingDone === null) {
    return <LoadingScreen message="Verificando sesión..." />;
  }

  return (
    <View style={{ flex: 1 }}>
    <OfflineBanner visible={isOffline} />
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 300 }}>
        {isAuthenticated ? (
          userRole === 'productor' ? (
            <Stack.Screen name="ProducerApp"   component={ProducerStack}   />
          ) : userRole === 'repartidor' ? (
            <Stack.Screen name="RepartidorApp" component={RepartidorStack} />
          ) : (
            <Stack.Screen name="ConsumerApp"   component={ConsumerStack}   />
          )
        ) : !onboardingDone ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'none' }} />
            <Stack.Screen name="Login"      component={LoginScreen}      options={{ animation: 'slide_from_right', animationDuration: 280 }} />
            <Stack.Screen name="Registro"   component={RegistroScreen}   options={{ animation: 'slide_from_right', animationDuration: 280 }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login"    component={LoginScreen}    options={{ animation: 'none' }} />
            <Stack.Screen name="Registro" component={RegistroScreen} options={{ animation: 'slide_from_right', animationDuration: 280 }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarLabel:    { fontSize: 10, fontWeight: '500' },
  tabBadge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: '#ef4444', borderRadius: 8,
    minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  tabBadgeOrders: { backgroundColor: '#f59e0b' },
  tabBadgeText:   { color: '#fff', fontSize: 9, fontWeight: 'bold' },
});

export default AppNavigator;