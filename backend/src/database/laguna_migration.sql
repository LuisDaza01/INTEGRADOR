-- ============================================================
-- MIGRACIÓN: Sistema de Lagunas e Inventario por Producción
-- ============================================================

-- Especies de peces
CREATE TABLE IF NOT EXISTS especies (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  peso_inicial_g   DECIMAL(8,2) DEFAULT 20,
  peso_objetivo_g  DECIMAL(8,2) DEFAULT 800,
  duracion_ciclo_dias INTEGER DEFAULT 210,
  creado_por    INTEGER REFERENCES usuarios(id),
  es_sistema    BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Tipos de alimento (datos del sistema, 25 kg/saco)
CREATE TABLE IF NOT EXISTS tipos_alimento (
  id                  SERIAL PRIMARY KEY,
  nombre              VARCHAR(60) NOT NULL,
  codigo              VARCHAR(10) NOT NULL UNIQUE,
  fase                VARCHAR(20),
  peso_min_pez_g      DECIMAL(8,2),
  peso_max_pez_g      DECIMAL(8,2),
  porcentaje_biomasa  DECIMAL(5,2),
  frecuencia_dia      INTEGER DEFAULT 2,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- Lagunas del productor
CREATE TABLE IF NOT EXISTS lagunas (
  id               SERIAL PRIMARY KEY,
  productor_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre           VARCHAR(100) NOT NULL,
  capacidad_maxima INTEGER,
  descripcion      TEXT,
  activa           BOOLEAN DEFAULT true,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- Siembras (ciclos de producción)
CREATE TABLE IF NOT EXISTS siembras (
  id                   SERIAL PRIMARY KEY,
  laguna_id            INTEGER NOT NULL REFERENCES lagunas(id) ON DELETE CASCADE,
  especie_id           INTEGER REFERENCES especies(id),
  cantidad_inicial     INTEGER NOT NULL,
  peces_actuales       INTEGER NOT NULL,
  peso_inicial_g       DECIMAL(8,2) NOT NULL,
  peso_objetivo_g      DECIMAL(8,2) NOT NULL,
  fecha_siembra        DATE NOT NULL,
  duracion_dias        INTEGER NOT NULL,
  fecha_cosecha_estimada DATE,
  precio_alevines_bs   DECIMAL(10,2) DEFAULT 0,
  precio_venta_kg_bs   DECIMAL(10,2) DEFAULT 35,
  estado               VARCHAR(20) DEFAULT 'activa',
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);

-- Movimientos por laguna (alimentación, mortalidad, venta, cosecha, costo)
CREATE TABLE IF NOT EXISTS laguna_movimientos (
  id               SERIAL PRIMARY KEY,
  siembra_id       INTEGER NOT NULL REFERENCES siembras(id) ON DELETE CASCADE,
  laguna_id        INTEGER NOT NULL REFERENCES lagunas(id),
  tipo             VARCHAR(30) NOT NULL,
  cantidad         DECIMAL(10,2),
  unidad           VARCHAR(20) DEFAULT 'peces',
  descripcion      TEXT,
  ingreso_bs       DECIMAL(10,2) DEFAULT 0,
  costo_bs         DECIMAL(10,2) DEFAULT 0,
  pedido_id        INTEGER REFERENCES pedidos(id),
  tipo_alimento_id INTEGER REFERENCES tipos_alimento(id),
  fecha            TIMESTAMP DEFAULT NOW(),
  created_at       TIMESTAMP DEFAULT NOW()
);

-- Stock de alimento por productor
CREATE TABLE IF NOT EXISTS stock_alimento (
  id                SERIAL PRIMARY KEY,
  productor_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_alimento_id  INTEGER NOT NULL REFERENCES tipos_alimento(id),
  sacos_disponibles INTEGER DEFAULT 0,
  costo_por_saco_bs DECIMAL(10,2) DEFAULT 135,
  peso_saco_kg      DECIMAL(6,2) DEFAULT 25,
  updated_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(productor_id, tipo_alimento_id)
);

-- Costos adicionales por siembra
CREATE TABLE IF NOT EXISTS costos_siembra (
  id         SERIAL PRIMARY KEY,
  siembra_id INTEGER NOT NULL REFERENCES siembras(id) ON DELETE CASCADE,
  concepto   VARCHAR(100) NOT NULL,
  monto_bs   DECIMAL(10,2) NOT NULL,
  fecha      DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Columna laguna_id en productos
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS laguna_id INTEGER REFERENCES lagunas(id);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

INSERT INTO tipos_alimento (nombre, codigo, fase, peso_min_pez_g, peso_max_pez_g, porcentaje_biomasa, frecuencia_dia) VALUES
  ('Inicial M-0.5',    'M-0.5', 'inicial',     1,    5,    10, 3),
  ('Inicial M-1.5',    'M-1.5', 'inicial',     5,    20,   8,  3),
  ('Inicial M-2.5',    'M-2.5', 'inicial',     20,   80,   6,  2),
  ('Inicial M-4',      'M-4',   'inicial',     80,   150,  5,  2),
  ('Crecimiento M-6',  'M-6',   'crecimiento', 150,  350,  4,  2),
  ('Crecimiento M-8',  'M-8',   'crecimiento', 350,  550,  3,  2),
  ('Engorde M-10',     'M-10',  'engorde',     550,  9999, 2,  2)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO especies (nombre, peso_inicial_g, peso_objetivo_g, duracion_ciclo_dias, es_sistema) VALUES
  ('Tambaqui', 20, 800, 210, true)
ON CONFLICT DO NOTHING;
