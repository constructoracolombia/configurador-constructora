-- Agregar columnas de CRM a la tabla cotizaciones
ALTER TABLE cotizaciones
ADD COLUMN IF NOT EXISTS estado_crm TEXT DEFAULT 'NUEVO' CHECK (estado_crm IN ('NUEVO', 'CORREO_ENVIADO', 'CITA_AGENDADA', 'RESERVADO', 'CONTRATO_FIRMADO', 'PERDIDO')),
ADD COLUMN IF NOT EXISTS ultima_interaccion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS pdf_abierto BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prioridad TEXT DEFAULT 'MEDIA' CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS posicion_kanban INTEGER DEFAULT 0;

-- Crear tabla de notas de seguimiento
CREATE TABLE IF NOT EXISTS notas_seguimiento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nota TEXT NOT NULL,
  tipo TEXT DEFAULT 'nota' CHECK (tipo IN ('nota', 'llamada', 'email', 'whatsapp', 'reunion')),
  autor TEXT DEFAULT 'admin'
);

-- Crear tabla de historial de estados
CREATE TABLE IF NOT EXISTS historial_estados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado_anterior TEXT,
  estado_nuevo TEXT,
  comentario TEXT
);

-- Función para registrar cambios de estado automáticamente
CREATE OR REPLACE FUNCTION registrar_cambio_estado()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado_crm IS DISTINCT FROM NEW.estado_crm THEN
    INSERT INTO historial_estados (cotizacion_id, estado_anterior, estado_nuevo)
    VALUES (NEW.id, OLD.estado_crm, NEW.estado_crm);

    NEW.ultima_interaccion = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para cambios de estado
DROP TRIGGER IF EXISTS trigger_cambio_estado ON cotizaciones;
CREATE TRIGGER trigger_cambio_estado
  BEFORE UPDATE ON cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION registrar_cambio_estado();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado_crm ON cotizaciones(estado_crm);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_posicion ON cotizaciones(estado_crm, posicion_kanban);
CREATE INDEX IF NOT EXISTS idx_notas_cotizacion ON notas_seguimiento(cotizacion_id);

-- RLS policies para notas
ALTER TABLE notas_seguimiento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserción de notas" ON notas_seguimiento;
CREATE POLICY "Permitir inserción de notas"
ON notas_seguimiento FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de notas" ON notas_seguimiento;
CREATE POLICY "Permitir lectura de notas"
ON notas_seguimiento FOR SELECT
TO public
USING (true);

-- Permitir updates en cotizaciones
DROP POLICY IF EXISTS "Permitir actualización de cotizaciones" ON cotizaciones;
CREATE POLICY "Permitir actualización de cotizaciones"
ON cotizaciones FOR UPDATE
TO public
USING (true);
