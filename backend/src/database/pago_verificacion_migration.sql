-- MIGRACIÓN: Verificación de pago por el productor
-- Ejecutar una sola vez. El productor revisa el comprobante QR y marca el pago como verificado.

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS pago_verificado BOOLEAN DEFAULT false;
