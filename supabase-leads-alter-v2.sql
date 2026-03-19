-- Agregar columnas nuevas a tabla leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS fecha_contacto DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS origen TEXT CHECK (origen IN ('PAUTA_META', 'PAUTA_GOOGLE', 'REFERIDO', 'WHATSAPP', 'LLAMADA_DIRECTA', 'WEB', 'INSTAGRAM', 'OTRO')),
ADD COLUMN IF NOT EXISTS tipo_proyecto TEXT CHECK (tipo_proyecto IN ('VIS', 'REFORMA', 'DISENO', 'CONSTRUCCION', 'ACABADOS', 'OTRO')),
ADD COLUMN IF NOT EXISTS nombre_proyecto TEXT,
ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_leads_fecha_contacto ON leads(fecha_contacto DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tipo_proyecto ON leads(tipo_proyecto);
