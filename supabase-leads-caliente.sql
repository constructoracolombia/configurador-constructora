-- Agregar columna de lead caliente
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS es_caliente BOOLEAN DEFAULT false;

-- Índice para filtrar leads calientes
CREATE INDEX IF NOT EXISTS idx_leads_caliente
ON leads(es_caliente) WHERE es_caliente = true;

-- Comentario
COMMENT ON COLUMN leads.es_caliente IS
'Indica si el lead está caliente (alta prioridad/interés)';
