import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { subscribeToLaguna, AUTOMATION_RULES } from '../config/firebase';
import axios from 'axios';
import { API_URL } from '../config';

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function useNotificaciones(token, navigationRef) {
  const [permiso, setPermiso] = useState(false);
  const [ultimaAlerta, setUltimaAlerta] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registrarNotificaciones();

    // Escuchar datos de laguna1
    const unsubscribe = subscribeToLaguna('laguna1', (data) => {
      if (data) verificarAlertas(data);
    });

    // Listener: notificación recibida con app abierta
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notificación recibida:', notification);
    });

    // ✅ Listener: usuario TOCA la notificación → navegar al tracking
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('👆 Notificación tocada:', data);

      // Si es notificación de pedido y tenemos navigationRef, navegar
      if (data?.navegarA === 'TrackingPedido' && data?.pedidoId && navigationRef?.current) {
        navigationRef.current.navigate('TrackingPedido', {
          pedidoId: data.pedidoId,
        });
      }
    });

    return () => {
      unsubscribe();
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  const registrarNotificaciones = async () => {
    if (!Device.isDevice) {
      console.log('⚠️ Notificaciones solo funcionan en dispositivo físico');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permiso de notificaciones denegado');
      setPermiso(false);
      return;
    }

    setPermiso(true);
    console.log('✅ Notificaciones activadas');

    // Canal para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alertas', {
        name: 'Alertas NaturaPiscis',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
        sound: 'default',
      });

      // ✅ Canal para pedidos
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Pedidos NaturaPiscis',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }

    // ✅ Obtener Expo Push Token y enviarlo al backend
    await registrarPushToken();
  };

  // ✅ Obtiene el token y lo guarda en el backend
  const registrarPushToken = async () => {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId
        ?? Constants.easConfig?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const expoPushToken = tokenData.data;

      console.log('📱 Expo Push Token:', expoPushToken);

      // Enviar al backend solo si hay sesión activa
      if (token) {
        await axios.post(
          `${API_URL}/api/repartidor/push-token`,
          { token: expoPushToken },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Push token guardado en backend');
      }
    } catch (error) {
      console.log('⚠️ Error registrando push token:', error.message);
    }
  };

  const verificarAlertas = (data) => {
    const ahora = Date.now();

    if (ultimaAlerta && (ahora - ultimaAlerta) < 30000) return;

    if (AUTOMATION_RULES.temperaturaAlta.condition(data)) {
      enviarNotificacion(
        '🌡️ ¡ALERTA Temperatura!',
        `Laguna 1: ${data.temperatura}°C - Temperatura crítica para los peces`
      );
      setUltimaAlerta(ahora);
      return;
    }

    if (AUTOMATION_RULES.phFueraRango.condition(data)) {
      enviarNotificacion(
        '⚗️ pH Anormal',
        `Laguna 1: pH ${data.ph} - Fuera del rango óptimo`
      );
      setUltimaAlerta(ahora);
      return;
    }

    if (AUTOMATION_RULES.turbidezAlta.condition(data)) {
      enviarNotificacion(
        '💧 Agua Turbia',
        `Laguna 1: ${data.turbidez} NTU - Considere tratar el agua`
      );
      setUltimaAlerta(ahora);
      return;
    }
  };

  const enviarNotificacion = async (titulo, mensaje) => {
    console.log('🚨 Enviando notificación:', titulo);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: mensaje,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  };

  return { permiso, enviarNotificacion };
}