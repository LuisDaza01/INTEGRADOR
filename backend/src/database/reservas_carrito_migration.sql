-- MIGRACIÓN: Reservas tipo carrito (multi-ítem) + código de reserva (tipo BoA)
-- Ejecutar una sola vez en la base de datos.
-- El consumidor reserva varios productos para una fecha; recibe un código.
-- El precio es estimado; el final se calcula al pesar (flujo de pedido existente).

-- 1) Código único en la reserva (se genera al crear)
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE;

-- 2) La cabecera de reserva ya no exige un solo producto (ahora puede ser multi-ítem)
ALTER TABLE reservas ALTER COLUMN producto_id DROP NOT NULL;
ALTER TABLE reservas ALTER COLUMN cantidad    DROP NOT NULL;

-- 3) Marca de tiempo del último recordatorio enviado (Fase 3 — evitar duplicados)
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS ultimo_recordatorio_dias INTEGER;

-- 4) Ítems de la reserva (un renglón por producto)
CREATE TABLE IF NOT EXISTS reserva_items (
  id                 SERIAL PRIMARY KEY,
  reserva_id         INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  producto_id        INTEGER NOT NULL REFERENCES productos(id),
  modo               VARCHAR(10) NOT NULL DEFAULT 'cantidad', -- 'cantidad' | 'peso'
  cantidad           NUMERIC(10,2) NOT NULL DEFAULT 1,        -- nº de pescados (modo cantidad)
  peso_solicitado_kg NUMERIC(10,2),                           -- kg pedidos (modo peso)
  precio_estimado    NUMERIC(10,2),                           -- estimado al reservar
  fecha_creacion     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reserva_items_reserva ON reserva_items(reserva_id);
