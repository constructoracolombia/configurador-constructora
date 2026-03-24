-- Agregar columna para soft delete
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Índice para filtrar leads no eliminados
CREATE INDEX IF NOT EXISTS idx_leads_not_deleted
ON leads(id)
WHERE deleted_at IS NULL;

-- Comentario
COMMENT ON COLUMN leads.deleted_at IS
'Fecha de eliminación (soft delete). NULL = no eliminado';
