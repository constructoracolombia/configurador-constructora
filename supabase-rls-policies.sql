-- Ejecutar en Supabase SQL Editor si hay errores de permisos en admin/CRM
-- Verificar políticas RLS para la tabla cotizaciones

ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

-- Política para INSERT público
DROP POLICY IF EXISTS "Permitir inserción pública" ON cotizaciones;
CREATE POLICY "Permitir inserción pública"
ON cotizaciones FOR INSERT
TO public
WITH CHECK (true);

-- Política para SELECT público
DROP POLICY IF EXISTS "Permitir lectura pública" ON cotizaciones;
CREATE POLICY "Permitir lectura pública"
ON cotizaciones FOR SELECT
TO public
USING (true);

-- Política para UPDATE público
DROP POLICY IF EXISTS "Permitir actualización de cotizaciones" ON cotizaciones;
CREATE POLICY "Permitir actualización de cotizaciones"
ON cotizaciones FOR UPDATE
TO public
USING (true);
