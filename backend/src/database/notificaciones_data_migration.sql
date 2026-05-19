-- MIGRACIÓN: agregar columna `data` (JSONB) a la tabla notificaciones
-- Necesaria para guardar payload extra de cada notificación (ej. reserva_id, pedido_id).
-- Ejecutar una sola vez en la base de datos.

ALTER TABLE notificaciones
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
