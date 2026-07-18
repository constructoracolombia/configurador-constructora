-- Migración: tabla contratos
-- Ejecutar en Supabase SQL Editor (public schema, sin RLS)

CREATE TABLE IF NOT EXISTS contratos (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id            UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  presupuesto_id     UUID        NOT NULL REFERENCES presupuestos(id),
  numero_contrato    TEXT        NOT NULL UNIQUE,   -- B0137, B0138, ...
  nombre_contratante TEXT        NOT NULL,
  cedula_contratante TEXT        NOT NULL,
  fecha_firma        DATE        NOT NULL,
  duracion_dias      INTEGER     NOT NULL DEFAULT 30,
  pdf_url            TEXT,                          -- Supabase Storage (opcional)
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contratos_lead       ON contratos(lead_id);
CREATE INDEX IF NOT EXISTS idx_contratos_presupuesto ON contratos(presupuesto_id);

-- RLS: deshabilitado (public schema, acceso por service_role key igual que presupuestos)
