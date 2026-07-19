-- Tabla de notificaciones para el admin — creada retroactivamente
-- El webhook evolution ya intentaba insertar aquí desde el inicio (silently failing)
CREATE TABLE IF NOT EXISTS notificaciones_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tipo TEXT NOT NULL,
  cliente_nombre TEXT,
  cliente_telefono TEXT,
  mensaje TEXT,
  leido BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_leido ON notificaciones_admin(leido, created_at DESC);

ALTER TABLE notificaciones_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access" ON notificaciones_admin
  FOR ALL TO public USING (true) WITH CHECK (true);
