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

-- Actualizar constraint de etapa para incluir nombres correctos
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_etapa_check;

ALTER TABLE leads ADD CONSTRAINT leads_etapa_check
CHECK (etapa IN (
  'PROSPECCION',
  'PRIMER_CONTACTO',
  'PRESENTACION',
  'COTIZACION',
  'NEGOCIACION',
  'CIERRE',
  'PERDIDO',
  'DESCALIFICADO'
));

-- Comentario para claridad
COMMENT ON COLUMN leads.etapa IS
'Etapa del flujo comercial:
- PROSPECCION: Prospección (1-3 días)
- PRIMER_CONTACTO: Primer Contacto (3-7 días)
- PRESENTACION: Reunión Virtual/Presencial (10-14 días)
- COTIZACION: Cotización Enviada (7-10 días)
- NEGOCIACION: Negociación (14-21 días)
- CIERRE: Cierre (21-30 días)';
