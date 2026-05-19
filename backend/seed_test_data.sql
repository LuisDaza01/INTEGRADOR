-- =============================================================
-- DATOS DE PRUEBA — NaturaPiscis
-- Productor : ldaza111@gmail.com
-- Consumidor: maycol@gmail.com
-- Ejecutar en orden (1 → 5) en pgAdmin o psql
-- =============================================================

-- ── 1. Dirección del consumidor (solo si no tiene) ────────────
INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, predeterminada)
SELECT u.id, 'Casa', 'Av. Principal 123', 'Santa Cruz', '0000', true
FROM usuarios u
WHERE u.email = 'maycol@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM direcciones WHERE usuario_id = u.id);

-- ── 2. Método de pago del consumidor (solo si no tiene) ───────
INSERT INTO metodos_pago (usuario_id, tipo, titular, predeterminado)
SELECT u.id, 'efectivo', 'Maycol', true
FROM usuarios u
WHERE u.email = 'maycol@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM metodos_pago WHERE usuario_id = u.id);

-- ── 3. Producto del productor (solo si no tiene ninguno activo)
INSERT INTO productos (productor_id, categoria_id, nombre, descripcion, precio, stock, unidad, disponible, destacado)
SELECT u.id, 1, 'Trucha Fresca', 'Trucha fresca del criadero', 35.00, 500, 'kg', true, true
FROM usuarios u
WHERE u.email = 'ldaza111@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM productos WHERE productor_id = u.id AND disponible = true
  );

-- ── 4. 12 pedidos entregados — 2 por mes × últimos 6 meses ───
--     Montos con tendencia creciente para que el modelo tenga R² bueno
INSERT INTO pedidos (
  consumidor_id, direccion_id, metodo_pago_id,
  estado, subtotal, costo_envio, total, metodo_envio,
  fecha_pedido, notas
)
SELECT
  (SELECT id FROM usuarios    WHERE email = 'maycol@gmail.com'),
  (SELECT id FROM direcciones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'maycol@gmail.com') ORDER BY id LIMIT 1),
  (SELECT id FROM metodos_pago WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'maycol@gmail.com') ORDER BY id LIMIT 1),
  'entregado',
  monto, 0, monto,
  'delivery', fecha,
  'Historial de prueba'
FROM (VALUES
  (350.00, NOW() - INTERVAL '5 months' + INTERVAL '3  days'),
  (430.00, NOW() - INTERVAL '5 months' + INTERVAL '15 days'),
  (400.00, NOW() - INTERVAL '4 months' + INTERVAL '3  days'),
  (490.00, NOW() - INTERVAL '4 months' + INTERVAL '15 days'),
  (455.00, NOW() - INTERVAL '3 months' + INTERVAL '3  days'),
  (545.00, NOW() - INTERVAL '3 months' + INTERVAL '15 days'),
  (510.00, NOW() - INTERVAL '2 months' + INTERVAL '3  days'),
  (605.00, NOW() - INTERVAL '2 months' + INTERVAL '15 days'),
  (560.00, NOW() - INTERVAL '1 month'  + INTERVAL '3  days'),
  (660.00, NOW() - INTERVAL '1 month'  + INTERVAL '15 days'),
  (615.00, NOW() - INTERVAL '6 days'),
  (715.00, NOW() - INTERVAL '2 days')
) AS datos(monto, fecha);

-- ── 5. Detalles de esos pedidos ────────────────────────────────
INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
SELECT
  p.id,
  (SELECT pr.id
   FROM productos pr
   JOIN usuarios u ON u.id = pr.productor_id
   WHERE u.email = 'ldaza111@gmail.com' AND pr.disponible = true
   ORDER BY pr.id
   LIMIT 1),
  GREATEST(1, ROUND(p.total / 35)::INT),
  35.00,
  p.total
FROM pedidos p
WHERE p.consumidor_id = (SELECT id FROM usuarios WHERE email = 'maycol@gmail.com')
  AND p.notas = 'Historial de prueba'
  AND NOT EXISTS (SELECT 1 FROM detalles_pedido WHERE pedido_id = p.id);
