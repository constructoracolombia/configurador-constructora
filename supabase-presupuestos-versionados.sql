-- Tabla de versiones de presupuesto vinculadas a leads del CRM
-- Fase 1: snapshot completo del estado del configurador para cada versión
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS presupuestos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  version_num         integer NOT NULL,
  estado              text NOT NULL DEFAULT 'BORRADOR'
                      CHECK (estado IN ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA')),
  total_final         numeric NOT NULL DEFAULT 0,
  precio_base         numeric,
  nombre_cliente      text NOT NULL DEFAULT '',
  telefono_cliente    text NOT NULL DEFAULT '',
  nombre_proyecto     text NOT NULL DEFAULT '',
  catalogo_id         uuid,
  plan_base           text NOT NULL DEFAULT '',
  conjunto            text NOT NULL DEFAULT '',
  precio_manual       numeric,
  seleccionados       jsonb NOT NULL DEFAULT '{}',
  items_plan_estado   jsonb NOT NULL DEFAULT '{}',
  items_ocultos       jsonb NOT NULL DEFAULT '[]',
  items_manuales      jsonb NOT NULL DEFAULT '[]',
  aplica_iva          boolean NOT NULL DEFAULT false,
  notas               text NOT NULL DEFAULT '',
  pdf_url             text,
  -- Precios congelados al momento de guardar { "<item_id>": valor_venta, ... }
  precios_snapshot    jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, version_num)
);

-- Trigger: auto-numerar versiones por lead (1, 2, 3... independiente por lead)
CREATE OR REPLACE FUNCTION _set_presupuesto_version_num()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(version_num), 0) + 1
  INTO NEW.version_num
  FROM presupuestos
  WHERE lead_id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS presupuestos_auto_version ON presupuestos;
CREATE TRIGGER presupuestos_auto_version
  BEFORE INSERT ON presupuestos
  FOR EACH ROW EXECUTE FUNCTION _set_presupuesto_version_num();

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION _presupuestos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS presupuestos_updated_at ON presupuestos;
CREATE TRIGGER presupuestos_updated_at
  BEFORE UPDATE ON presupuestos
  FOR EACH ROW EXECUTE FUNCTION _presupuestos_updated_at();

-- RLS habilitado con política TO public — igual que leads, cotizaciones y notas_seguimiento.
-- El configurador usa anon key sin sesión; el rol anon hereda de public.
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo público presupuestos" ON presupuestos;
CREATE POLICY "Permitir todo público presupuestos"
ON presupuestos FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_presupuestos_lead_id ON presupuestos(lead_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado  ON presupuestos(estado);
