-- Crear tabla de cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Datos del cliente
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  cliente_telefono TEXT,

  -- Datos del proyecto
  proyecto_id TEXT NOT NULL,
  proyecto_nombre TEXT NOT NULL,
  plan_tipo TEXT NOT NULL, -- 'basico' o 'intermedio'
  plan_nombre TEXT NOT NULL,

  -- Valores
  precio_plan NUMERIC NOT NULL,
  total NUMERIC NOT NULL,

  -- Archivos
  pdf_url TEXT,
  numero_cotizacion TEXT NOT NULL UNIQUE,

  -- Adicionales (JSON)
  adicionales JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  user_agent TEXT,
  ip_address INET
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_cotizaciones_email ON cotizaciones(cliente_email);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON cotizaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_proyecto ON cotizaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_numero ON cotizaciones(numero_cotizacion);

-- RLS policies (permitir lectura/escritura pública por ahora)
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserción pública" ON cotizaciones;
CREATE POLICY "Permitir inserción pública"
ON cotizaciones FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura pública" ON cotizaciones;
CREATE POLICY "Permitir lectura pública"
ON cotizaciones FOR SELECT
TO public
USING (true);
