-- Agregar columnas de tracking de pauta
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS fbclid TEXT,
ADD COLUMN IF NOT EXISTS gclid TEXT,
ADD COLUMN IF NOT EXISTS landing_page TEXT,
ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Índices para análisis
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON leads(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);

-- Comentario
COMMENT ON COLUMN leads.utm_campaign IS 'Campaña de Meta Ads de donde proviene el lead';
