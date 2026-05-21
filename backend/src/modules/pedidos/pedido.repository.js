// src/modules/pedidos/pedido.repository.js
const db = require('../../config/database');
const { MINUTOS_CONFIRMACION, PRECIO_KG } = require('../../constants/estados');
const inventarioRepo = require('../inventario/inventario.repository');

// ✅ Generar código de retiro único NP-YYYY-XXXX
const generarCodigoRetiro = () => {
  const year   = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NP-${year}-${random}`;
};

class PedidoRepository {

  async findByUsuario(usuarioId) {
    const query = `
      SELECT
        p.*,
        (SELECT json_agg(json_build_object(
          'detalle_id',         dp.id,
          'producto_id',        dp.producto_id,
          'cantidad',           dp.cantidad,
          'precio_unitario',    dp.precio_unitario,
          'peso_real_kg',       dp.peso_real_kg,
          'precio_final_item',  dp.precio_final_item,
          'nombre',             pr.nombre,
          'imagen',             pr.imagen,
          'preferencia_corte',  dp.preferencia_corte,
          'productor_id',       pr.productor_id,
          'productor_nombre',   uprod.nombre,
          'productor_foto',     uprod.foto_perfil,
          'productor_qr_pago_url', uprod.qr_pago_url
        ))
        FROM detalles_pedido dp
        JOIN productos pr ON dp.producto_id = pr.id
        JOIN usuarios uprod ON uprod.id = pr.productor_id
        WHERE dp.pedido_id = p.id) as items
      FROM pedidos p
      WHERE p.consumidor_id = $1
      ORDER BY p.fecha_pedido DESC
    `;
    return await db.query(query, [usuarioId]);
  }

  async findRecientesByUsuario(usuarioId) {
    const query = `
      SELECT
        id, fecha_pedido, estado, total,
        cantidad_pescados, peso_real_kg, precio_final,
        confirmacion_expires_at,
        (SELECT COUNT(*) FROM detalles_pedido WHERE pedido_id = pedidos.id) as items
      FROM pedidos
      WHERE consumidor_id = $1
      ORDER BY fecha_pedido DESC
      LIMIT 5
    `;
    return await db.query(query, [usuarioId]);
  }

  async findRecibidosByProductor(productorId) {
    const query = `
      SELECT
        p.id, p.fecha_pedido, p.fecha_entrega, p.estado, p.total, p.metodo_envio,
        p.codigo_retiro, p.notas,
        p.cantidad_pescados, p.peso_real_kg, p.precio_final, p.precio_por_kg,
        p.confirmacion_expires_at,
        p.consumidor_id,
        u.nombre as consumidor, u.email as consumidor_email,
        u.telefono as telefono,
        (SELECT json_agg(json_build_object(
          'detalle_id',        dp.id,
          'producto_id',       dp.producto_id,
          'cantidad',          dp.cantidad,
          'precio_unitario',   dp.precio_unitario,
          'peso_real_kg',      dp.peso_real_kg,
          'precio_final_item', dp.precio_final_item,
          'nombre',            pr2.nombre,
          'preferencia_corte', dp.preferencia_corte
        ))
        FROM detalles_pedido dp
        JOIN productos pr2 ON dp.producto_id = pr2.id
        WHERE dp.pedido_id = p.id
          AND pr2.productor_id = $1) as items
      FROM pedidos p
      JOIN usuarios u ON p.consumidor_id = u.id
      JOIN detalles_pedido dp ON p.id = dp.pedido_id
      JOIN productos pr ON dp.producto_id = pr.id
      WHERE pr.productor_id = $1
      GROUP BY p.id, u.nombre, u.email, u.telefono
      ORDER BY p.fecha_pedido DESC
    `;
    return await db.query(query, [productorId]);
  }

  async findById(pedidoId) {
    const query = `
      SELECT
        p.*,
        u.nombre as consumidor,
        u.email as consumidor_email,
        u.expo_push_token as consumidor_push_token,
        (SELECT json_agg(json_build_object(
          'detalle_id',        dp.id,
          'producto_id',       dp.producto_id,
          'cantidad',          dp.cantidad,
          'precio_unitario',   dp.precio_unitario,
          'peso_real_kg',      dp.peso_real_kg,
          'precio_final_item', dp.precio_final_item,
          'nombre',            pr.nombre,
          'imagen',            pr.imagen,
          'preferencia_corte', dp.preferencia_corte,
          'productor_id',      pr.productor_id,
          'productor_nombre',  prod.nombre,
          'productor_empresa', prod.nombre_empresa
        ))
        FROM detalles_pedido dp
        JOIN productos pr ON dp.producto_id = pr.id
        JOIN usuarios prod ON pr.productor_id = prod.id
        WHERE dp.pedido_id = p.id) as items
      FROM pedidos p
      JOIN usuarios u ON p.consumidor_id = u.id
      WHERE p.id = $1
    `;
    const result = await db.query(query, [pedidoId]);
    return result[0] || null;
  }

  async create(pedidoData) {
    return await db.transaction(async (tx) => {
      const {
        usuario_id, direccion, metodo_envio, items, notas, parada_id,
      } = pedidoData;

      let direccion_id = pedidoData.direccion_id;
      if (!direccion_id && direccion) {
        const dirRes = await tx.query(
          `INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, predeterminada)
           VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING id`,
          [usuario_id,
           direccion.nombre     || 'Sin nombre',
           direccion.direccion  || 'Sin dirección',
           direccion.ciudad     || 'Sin ciudad',
           direccion.codigo_postal || '0000',
           direccion.telefono   || '']
        );
        direccion_id = dirRes[0].id;
      }

      const pagoRes = await tx.query(
        `INSERT INTO metodos_pago (usuario_id, tipo, predeterminado) VALUES ($1, 'efectivo', false) RETURNING id`,
        [usuario_id]
      );
      const metodo_pago_id_final = pagoRes[0].id;

      // Subtotal estimado = cantidad_pescados × precio/kg (referencial)
      const subtotal    = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      const costo_envio = pedidoData.costo_envio || 5.00;
      const total       = subtotal + costo_envio;

      // cantidad_pescados inicial = suma de pescados pedidos
      const cantidad_pescados = items.reduce((sum, item) => sum + item.cantidad, 0);

      const pedido = await tx.query(
        `INSERT INTO pedidos (
           consumidor_id, direccion_id, parada_id, metodo_pago_id, metodo_envio,
           subtotal, costo_envio, total, estado, notas, cantidad_pescados, precio_por_kg
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendiente', $9, $10, $11)
         RETURNING *`,
        [
          usuario_id, direccion_id, parada_id || null,
          metodo_pago_id_final, metodo_envio,
          subtotal, costo_envio, total,
          notas || null,
          cantidad_pescados,
          PRECIO_KG,
        ]
      );

      const pedido_id = pedido[0].id;

      for (const item of items) {
        await tx.query(
          `INSERT INTO detalles_pedido
             (pedido_id, producto_id, cantidad, precio_unitario, subtotal, preferencia_corte)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            pedido_id, item.producto_id, item.cantidad,
            item.precio, item.precio * item.cantidad,
            item.preferencia_corte || 'sin_preferencia',
          ]
        );
      }

      return pedido[0];
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Crea un pedido a partir de una reserva ya aceptada.
  // Estado inicial: 'confirmado' (productor ya confirmó al aceptar la reserva).
  // Descuenta stock como venta_online dentro de la misma transacción.
  // ─────────────────────────────────────────────────────────────
  async createFromReserva(reservaId) {
    return await db.transaction(async (tx) => {
      // Bloquear la reserva para que no se duplique
      const resRows = await tx.query(
        `SELECT * FROM reservas WHERE id = $1 FOR UPDATE`,
        [reservaId]
      );
      if (resRows.length === 0) throw new Error('Reserva no encontrada');
      const reserva = resRows[0];
      if (reserva.estado !== 'aceptada') {
        throw new Error(`Reserva no está aceptada (estado: ${reserva.estado})`);
      }

      // Si ya existe un pedido enlazado, devolverlo (idempotente)
      const existeRows = await tx.query(
        `SELECT * FROM pedidos WHERE reserva_id = $1 LIMIT 1`,
        [reservaId]
      );
      if (existeRows.length > 0) return existeRows[0];

      // Dirección y método de pago placeholder (consumidor los puede actualizar después)
      const dirRes = await tx.query(
        `INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, predeterminada)
         VALUES ($1, 'Reserva', 'Por definir en retiro', 'Cochabamba', '0000', '', false)
         RETURNING id`,
        [reserva.consumidor_id]
      );
      const direccion_id = dirRes[0].id;

      const pagoRes = await tx.query(
        `INSERT INTO metodos_pago (usuario_id, tipo, predeterminado)
         VALUES ($1, 'efectivo', false) RETURNING id`,
        [reserva.consumidor_id]
      );
      const metodo_pago_id = pagoRes[0].id;

      const PESO_PROMEDIO_KG = 0.9; // estimación; el peso real se registra al pesar

      // Líneas del pedido: desde reserva_items (multi-ítem) o desde el producto único (compat)
      const itemRows = await tx.query(
        `SELECT ri.*, p.productor_id, p.precio
         FROM reserva_items ri JOIN productos p ON p.id = ri.producto_id
         WHERE ri.reserva_id = $1`,
        [reservaId]
      );

      let lineas = [];
      if (itemRows.length > 0) {
        lineas = itemRows.map((it) => {
          const precioKg = parseFloat(it.precio) || 0;
          const esPeso = it.modo === 'peso';
          const cant = esPeso
            ? Math.max(1, Math.ceil((parseFloat(it.peso_solicitado_kg) || 0) / PESO_PROMEDIO_KG))
            : Math.max(1, Math.ceil(parseFloat(it.cantidad) || 0));
          const sub = it.precio_estimado != null
            ? parseFloat(parseFloat(it.precio_estimado).toFixed(2))
            : parseFloat(((esPeso ? (parseFloat(it.peso_solicitado_kg) || 0) : cant * PESO_PROMEDIO_KG) * precioKg).toFixed(2));
          return { producto_id: it.producto_id, productor_id: it.productor_id, cantidad: cant, precio_unitario: precioKg, subtotal: sub };
        });
      } else {
        if (!reserva.producto_id) throw new Error('Reserva sin ítems ni producto');
        const productoRows = await tx.query(
          `SELECT id, productor_id, precio FROM productos WHERE id = $1`,
          [reserva.producto_id]
        );
        if (productoRows.length === 0) throw new Error('Producto no existe');
        const prod = productoRows[0];
        const cant = Math.max(1, Math.ceil(parseFloat(reserva.cantidad) || 0));
        const precioKg = parseFloat(prod.precio) || 0;
        const sub = parseFloat((cant * PESO_PROMEDIO_KG * precioKg).toFixed(2));
        lineas = [{ producto_id: prod.id, productor_id: prod.productor_id, cantidad: cant, precio_unitario: precioKg, subtotal: sub }];
      }

      const subtotal = parseFloat(lineas.reduce((s, l) => s + l.subtotal, 0).toFixed(2));
      const cantidadPescados = lineas.reduce((s, l) => s + l.cantidad, 0);
      const precioKgRef = lineas[0]?.precio_unitario || 0;
      const costo_envio = 5.00;
      const total = parseFloat((subtotal + costo_envio).toFixed(2));

      const pedido = await tx.query(
        `INSERT INTO pedidos (
           consumidor_id, direccion_id, metodo_pago_id, metodo_envio,
           subtotal, costo_envio, total, estado, notas,
           cantidad_pescados, precio_por_kg, reserva_id
         ) VALUES ($1,$2,$3,'parada',$4,$5,$6,'confirmado',$7,$8,$9,$10)
         RETURNING *`,
        [
          reserva.consumidor_id, direccion_id, metodo_pago_id,
          subtotal, costo_envio, total,
          reserva.notas || `Pedido desde reserva #${reservaId}`,
          cantidadPescados, precioKgRef, reservaId,
        ]
      );
      const pedido_id = pedido[0].id;

      // Detalles (uno por línea)
      for (const l of lineas) {
        await tx.query(
          `INSERT INTO detalles_pedido
             (pedido_id, producto_id, cantidad, precio_unitario, subtotal, preferencia_corte)
           VALUES ($1, $2, $3, $4, $5, 'sin_preferencia')`,
          [pedido_id, l.producto_id, l.cantidad, l.precio_unitario, l.subtotal]
        );
      }

      // Un solo código de extremo a extremo: el código de la reserva ES el código de retiro
      let codigo = reserva.codigo;
      if (!codigo) {
        codigo = generarCodigoRetiro();
        for (let i = 0; i < 5; i++) {
          const exists = await tx.query(`SELECT id FROM pedidos WHERE codigo_retiro = $1`, [codigo]);
          if (exists.length === 0) break;
          codigo = generarCodigoRetiro();
        }
      }
      await tx.query(`UPDATE pedidos SET codigo_retiro = $1 WHERE id = $2`, [codigo, pedido_id]);

      // Descuento de stock por línea (venta_online)
      for (const l of lineas) {
        await inventarioRepo.crearMovimiento({
          producto_id:  l.producto_id,
          productor_id: l.productor_id,
          tipo:         'venta_online',
          cantidad:     l.cantidad,
          pedido_id,
          descripcion:  `Pedido #${pedido_id} (desde reserva #${reservaId})`,
          tx,
        });
      }

      const final = await tx.query(`SELECT * FROM pedidos WHERE id = $1`, [pedido_id]);
      return final[0];
    });
  }

  async updateEstado(pedidoId, nuevoEstado) {
    return await db.transaction(async (tx) => {
      // Bloquear la fila para evitar transiciones de estado concurrentes.
      const lock = await tx.query(
        `SELECT id, estado, codigo_retiro FROM pedidos WHERE id = $1 FOR UPDATE`,
        [pedidoId]
      );
      if (lock.length === 0) return null;

      const estadoAnterior = lock[0].estado;

      // Si vamos a 'confirmado' y aún no hay código de retiro, generamos uno único.
      let result;
      if (nuevoEstado === 'confirmado' && !lock[0].codigo_retiro) {
        let codigo = generarCodigoRetiro();
        let intentos = 0;
        while (intentos < 5) {
          const existe = await tx.query(
            `SELECT id FROM pedidos WHERE codigo_retiro = $1`, [codigo]
          );
          if (existe.length === 0) break;
          codigo = generarCodigoRetiro();
          intentos++;
        }
        result = await tx.query(
          `UPDATE pedidos SET estado = $1, codigo_retiro = $2 WHERE id = $3 RETURNING *`,
          [nuevoEstado, codigo, pedidoId]
        );
      } else {
        result = await tx.query(
          `UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *`,
          [nuevoEstado, pedidoId]
        );
      }

      // ── Movimientos de inventario asociados a la transición ───────
      // - confirmado: descuenta stock por cada item (venta_online)
      // - cancelado:  devuelve stock SOLO si antes estaba "comprometido"
      const ESTADOS_COMPROMETIDOS = new Set([
        'confirmado', 'preparando', 'pesado', 'esperando_confirmacion',
        'listo_para_recoger', 'en_camino',
      ]);

      const necesitaDescontar = nuevoEstado === 'confirmado' && estadoAnterior !== 'confirmado'
                              && !ESTADOS_COMPROMETIDOS.has(estadoAnterior);
      const necesitaDevolver  = nuevoEstado === 'cancelado'
                              && ESTADOS_COMPROMETIDOS.has(estadoAnterior);

      if (necesitaDescontar || necesitaDevolver) {
        const items = await tx.query(
          `SELECT dp.producto_id, dp.cantidad, p.productor_id
           FROM detalles_pedido dp
           JOIN productos p ON p.id = dp.producto_id
           WHERE dp.pedido_id = $1`,
          [pedidoId]
        );
        const tipo = necesitaDescontar ? 'venta_online' : 'devolucion';
        const desc = necesitaDescontar ? `Pedido #${pedidoId}` : `Cancelación pedido #${pedidoId}`;
        for (const it of items) {
          await inventarioRepo.crearMovimiento({
            producto_id:  it.producto_id,
            productor_id: it.productor_id,
            tipo,
            cantidad:     it.cantidad,
            pedido_id:    pedidoId,
            descripcion:  desc,
            tx,
          });
        }
      }

      return result[0] || null;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ NUEVO: Productor registra el peso POR ITEM del pedido
  // ═══════════════════════════════════════════════════════════════
  // items[] = [
  //   { detalle_id, cantidad_pescados, peso_real_kg }
  // ]
  //
  // Por cada item:
  //   - Actualiza detalles_pedido con peso_real_kg y precio_final_item
  //     (precio_final_item = peso_real_kg × precio_unitario del producto)
  //   - Actualiza cantidad si el productor ajustó
  //
  // Luego en el pedido global:
  //   - cantidad_pescados = suma de cantidades reales
  //   - peso_real_kg      = suma de pesos reales
  //   - precio_final      = suma de precio_final_item
  //   - total             = precio_final + costo_envio
  //   - estado            = esperando_confirmacion
  //   - confirmacion_expires_at = ahora + minutos_confirmacion del productor
  async registrarPesoItems(pedidoId, items) {
    return await db.transaction(async (tx) => {
      // 1. Bloquear el pedido para evitar pesado concurrente.
      const pedidoActual = await tx.query(
        `SELECT id, estado, costo_envio FROM pedidos WHERE id = $1 FOR UPDATE`,
        [pedidoId]
      );
      if (pedidoActual.length === 0) return null;
      if (!['preparando', 'pesado'].includes(pedidoActual[0].estado)) return null;

      const costoEnvio = parseFloat(pedidoActual[0].costo_envio || 0);

      // Minutos de confirmación: leemos del productor (default 15).
      const minutosRows = await tx.query(
        `SELECT COALESCE(u.minutos_confirmacion, 20) AS m
         FROM detalles_pedido dp
         JOIN productos pr  ON pr.id = dp.producto_id
         JOIN usuarios u    ON u.id  = pr.productor_id
         WHERE dp.pedido_id = $1
         LIMIT 1`,
        [pedidoId]
      );
      const minutosConfirmacion = parseInt(minutosRows[0]?.m, 10) || 20;

      // 2. Actualizar cada detalle con su peso y precio final
      //    El precio viene de productos.precio ACTUAL (puede haber cambiado tras crear el pedido).
      let precioVigente = null;
      for (const item of items) {
        const detalle = await tx.query(
          `SELECT dp.id, pr.id AS producto_id, pr.precio AS precio_actual
           FROM detalles_pedido dp
           JOIN productos pr ON pr.id = dp.producto_id
           WHERE dp.id = $1 AND dp.pedido_id = $2`,
          [item.detalle_id, pedidoId]
        );
        if (detalle.length === 0) {
          throw new Error(`Detalle ${item.detalle_id} no pertenece al pedido ${pedidoId}`);
        }

        const precioPorKg     = parseFloat(detalle[0].precio_actual);
        const pesoKg          = parseFloat(item.peso_real_kg);
        const precioFinalItem = parseFloat((pesoKg * precioPorKg).toFixed(2));
        precioVigente = precioPorKg; // usaremos uno representativo en pedidos.precio_por_kg

        await tx.query(
          `UPDATE detalles_pedido
           SET cantidad          = $1,
               peso_real_kg      = $2,
               precio_unitario   = $3,
               precio_final_item = $4
           WHERE id = $5 AND pedido_id = $6`,
          [item.cantidad_pescados, pesoKg, precioPorKg, precioFinalItem, item.detalle_id, pedidoId]
        );
      }

      // 3. Calcular totales
      const totales = await tx.query(
        `SELECT
           SUM(cantidad)          AS total_pescados,
           SUM(peso_real_kg)      AS total_peso,
           SUM(precio_final_item) AS total_precio
         FROM detalles_pedido
         WHERE pedido_id = $1`,
        [pedidoId]
      );

      const cantidadTotal = parseInt(totales[0].total_pescados) || 0;
      const pesoTotal     = parseFloat(totales[0].total_peso)   || 0;
      const precioTotal   = parseFloat(totales[0].total_precio) || 0;
      const totalPedido   = parseFloat((precioTotal + costoEnvio).toFixed(2));
      const expiresAt     = new Date(Date.now() + minutosConfirmacion * 60 * 1000);

      // 4. Actualizar el pedido principal
      const result = await tx.query(
        `UPDATE pedidos
         SET estado                  = 'esperando_confirmacion',
             cantidad_pescados       = $1,
             peso_real_kg            = $2,
             precio_final            = $3,
             total                   = $4,
             precio_por_kg           = COALESCE($5, precio_por_kg),
             confirmacion_expires_at = $6
         WHERE id = $7
         RETURNING *,
           (SELECT expo_push_token FROM usuarios WHERE id = consumidor_id) AS consumidor_push_token`,
        [cantidadTotal, pesoTotal, precioTotal, totalPedido, precioVigente, expiresAt, pedidoId]
      );

      if (!result[0]) return null;
      return { ...result[0], minutos_aplicados: minutosConfirmacion };
    });
  }

  // ✅ Mantener método legado por compatibilidad (flujo de peso global)
  async registrarPeso(pedidoId, cantidadPescados, pesoRealKg) {
    return await db.transaction(async (tx) => {
      const lock = await tx.query(
        `SELECT id, estado FROM pedidos WHERE id = $1 FOR UPDATE`,
        [pedidoId]
      );
      if (lock.length === 0) return null;
      if (!['preparando', 'pesado'].includes(lock[0].estado)) return null;

      // Precio actual del producto (primer item del pedido) y minutos del productor.
      const ctx = await tx.query(
        `SELECT pr.precio AS precio_actual,
                COALESCE(u.minutos_confirmacion, 20) AS minutos
         FROM detalles_pedido dp
         JOIN productos pr ON pr.id = dp.producto_id
         JOIN usuarios u   ON u.id  = pr.productor_id
         WHERE dp.pedido_id = $1
         LIMIT 1`,
        [pedidoId]
      );
      const precioPorKg = parseFloat(ctx[0]?.precio_actual) || PRECIO_KG;
      const minutos     = parseInt(ctx[0]?.minutos, 10)      || 20;

      const precioFinal = parseFloat((pesoRealKg * precioPorKg).toFixed(2));
      const expiresAt   = new Date(Date.now() + minutos * 60 * 1000);

      const result = await tx.query(`
        UPDATE pedidos
        SET estado                  = 'esperando_confirmacion',
            cantidad_pescados       = $1,
            peso_real_kg            = $2,
            precio_final            = $3,
            precio_por_kg           = $4,
            confirmacion_expires_at = $5,
            total                   = $3
        WHERE id = $6
        RETURNING *, (SELECT expo_push_token FROM usuarios WHERE id = consumidor_id) AS consumidor_push_token
      `, [cantidadPescados, pesoRealKg, precioFinal, precioPorKg, expiresAt, pedidoId]);

      if (!result[0]) return null;
      return { ...result[0], minutos_aplicados: minutos };
    });
  }

  async confirmarPrecio(pedidoId, consumidorId) {
    return await db.transaction(async (tx) => {
      const lock = await tx.query(
        `SELECT id, consumidor_id, estado, confirmacion_expires_at
         FROM pedidos WHERE id = $1 FOR UPDATE`,
        [pedidoId]
      );
      if (lock.length === 0) return null;
      const p = lock[0];
      if (p.consumidor_id !== consumidorId) return null;
      if (p.estado !== 'esperando_confirmacion') return null;
      if (!p.confirmacion_expires_at || new Date(p.confirmacion_expires_at) <= new Date()) return null;

      const result = await tx.query(
        `UPDATE pedidos SET estado = 'listo_para_recoger' WHERE id = $1 RETURNING *`,
        [pedidoId]
      );
      return result[0] || null;
    });
  }

  async rechazarPrecio(pedidoId, consumidorId) {
    return await db.transaction(async (tx) => {
      const lock = await tx.query(
        `SELECT id, consumidor_id, estado FROM pedidos WHERE id = $1 FOR UPDATE`,
        [pedidoId]
      );
      if (lock.length === 0) return null;
      const p = lock[0];
      if (p.consumidor_id !== consumidorId) return null;
      if (p.estado !== 'esperando_confirmacion') return null;

      const result = await tx.query(
        `UPDATE pedidos SET estado = 'cancelado' WHERE id = $1 RETURNING *`,
        [pedidoId]
      );

      // Devolver stock al inventario (el pedido ya estaba comprometido)
      const items = await tx.query(
        `SELECT dp.producto_id, dp.cantidad, p.productor_id
         FROM detalles_pedido dp
         JOIN productos p ON p.id = dp.producto_id
         WHERE dp.pedido_id = $1`,
        [pedidoId]
      );
      for (const it of items) {
        await inventarioRepo.crearMovimiento({
          producto_id:  it.producto_id,
          productor_id: it.productor_id,
          tipo:         'devolucion',
          cantidad:     it.cantidad,
          pedido_id:    pedidoId,
          descripcion:  `Rechazo precio pedido #${pedidoId}`,
          tx,
        });
      }

      return result[0] || null;
    });
  }

  async cancelarExpirados() {
    return await db.transaction(async (tx) => {
      const cancelados = await tx.query(`
        UPDATE pedidos
        SET estado = 'cancelado'
        WHERE estado = 'esperando_confirmacion'
          AND confirmacion_expires_at < NOW()
        RETURNING id, consumidor_id,
          (SELECT expo_push_token FROM usuarios WHERE id = consumidor_id) AS push_token
      `);

      // Devolver stock por cada pedido cancelado
      for (const ped of cancelados) {
        const items = await tx.query(
          `SELECT dp.producto_id, dp.cantidad, p.productor_id
           FROM detalles_pedido dp
           JOIN productos p ON p.id = dp.producto_id
           WHERE dp.pedido_id = $1`,
          [ped.id]
        );
        for (const it of items) {
          await inventarioRepo.crearMovimiento({
            producto_id:  it.producto_id,
            productor_id: it.productor_id,
            tipo:         'devolucion',
            cantidad:     it.cantidad,
            pedido_id:    ped.id,
            descripcion:  `Expiración pedido #${ped.id}`,
            tx,
          });
        }
      }

      return cancelados;
    });
  }

  async verificarPropietario(pedidoId, usuarioId) {
    const result = await db.query(
      `SELECT id FROM pedidos WHERE id = $1 AND consumidor_id = $2`,
      [pedidoId, usuarioId]
    );
    return result.length > 0;
  }

  async findHistorial(usuarioId, filtros = {}) {
    let query = `
      SELECT
        p.*,
        (SELECT json_agg(json_build_object(
          'detalle_id',        dp.id,
          'producto_id',       dp.producto_id,
          'cantidad',          dp.cantidad,
          'precio_unitario',   dp.precio_unitario,
          'peso_real_kg',      dp.peso_real_kg,
          'precio_final_item', dp.precio_final_item,
          'nombre',            pr.nombre,
          'imagen',            pr.imagen,
          'preferencia_corte', dp.preferencia_corte
        ))
        FROM detalles_pedido dp
        JOIN productos pr ON dp.producto_id = pr.id
        WHERE dp.pedido_id = p.id) as items
      FROM pedidos p
      WHERE p.consumidor_id = $1
        AND p.reserva_id IS NULL
    `;
    const params = [usuarioId];
    let idx = 2;

    if (filtros.estado) {
      query += ` AND p.estado = $${idx++}`;
      params.push(filtros.estado);
    }
    if (filtros.fecha_desde) {
      query += ` AND p.fecha_pedido >= $${idx++}`;
      params.push(filtros.fecha_desde);
    }
    if (filtros.fecha_hasta) {
      query += ` AND p.fecha_pedido <= $${idx++}`;
      params.push(filtros.fecha_hasta);
    }

    query += ` ORDER BY p.fecha_pedido DESC`;
    return await db.query(query, params);
  }

  async findAll() {
    const query = `
      SELECT p.*,
        u.nombre as consumidor,
        (SELECT COUNT(*) FROM detalles_pedido WHERE pedido_id = p.id) as items_count
      FROM pedidos p
      JOIN usuarios u ON p.consumidor_id = u.id
      ORDER BY p.fecha_pedido DESC
    `;
    return await db.query(query);
  }

  async statsConsumidor(usuarioId) {
    const totalesQuery = `
      SELECT
        COUNT(*)::int                                                 AS total_pedidos,
        COALESCE(SUM(CASE WHEN precio_final IS NOT NULL THEN precio_final ELSE total END), 0)::numeric AS gasto_total,
        COUNT(*) FILTER (WHERE estado NOT IN ('entregado','cancelado'))::int AS pedidos_activos
      FROM pedidos
      WHERE consumidor_id = $1
    `;

    const diasQuery = `
      SELECT
        TO_CHAR(fecha_pedido::date, 'Dy') AS dia,
        fecha_pedido::date                AS fecha,
        COALESCE(SUM(CASE WHEN precio_final IS NOT NULL THEN precio_final ELSE total END), 0)::numeric AS gasto
      FROM pedidos
      WHERE consumidor_id = $1
        AND fecha_pedido >= NOW() - INTERVAL '7 days'
        AND estado NOT IN ('cancelado')
      GROUP BY fecha_pedido::date
      ORDER BY fecha_pedido::date ASC
    `;

    const [totales, dias] = await Promise.all([
      db.query(totalesQuery, [usuarioId]),
      db.query(diasQuery, [usuarioId]),
    ]);

    return { ...totales[0], gastos_por_dia: dias };
  }

  // ── COMPROBANTE DE PAGO QR ─────────────────────────────────────
  async updateComprobante(pedidoId, consumidorId, url) {
    const result = await db.query(
      `UPDATE pedidos SET comprobante_url = $1
       WHERE id = $2 AND consumidor_id = $3
       RETURNING *`,
      [url, pedidoId, consumidorId]
    );
    return result[0] || null;
  }

  async findProductorPushToken(pedidoId) {
    const rows = await db.query(
      `SELECT DISTINCT COALESCE(u.expo_push_token, u.push_token) AS push_token
       FROM detalles_pedido dp
       JOIN productos pr ON pr.id = dp.producto_id
       JOIN usuarios u ON u.id = pr.productor_id
       WHERE dp.pedido_id = $1
         AND COALESCE(u.expo_push_token, u.push_token) IS NOT NULL
       LIMIT 1`,
      [pedidoId]
    );
    return rows[0]?.push_token || null;
  }
}

module.exports = new PedidoRepository();