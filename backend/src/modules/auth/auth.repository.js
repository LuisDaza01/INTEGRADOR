// ============================================
// src/modules/auth/auth.repository.js - ACCESO A DATOS
// ============================================
// Este archivo maneja TODAS las queries SQL del módulo Auth
// Basado en las tablas del schema.sql viejo

const db = require('../../config/database');
const logger = require('../../utils/logger');

// ============================================
// QUERIES DE CONSULTA (SELECT)
// ============================================

/**
 * Buscar usuario por email
 * 
 * @param {string} email - Email del usuario
 * @returns {Promise<Object|null>} Usuario o null
 */
const findByEmail = async (email) => {
  const query = `
    SELECT 
      u.id,
      u.nombre,
      u.email,
      u.password,
      u.rol_id,
      u.foto_perfil,
      u.telefono,
      u.activo,
      u.verificado,
      r.nombre as rol_nombre
    FROM usuarios u
    LEFT JOIN roles r ON u.rol_id = r.id
    WHERE u.email = $1
  `;
  
  const result = await db.query(query, [email]);
  
  return result.length > 0 ? result[0] : null;
};

/**
 * Buscar usuario por ID
 * 
 * @param {number} id - ID del usuario
 * @returns {Promise<Object|null>} Usuario o null
 */
const findById = async (id) => {
  const query = `
    SELECT 
      u.id,
      u.nombre,
      u.email,
      u.rol_id,
      u.foto_perfil,
      u.telefono,
      u.activo,
      u.verificado,
      r.nombre as rol_nombre
    FROM usuarios u
    LEFT JOIN roles r ON u.rol_id = r.id
    WHERE u.id = $1
  `;
  
  const result = await db.query(query, [id]);
  
  return result.length > 0 ? result[0] : null;
};

// ============================================
// QUERIES DE MODIFICACIÓN (INSERT, UPDATE)
// ============================================

/**
 * Crear un nuevo usuario
 * 
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} Usuario creado
 */
const create = async (userData) => {
  const { nombre, email, password, telefono, rol_id } = userData;
  
  const query = `
    INSERT INTO usuarios (
      nombre,
      email,
      password,
      telefono,
      rol_id,
      fecha_registro,
      activo,
      verificado
    ) VALUES ($1, $2, $3, $4, $5, NOW(), TRUE, FALSE)
    RETURNING id, nombre, email, rol_id, fecha_registro
  `;
  
  const params = [nombre, email, password, telefono || null, rol_id];
  
  const result = await db.query(query, params);
  
  logger.debug('Usuario creado en BD', {
    userId: result[0].id,
    email
  });
  
  return result[0];
};

/**
 * Crear preferencias por defecto para un usuario
 * 
 * @param {number} userId - ID del usuario
 * @returns {Promise<void>}
 */
const createPreferencias = async (userId) => {
  const query = `
    INSERT INTO preferencias_usuario (
      usuario_id,
      notificaciones_email,
      notificaciones_push,
      notificaciones_sms,
      boletin_noticias,
      ofertas
    ) VALUES ($1, TRUE, TRUE, FALSE, TRUE, TRUE)
  `;
  
  await db.query(query, [userId]);
  
  logger.debug('Preferencias creadas', { userId });
};

/**
 * Registrar dispositivo conectado
 * 
 * @param {Object} deviceData - Datos del dispositivo
 * @returns {Promise<void>}
 */
const registrarDispositivo = async (deviceData) => {
  const { usuario_id, nombre, ubicacion } = deviceData;
  
  const query = `
    INSERT INTO dispositivos_conectados (
      usuario_id,
      nombre,
      ubicacion,
      ultimo_acceso
    ) VALUES ($1, $2, $3, NOW())
  `;
  
  await db.query(query, [usuario_id, nombre, ubicacion]);
  
  logger.debug('Dispositivo registrado', { usuario_id });
};

/**
 * Actualizar último acceso de un dispositivo
 * 
 * @param {number} userId - ID del usuario
 * @param {string} deviceName - Nombre del dispositivo (user agent)
 * @returns {Promise<void>}
 */
const actualizarUltimoAcceso = async (userId, deviceName) => {
  const query = `
    UPDATE dispositivos_conectados
    SET ultimo_acceso = NOW()
    WHERE usuario_id = $1 
      AND nombre = $2
    ORDER BY ultimo_acceso DESC
    LIMIT 1
  `;
  
  await db.query(query, [userId, deviceName]);
  
  logger.debug('Último acceso actualizado', { userId });
};

/**
 * Actualizar último acceso del usuario
 * 
 * @param {number} userId - ID del usuario
 * @returns {Promise<void>}
 */
const actualizarUltimoAccesoUsuario = async (userId) => {
  const query = `
    UPDATE usuarios
    SET ultimo_acceso = NOW()
    WHERE id = $1
  `;
  
  await db.query(query, [userId]);
};

// ============================================
// VERIFICACIONES Y VALIDACIONES
// ============================================

/**
 * Verificar si un email ya está registrado
 * 
 * @param {string} email - Email a verificar
 * @returns {Promise<boolean>}
 */
const emailExists = async (email) => {
  const query = 'SELECT id FROM usuarios WHERE email = $1';
  const result = await db.query(query, [email]);
  
  return result.length > 0;
};

/**
 * Verificar si un usuario está activo
 * 
 * @param {number} userId - ID del usuario
 * @returns {Promise<boolean>}
 */
const isUserActive = async (userId) => {
  const query = 'SELECT activo FROM usuarios WHERE id = $1';
  const result = await db.query(query, [userId]);
  
  return result.length > 0 && result[0].activo === true;
};

/**
 * Obtener rol de un usuario
 * 
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object|null>} { rol_id, rol_nombre }
 */
const getUserRole = async (userId) => {
  const query = `
    SELECT 
      u.rol_id,
      r.nombre as rol_nombre
    FROM usuarios u
    LEFT JOIN roles r ON u.rol_id = r.id
    WHERE u.id = $1
  `;
  
  const result = await db.query(query, [userId]);
  
  return result.length > 0 ? result[0] : null;
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================

const findByIdWithPassword = async (id) => {
  const query = `SELECT id, nombre, email, password, rol_id FROM usuarios WHERE id = $1`;
  const result = await db.query(query, [id]);
  return result.length > 0 ? result[0] : null;
};

const findOrCreateGoogleUser = async ({ email, nombre, foto_perfil }) => {
  const existing = await findByEmail(email);
  if (existing) return { user: existing, created: false };

  const query = `
    INSERT INTO usuarios (nombre, email, password, rol_id, foto_perfil, fecha_registro, activo, verificado)
    VALUES ($1, $2, 'GOOGLE_OAUTH_NO_PASSWORD', 3, $3, NOW(), TRUE, TRUE)
    RETURNING id, nombre, email, rol_id, foto_perfil
  `;
  const result = await db.query(query, [nombre, email, foto_perfil || null]);
  logger.debug('Usuario Google creado en BD', { email });
  return { user: result[0], created: true };
};

module.exports = {
  // Consultas
  findByEmail,
  findById,
  findByIdWithPassword,
  findOrCreateGoogleUser,

  // Creación
  create,
  createPreferencias,
  registrarDispositivo,
  
  // Actualizaciones
  actualizarUltimoAcceso,
  actualizarUltimoAccesoUsuario,
  
  // Verificaciones
  emailExists,
  isUserActive,
  getUserRole
};