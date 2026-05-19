// src/middlewares/upload.middleware.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    // Detectar tipo de upload por ruta
    const isPerfil = req.originalUrl?.includes('foto-perfil');
    const isPortada = req.originalUrl?.includes('foto-portada');
    const isProducto     = req.originalUrl?.includes('/productos');
    const isComprobante  = req.originalUrl?.includes('comprobante');
    const folder = isPerfil || isPortada ? 'naturapiscis/fotos'
      : isProducto     ? 'naturapiscis/productos'
      : isComprobante  ? 'naturapiscis/comprobantes'
      : 'naturapiscis/galeria';
    const size = isPerfil ? 400 : isPortada ? 1920 : isProducto ? 800 : 1280;
    return {
      folder,
      resource_type:  isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi'],
      transformation: isVideo
        ? [{ quality: 'auto' }]
        : [{ quality: 'auto', fetch_format: 'auto', width: size, crop: 'limit' }],
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido. Usa JPG, PNG, WEBP, MP4 o MOV.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máx
});

module.exports = upload;
