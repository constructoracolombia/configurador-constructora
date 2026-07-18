-- Migración: token público + tracking de vistas en presupuestos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS token_publico      TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS visto_primera_vez  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visto_ultima_vez   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS veces_visto        INTEGER NOT NULL DEFAULT 0;

-- Índice para lookup por token (la ruta pública lo usa en cada carga)
CREATE INDEX IF NOT EXISTS idx_presupuestos_token ON presupuestos(token_publico)
  WHERE token_publico IS NOT NULL;

-- RLS: la política existente "Permitir todo público presupuestos" TO public USING (true)
-- ya cubre SELECT y UPDATE con anon key — no se necesita cambio de políticas.
