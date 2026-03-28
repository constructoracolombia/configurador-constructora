-- Columna fecha de entrega de apartamento (leads)
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS fecha_entrega_apartamento DATE;

CREATE INDEX IF NOT EXISTS idx_leads_fecha_entrega ON leads(fecha_entrega_apartamento);

COMMENT ON COLUMN leads.fecha_entrega_apartamento IS 'Fecha estimada de entrega del apartamento al cliente';
