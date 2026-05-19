// ============================================
// src/constants/roles.js - ROLES Y PERMISOS
// ============================================

const ROLES = {
  ADMIN: 'admin',
  PRODUCTOR: 'productor',
  CONSUMIDOR: 'consumidor',
  REPARTIDOR: 'repartidor',  // ✅ AGREGADO
};

const ROLE_IDS = {
  ADMIN: 1,
  PRODUCTOR: 2,
  CONSUMIDOR: 3,
  REPARTIDOR: 4,  // ✅ AGREGADO
};

const ROLE_ID_TO_NAME = {
  1: ROLES.ADMIN,
  2: ROLES.PRODUCTOR,
  3: ROLES.CONSUMIDOR,
  4: ROLES.REPARTIDOR,  // ✅ AGREGADO
};

const ROLE_PERMISSIONS = {

  // ==========================================
  // ADMIN - Acceso total al sistema
  // ==========================================
  [ROLES.ADMIN]: [
    'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage_all',
    'products:read', 'products:create', 'products:update', 'products:delete', 'products:manage_all',
    'producers:read', 'producers:create', 'producers:update', 'producers:delete', 'producers:manage',
    'orders:read', 'orders:create', 'orders:update', 'orders:delete', 'orders:manage_all',
    'categories:read', 'categories:create', 'categories:update', 'categories:delete',
    'sensors:read', 'sensors:create', 'sensors:update', 'sensors:delete', 'sensors:manage_all',
    'ponds:read', 'ponds:create', 'ponds:update', 'ponds:delete', 'ponds:manage_all',
    'alerts:read', 'alerts:update', 'alerts:delete', 'alerts:manage_all',
    'analytics:view', 'analytics:export', 'reports:generate',
    'system:manage', 'logs:view', 'settings:update'
  ],

  // ==========================================
  // PRODUCTOR - Gestiona sus productos y estanques
  // ==========================================
  [ROLES.PRODUCTOR]: [
    'products:read', 'products:create_own', 'products:update_own', 'products:delete_own',
    'orders:read_own', 'orders:update_own',
    'categories:read',
    'profile:read_own', 'profile:update_own',
    'sensors:read_own', 'sensors:create_own', 'sensors:update_own', 'sensors:delete_own',
    'ponds:read_own', 'ponds:create_own', 'ponds:update_own', 'ponds:delete_own',
    'alerts:read_own', 'alerts:update_own',
    'sensor_data:read_own', 'sensor_data:create_own',
    'analytics:view_own', 'reports:view_own',
    'reviews:read',
    'certifications:read_own', 'certifications:create_own', 'certifications:update_own',
    'notifications:read_own', 'notifications:update_own'
  ],

  // ==========================================
  // CONSUMIDOR - Compra productos
  // ==========================================
  [ROLES.CONSUMIDOR]: [
    'products:read',
    'categories:read',
    'cart:read_own', 'cart:create_own', 'cart:update_own', 'cart:delete_own',
    'orders:read_own', 'orders:create_own', 'orders:cancel_own',
    'profile:read_own', 'profile:update_own',
    'reviews:read', 'reviews:create_own', 'reviews:update_own', 'reviews:delete_own',
    'producers:read',
    'notifications:read_own', 'notifications:update_own', 'notifications:delete_own',
    'addresses:read_own', 'addresses:create_own', 'addresses:update_own', 'addresses:delete_own',
    'payment_methods:read_own', 'payment_methods:create_own', 'payment_methods:delete_own'
  ],

  // ==========================================
  // REPARTIDOR - Gestiona entregas  ✅ AGREGADO
  // ==========================================
  [ROLES.REPARTIDOR]: [
    'orders:read',
    'orders:update_own',
    'deliveries:read_own',
    'deliveries:update_own',
    'profile:read_own',
    'profile:update_own',
    'notifications:read_own',
    'notifications:update_own'
  ],
};

// ============================================
// FUNCIONES HELPER
// ============================================

const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

const canAccess = (role, resource, action, isOwn = false) => {
  const permission = isOwn
    ? `${resource}:${action}_own`
    : `${resource}:${action}`;

  if (hasPermission(role, permission)) return true;
  if (hasPermission(role, `${resource}:manage_all`)) return true;
  return false;
};

const getRoleById = (roleId) => {
  return ROLE_ID_TO_NAME[roleId] || null;
};

const getRoleId = (roleName) => {
  const normalizedName = roleName.toUpperCase();
  return ROLE_IDS[normalizedName] || null;
};

const getPermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

const isAdmin = (role) => role === ROLES.ADMIN;
const isProductor = (role) => role === ROLES.PRODUCTOR;
const isConsumidor = (role) => role === ROLES.CONSUMIDOR;
const isRepartidor = (role) => role === ROLES.REPARTIDOR;  // ✅ AGREGADO

module.exports = {
  ROLES,
  ROLE_IDS,
  ROLE_ID_TO_NAME,
  ROLE_PERMISSIONS,
  hasPermission,
  canAccess,
  getRoleById,
  getRoleId,
  getPermissions,
  isAdmin,
  isProductor,
  isConsumidor,
  isRepartidor,  // ✅ AGREGADO
};