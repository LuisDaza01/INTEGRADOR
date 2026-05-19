// src/utils/pushNotification.js
let expoInstance = null;
let ExpoClass = null;

const getExpo = async () => {
  if (!expoInstance) {
    const mod = await import('expo-server-sdk');
    ExpoClass = mod.Expo;
    expoInstance = new ExpoClass();
  }
  return { expo: expoInstance, Expo: ExpoClass };
};

const sendPushNotification = async (pushToken, { title, body, data = {} }) => {
  try {
    const { expo, Expo } = await getExpo();
    if (!pushToken || !Expo.isExpoPushToken(pushToken)) return;

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
    console.error('⚠️  pushNotification error:', error.message);
  }
};

module.exports = { sendPushNotification };
