// src/navigation/ConsumerNavigator.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreenConsumer from '../screens/consumer/HomeScreenConsumer';
import TiendaScreen from '../screens/consumer/TiendaScreen';
import ProductoresScreen from '../screens/consumer/ProductoresScreen';
import CarritoScreen from '../screens/consumer/CarritoScreen';
import PerfilScreen from '../screens/consumer/PerfilScreen';
import MisPedidosScreen from '../screens/consumer/MisPedidosScreen';
import AyudaScreen from '../screens/consumer/AyudaScreen';
import DetalleProductorScreen from '../screens/consumer/DetalleProductorScreen';
import AnalizarFrescuraScreen from '../screens/consumer/AnalizarFrescuraScreen';
// import DetalleProductoScreen from '../screens/consumer/DetalleProductoScreen'; // Crear cuando sea necesario

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack Navigator para Tienda (con pantallas de detalle)
const TiendaStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TiendaMain" component={TiendaScreen} />
    <Stack.Screen name="DetalleProductor" component={DetalleProductorScreen} />
    {/* <Stack.Screen name="DetalleProducto" component={DetalleProductoScreen} /> */}
  </Stack.Navigator>
);

// Stack Navigator para Productores
const ProductoresStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProductoresMain" component={ProductoresScreen} />
    <Stack.Screen name="DetalleProductor" component={DetalleProductorScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Perfil (con subpantallas)
const PerfilStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PerfilMain" component={PerfilScreen} />
    <Stack.Screen name="MisPedidos" component={MisPedidosScreen} />
    <Stack.Screen name="Ayuda" component={AyudaScreen} />
  </Stack.Navigator>
);

// Tab Navigator principal
const ConsumerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Inicio') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Tienda') {
          iconName = focused ? 'storefront' : 'storefront-outline';
        } else if (route.name === 'Productores') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'Carrito') {
          iconName = focused ? 'cart' : 'cart-outline';
        } else if (route.name === 'Perfil') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#3B82F6',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 8,
        paddingBottom: 8,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '500',
      },
    })}
  >
    <Tab.Screen name="Inicio" component={HomeScreenConsumer} />
    <Tab.Screen name="Tienda" component={TiendaStack} />
    <Tab.Screen name="Productores" component={ProductoresStack} />
    <Tab.Screen name="Carrito" component={CarritoScreen} />
    <Tab.Screen name="Perfil" component={PerfilStack} />
  </Tab.Navigator>
);

// Main Consumer Navigator
const ConsumerNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ConsumerTabs" component={ConsumerTabs} />
    {/* Pantallas modales o de navegación global */}
    <Stack.Screen
      name="DetalleProducto"
      component={DetalleProductorScreen}
      options={{ presentation: 'modal' }}
    />
    <Stack.Screen name="AnalizarFrescura" component={AnalizarFrescuraScreen} />
  </Stack.Navigator>
);

export default ConsumerNavigator;