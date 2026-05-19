// ============================================
// src/config/firebaseAdmin.js
// ============================================
const admin = require('firebase-admin');
const logger = require('../utils/logger');

let db = null;

const initFirebase = () => {
  if (admin.apps.length > 0) return admin.app();

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    const appConfig = {
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://examen-ac07b-default-rtdb.firebaseio.com',
    };

    if (serviceAccount) {
      appConfig.credential = admin.credential.cert(serviceAccount);
    } else {
      // Modo sin credencial: solo funciona si las reglas de Firebase son públicas
      appConfig.credential = admin.credential.applicationDefault();
    }

    admin.initializeApp(appConfig);
    db = admin.database();
    logger.info('✅ Firebase Admin inicializado correctamente');
    return admin.app();
  } catch (error) {
    logger.error('❌ Error al inicializar Firebase Admin:', error.message);
    throw error;
  }
};

const getDatabase = () => {
  if (!db) initFirebase();
  return db;
};

module.exports = { initFirebase, getDatabase };
