// src/utils/pushNotification.js
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

/**
 * Envía una notificación push a un token de Expo.
 * Si el token es inválido o está vacío, no hace nada (silent fail).
 */
const sendPushNotification = async (pushToken, { title, body, data = {} }) => {
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) return;

  try {
    const chunks = expo.chunkPushNotifications([{
      to:    pushToken,
      sound: 'default',
      title,
      body,
      data,
      channelId: 'default',
    }]);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    // No propagar el error — las notificaciones son opcionales
    console.error('⚠️  pushNotification error:', error.message);
  }
};

module.exports = { sendPushNotification };
