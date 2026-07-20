-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 2: Sistema APU — Esquema de tablas
-- Tablas: config_precios, apus, apu_materiales
-- Modificación: catalogo_items.apu_id (FK inversa — ítem conoce su APU)
--
-- SEGURO DE CORRER: no toca datos existentes.
-- Correr ANTES del seed y ANTES del backfill de snapshot.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. config_precios — tabla de fila única (singleton)
-- Almacena el % de utilidad global. Un solo cambio aquí recalcula todo.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS config_precios (
  id              boolean       PRIMARY KEY DEFAULT true,
  CHECK (id = true),                          -- hace imposible una segunda fila
  utilidad_pct    numeric(5,2)  NOT NULL DEFAULT 20.00,
  ai_pct          numeric(5,2)  NOT NULL DEFAULT 10.00,
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- Insertar la fila singleton si no existe (valor actual del sistema: 20%)
INSERT INTO config_precios (utilidad_pct, ai_pct)
VALUES (20.00, 10.00)
ON CONFLICT (id) DO NOTHING;

-- Trigger: actualizar updated_at al editar
CREATE OR REPLACE FUNCTION _config_precios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS config_precios_updated_at ON config_precios;
CREATE TRIGGER config_precios_updated_at
  BEFORE UPDATE ON config_precios
  FOR EACH ROW EXECUTE FUNCTION _config_precios_updated_at();

-- RLS: solo admin
ALTER TABLE config_precios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all" ON config_precios;
CREATE POLICY "admin_all" ON config_precios
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. apus — Análisis de Precios Unitarios
-- Encabezado del APU. Los materiales van en apu_materiales.
-- Costo calculado (derivado, no almacenado):
--   costo_directo = Σ(cantidad × valor_unitario) + mdo
--   costo_apu     = costo_directo × (1 + ai_porcentaje/100)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS apus (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          text          NOT NULL,
  nombre          text          NOT NULL,
  descripcion     text,
  unidad          text,
  mdo             numeric(14,2) NOT NULL DEFAULT 0,   -- mano de obra
  ai_porcentaje   numeric(5,2)  NOT NULL DEFAULT 10,  -- administración e imprevistos
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apus_codigo ON apus(codigo);

CREATE OR REPLACE FUNCTION _apus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS apus_updated_at ON apus;
CREATE TRIGGER apus_updated_at
  BEFORE UPDATE ON apus
  FOR EACH ROW EXECUTE FUNCTION _apus_updated_at();

ALTER TABLE apus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all" ON apus;
CREATE POLICY "admin_all" ON apus
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. apu_materiales — Materiales de cada APU
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS apu_materiales (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  apu_id          uuid          NOT NULL REFERENCES apus(id) ON DELETE CASCADE,
  nombre          text          NOT NULL,
  unidad          text          NOT NULL DEFAULT 'und',
  cantidad        numeric(14,4) NOT NULL DEFAULT 0,
  valor_unitario  numeric(14,2) NOT NULL DEFAULT 0,
  orden           integer       NOT NULL DEFAULT 0,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apu_materiales_apu_id ON apu_materiales(apu_id, orden);

ALTER TABLE apu_materiales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all" ON apu_materiales;
CREATE POLICY "admin_all" ON apu_materiales
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. catalogo_items — agregar FK a apus (nullable, inversa al diseño original)
-- Un ítem conoce qué APU lo alimenta. Un APU puede alimentar N ítems (null = manual).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE catalogo_items
  ADD COLUMN IF NOT EXISTS apu_id uuid REFERENCES apus(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_catalogo_items_apu_id ON catalogo_items(apu_id);

COMMENT ON COLUMN catalogo_items.apu_id IS
  'APU que determina el valor_costo de este ítem. NULL = precio manual.';
COMMENT ON COLUMN catalogo_items.valor_venta IS
  'Precio de costo (input manual o derivado del APU). El precio al cliente = valor_venta × (1 + utilidad_pct/100). Nombre histórico: renombrar a valor_costo en refactor futuro.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Vista calculada de APUs (opcional, facilita queries en la UI)
-- No almacena datos — siempre up-to-date al cambiar materiales o MDO.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_apus_calculados AS
SELECT
  a.id,
  a.codigo,
  a.nombre,
  a.descripcion,
  a.unidad,
  a.mdo,
  a.ai_porcentaje,
  COALESCE(SUM(m.cantidad * m.valor_unitario), 0)                          AS costo_materiales,
  COALESCE(SUM(m.cantidad * m.valor_unitario), 0) + a.mdo                  AS costo_directo,
  ROUND((COALESCE(SUM(m.cantidad * m.valor_unitario), 0) + a.mdo) *
        (1 + a.ai_porcentaje / 100.0), 0)                                  AS costo_apu,
  -- precio_venta requiere JOIN con config_precios — se calcula en la app
  a.created_at,
  a.updated_at
FROM apus a
LEFT JOIN apu_materiales m ON m.apu_id = a.id
GROUP BY a.id;

COMMENT ON VIEW v_apus_calculados IS
  'Costo calculado por APU. precio_venta = costo_apu × (1 + config_precios.utilidad_pct/100)';
