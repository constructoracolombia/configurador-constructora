-- Configuración de Supabase Storage para presupuestos PDF
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Crear bucket público para presupuestos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'presupuestos',
  'presupuestos',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir subida de archivos
CREATE POLICY "Permitir subida de PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'presupuestos');

-- Política para acceso público de lectura
CREATE POLICY "Acceso público de lectura"
ON storage.objects FOR SELECT
USING (bucket_id = 'presupuestos');
