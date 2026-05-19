-- MIGRACIÓN: QR de pago por productor + código de dispositivo IoT
-- Ejecutar una sola vez en la base de datos

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS qr_pago_url VARCHAR(500);

ALTER TABLE lagunas
  ADD COLUMN IF NOT EXISTS codigo_dispositivo VARCHAR(20) UNIQUE;
