-- Tabla de leads con flujo comercial
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Información del cliente
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT,
  proyecto TEXT,
  presupuesto_estimado NUMERIC,

  -- Origen del lead
  fuente TEXT CHECK (fuente IN ('WEB', 'WHATSAPP', 'LLAMADA', 'REFERIDO', 'REDES_SOCIALES', 'OTRO')),
  fuente_detalle TEXT,

  -- Estado en el flujo comercial
  etapa TEXT DEFAULT 'PROSPECCION' CHECK (etapa IN (
    'PROSPECCION',
    'PRIMER_CONTACTO',
    'COTIZACION',
    'PRESENTACION',
    'NEGOCIACION',
    'CIERRE',
    'PERDIDO',
    'DESCALIFICADO'
  )),

  -- Días en la etapa actual
  dias_en_etapa INTEGER DEFAULT 0,

  -- Probabilidad de cierre
  probabilidad INTEGER CHECK (probabilidad >= 0 AND probabilidad <= 100),

  -- Asignación
  responsable TEXT DEFAULT 'Jeisson',

  -- Seguimiento
  notas TEXT,
  ultima_interaccion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  proxima_accion TEXT,
  fecha_proxima_accion DATE,

  -- Relaciones
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE SET NULL,

  -- Metadata
  prioridad TEXT DEFAULT 'MEDIA' CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA'))
);

-- Tabla de actividades
CREATE TABLE IF NOT EXISTS lead_actividades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  tipo TEXT CHECK (tipo IN ('LLAMADA', 'EMAIL', 'WHATSAPP', 'REUNION', 'NOTA', 'CAMBIO_ETAPA')),
  descripcion TEXT NOT NULL,
  resultado TEXT,
  usuario TEXT DEFAULT 'Sistema'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_etapa ON leads(etapa);
CREATE INDEX IF NOT EXISTS idx_leads_fuente ON leads(fuente);
CREATE INDEX IF NOT EXISTS idx_leads_updated ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_actividades_lead ON lead_actividades(lead_id);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_actividades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo público leads" ON leads;
CREATE POLICY "Permitir todo público leads"
ON leads FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo público actividades" ON lead_actividades;
CREATE POLICY "Permitir todo público actividades"
ON lead_actividades FOR ALL TO public USING (true) WITH CHECK (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_leads_updated_at ON leads;
CREATE TRIGGER trigger_update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_leads_updated_at();
