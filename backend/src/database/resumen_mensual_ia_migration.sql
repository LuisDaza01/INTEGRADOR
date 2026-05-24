-- MIGRACIÓN: Resumen mensual IA del productor (Dashboard)
-- Ejecutar una sola vez. Guarda el último resumen generado por Claude + cuándo se generó.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS resumen_mensual_ia  TEXT,
  ADD COLUMN IF NOT EXISTS resumen_mensual_at  TIMESTAMP;
