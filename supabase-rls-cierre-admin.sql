-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS CIERRE TOTAL — Solo admin verificado por email
-- Constructora Colombia / configurador-constructora
--
-- CONTEXTO CRÍTICO:
--   • Auth compartido con ConstruApps (clientes Google externos)
--   • NO usar TO authenticated — cualquier cliente de ConstruApps pasaría
--   • La validación es por email explícito en el JWT
--   • Service role (API routes) bypasea RLS — no se ve afectado
--   • Admin browser (anon key + JWT de Supabase Auth) sí pasa por RLS
--     → como el admin está autenticado, auth.jwt() ->> 'email' devuelve su email
--
-- CÓMO AGREGAR UN ADMIN FUTURO:
--   Solo modificar el ARRAY en is_admin() — afecta todas las políticas
--
-- ORDEN DE EJECUCIÓN:
--   1. PASO 0 — is_admin() (prerequisito de todo lo demás)
--   2. BLOQUE 1 — tablas secundarias (bajo riesgo)
--   3. Verificar checklist Bloque 1
--   4. BLOQUE 2 — tablas core del CRM (alto impacto)
--   5. Verificar checklist Bloque 2
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 0: Función helper is_admin()
-- CORRER ESTO PRIMERO — los bloques siguientes dependen de esta función
--
-- Por qué SECURITY DEFINER + search_path:
--   Sin SECURITY DEFINER, si el search_path del caller no incluye 'auth',
--   auth.jwt() puede no resolverse o devolver null silenciosamente.
--   Con SECURITY DEFINER + SET search_path, la función siempre corre con
--   'public' y 'auth' en scope sin importar quién la llama — y además
--   previene ataques de sustitución del search_path.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT (auth.jwt() ->> 'email') = ANY(ARRAY[
    'contacto@constructoracolombia.com'
    -- Para agregar un admin: ,'otro@email.com'
  ])
$$;

-- Verificación: correr como anon debe devolver false, como admin autenticado debe devolver true
-- SELECT public.is_admin();


-- ═══════════════════════════════════════════════════════════════════════════════
-- REVERSA BLOQUE 1 — GUARDAR ESTO ANTES DE CORRER EL BLOQUE 1
-- Restaura el estado anterior: tablas sin RLS o con política pública abierta
-- ═══════════════════════════════════════════════════════════════════════════════

/*
-- ROLLBACK BLOQUE 1 (pegar en SQL Editor si algo falla)

-- Estas 5 tablas no tenían RLS antes → deshabilitar elimina toda restricción
ALTER TABLE pauta_historial              DISABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos_manuales_guardados DISABLE ROW LEVEL SECURITY;
ALTER TABLE catalogos_precios            DISABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_items               DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversaciones_whatsapp      DISABLE ROW LEVEL SECURITY;

-- meta_campaign_insights tenía política pública → restaurarla
DROP POLICY IF EXISTS "admin_all" ON meta_campaign_insights;
CREATE POLICY "Permitir todo público meta_campaign_insights"
  ON meta_campaign_insights FOR ALL TO public
  USING (true) WITH CHECK (true);

-- notificaciones_admin tenía política pública → restaurarla
DROP POLICY IF EXISTS "admin_all" ON notificaciones_admin;
CREATE POLICY "public_access"
  ON notificaciones_admin FOR ALL TO public
  USING (true) WITH CHECK (true);
*/


-- ═══════════════════════════════════════════════════════════════════════════════
-- BLOQUE 1: Tablas secundarias (bajo riesgo)
-- Afecta: pauta_historial, presupuestos_manuales_guardados, catalogos_precios,
--         catalogo_items, conversaciones_whatsapp, meta_campaign_insights,
--         notificaciones_admin
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── pauta_historial ──────────────────────────────────────────────────────────
-- Leída/escrita desde app/(admin)/contenido (admin autenticado)
ALTER TABLE pauta_historial ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all" ON pauta_historial;
CREATE POLICY "admin_all" ON pauta_historial
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── presupuestos_manuales_guardados ──────────────────────────────────────────
-- Leída/escrita desde app/(admin)/presupuesto-manual (admin autenticado)
ALTER TABLE presupuestos_manuales_guardados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all" ON presupuestos_manuales_guardados;
CREATE POLICY "admin_all" ON presupuestos_manuales_guardados
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── catalogos_precios ────────────────────────────────────────────────────────
-- Leída desde app/(admin)/presupuesto-manual (admin autenticado)
ALTER TABLE catalogos_precios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all" ON catalogos_precios;
CREATE POLICY "admin_all" ON catalogos_precios
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── catalogo_items ───────────────────────────────────────────────────────────
-- Leída desde:
--   • app/(admin)/presupuesto-manual (admin autenticado) → pasa is_admin()
--   • components/ContratoModal (admin autenticado)       → pasa is_admin()
--   • /api/presupuesto/[token] (service role)            → bypasea RLS
-- Sin acceso anónimo directo a esta tabla desde el navegador.
ALTER TABLE catalogo_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all" ON catalogo_items;
CREATE POLICY "admin_all" ON catalogo_items
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── conversaciones_whatsapp ──────────────────────────────────────────────────
-- Escrita solo por /api/evolution-webhook (service role → bypasea RLS)
-- Solo leída desde admin panel (admin autenticado)
ALTER TABLE conversaciones_whatsapp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all" ON conversaciones_whatsapp;
CREATE POLICY "admin_all" ON conversaciones_whatsapp
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── meta_campaign_insights ───────────────────────────────────────────────────
-- Escrita por /api/meta-sync (service role → bypasea RLS)
DROP POLICY IF EXISTS "Permitir todo público meta_campaign_insights" ON meta_campaign_insights;
DROP POLICY IF EXISTS "admin_all" ON meta_campaign_insights;
CREATE POLICY "admin_all" ON meta_campaign_insights
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── notificaciones_admin ─────────────────────────────────────────────────────
-- Escrita por /api/evolution-webhook (service role → bypasea RLS)
DROP POLICY IF EXISTS "public_access" ON notificaciones_admin;
DROP POLICY IF EXISTS "admin_all" ON notificaciones_admin;
CREATE POLICY "admin_all" ON notificaciones_admin
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- CHECKLIST BLOQUE 1 — verificar antes de continuar al Bloque 2
-- ─────────────────────────────────────────────────────────────────────────────
-- [ ] Admin logueado → /admin/contenido → pauta_historial carga sin errores
-- [ ] Admin logueado → /admin/presupuesto-manual → catálogos y precios cargan
-- [ ] Admin logueado → guardar presupuesto manual → se guarda OK
-- [ ] Sin login → /p/[TOKEN_REAL] → presupuesto público carga (service role)
-- [ ] Sin login → /resumen → enviar cotización → llega a la BD (service role)
-- [ ] Supabase Logs → no hay errores 403/RLS en las tablas del Bloque 1
-- Si algo falla → correr ROLLBACK BLOQUE 1 de arriba
-- ─────────────────────────────────────────────────────────────────────────────




-- ═══════════════════════════════════════════════════════════════════════════════
-- REVERSA BLOQUE 2 — GUARDAR ESTO ANTES DE CORRER EL BLOQUE 2
-- ═══════════════════════════════════════════════════════════════════════════════

/*
-- ROLLBACK BLOQUE 2 (pegar en SQL Editor si algo falla)

-- leads: restaurar política pública original
DROP POLICY IF EXISTS "admin_all" ON leads;
CREATE POLICY "Permitir todo público leads"
  ON leads FOR ALL TO public
  USING (true) WITH CHECK (true);

-- lead_actividades: restaurar política pública original
DROP POLICY IF EXISTS "admin_all" ON lead_actividades;
CREATE POLICY "Permitir todo público actividades"
  ON lead_actividades FOR ALL TO public
  USING (true) WITH CHECK (true);

-- cotizaciones: restaurar las 3 políticas originales (INSERT + SELECT + UPDATE separadas)
DROP POLICY IF EXISTS "admin_all" ON cotizaciones;
CREATE POLICY "Permitir inserción pública"
  ON cotizaciones FOR INSERT TO public
  WITH CHECK (true);
CREATE POLICY "Permitir lectura pública"
  ON cotizaciones FOR SELECT TO public
  USING (true);
CREATE POLICY "Permitir actualización de cotizaciones"
  ON cotizaciones FOR UPDATE TO public
  USING (true);

-- presupuestos: restaurar política pública original
DROP POLICY IF EXISTS "admin_all" ON presupuestos;
CREATE POLICY "Permitir todo público presupuestos"
  ON presupuestos FOR ALL TO public
  USING (true) WITH CHECK (true);

-- contratos: no tenía RLS → deshabilitar
ALTER TABLE contratos DISABLE ROW LEVEL SECURITY;

-- notas_seguimiento: restaurar políticas originales
DROP POLICY IF EXISTS "admin_all" ON notas_seguimiento;
CREATE POLICY "Permitir inserción de notas"
  ON notas_seguimiento FOR INSERT TO public
  WITH CHECK (true);
CREATE POLICY "Permitir lectura de notas"
  ON notas_seguimiento FOR SELECT TO public
  USING (true);

-- historial_estados: no tenía RLS → deshabilitar
ALTER TABLE historial_estados DISABLE ROW LEVEL SECURITY;
*/


-- ═══════════════════════════════════════════════════════════════════════════════
-- BLOQUE 2: Tablas core del CRM
-- CORRER SOLO después de verificar el checklist del Bloque 1.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── leads ────────────────────────────────────────────────────────────────────
-- Escrito por /api/cotizacion y /api/evolution-webhook (service role)
-- Leído/editado desde admin panel (admin autenticado)
DROP POLICY IF EXISTS "Permitir todo público leads" ON leads;
DROP POLICY IF EXISTS "admin_all" ON leads;
CREATE POLICY "admin_all" ON leads
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── lead_actividades ─────────────────────────────────────────────────────────
-- Escrita por /api/evolution-webhook (service role) y admin panel
DROP POLICY IF EXISTS "Permitir todo público actividades" ON lead_actividades;
DROP POLICY IF EXISTS "admin_all" ON lead_actividades;
CREATE POLICY "admin_all" ON lead_actividades
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── cotizaciones ─────────────────────────────────────────────────────────────
-- Escritas/actualizadas por /api/cotizacion (service role)
-- Leídas desde admin panel (admin autenticado)
DROP POLICY IF EXISTS "Permitir inserción pública" ON cotizaciones;
DROP POLICY IF EXISTS "Permitir lectura pública" ON cotizaciones;
DROP POLICY IF EXISTS "Permitir actualización de cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "admin_all" ON cotizaciones;
CREATE POLICY "admin_all" ON cotizaciones
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── presupuestos ─────────────────────────────────────────────────────────────
-- Leídos por /api/presupuesto/[token] (service role)
-- Actualizados por /api/track-view (service role)
-- Creados/editados desde admin panel (admin autenticado)
DROP POLICY IF EXISTS "Permitir todo público presupuestos" ON presupuestos;
DROP POLICY IF EXISTS "admin_all" ON presupuestos;
CREATE POLICY "admin_all" ON presupuestos
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── contratos ────────────────────────────────────────────────────────────────
-- Leído/escrito por ContratoModal (browser admin con JWT → pasa is_admin())
-- ContratoModal solo se monta dentro de app/(admin)
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all" ON contratos;
CREATE POLICY "admin_all" ON contratos
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── notas_seguimiento ────────────────────────────────────────────────────────
-- Nota: "Permitir actualización de cotizaciones" en esta tabla es error de copy-paste
-- histórico — se elimina junto con las demás políticas abiertas
DROP POLICY IF EXISTS "Permitir inserción de notas" ON notas_seguimiento;
DROP POLICY IF EXISTS "Permitir lectura de notas" ON notas_seguimiento;
DROP POLICY IF EXISTS "Permitir actualización de cotizaciones" ON notas_seguimiento;
DROP POLICY IF EXISTS "admin_all" ON notas_seguimiento;
CREATE POLICY "admin_all" ON notas_seguimiento
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── historial_estados ────────────────────────────────────────────────────────
-- Escrito desde admin panel al mover leads entre columnas (admin autenticado)
ALTER TABLE historial_estados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all" ON historial_estados;
CREATE POLICY "admin_all" ON historial_estados
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- CHECKLIST BLOQUE 2 — verificar después de correr
-- ─────────────────────────────────────────────────────────────────────────────
-- [ ] Admin logueado → CRM principal → kanban de leads carga completo
-- [ ] Admin logueado → abrir un lead → actividades y notas visibles
-- [ ] Admin logueado → mover lead de columna → sin errores
-- [ ] Admin logueado → Panel Analytics (/admin) → cotizaciones y KPIs cargan
-- [ ] Admin logueado → generar contrato → ContratoModal abre, carga presupuesto,
--                      número siguiente correcto, guarda OK
-- [ ] Sin login → /resumen → cotización se crea → aparece en CRM
-- [ ] Sin login → /p/[TOKEN_REAL] → carga y registra veces_visto
-- [ ] Sin login → Supabase Table Editor → SELECT en leads → 0 filas (RLS activo)
-- Si algo falla → correr ROLLBACK BLOQUE 2 de arriba
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════════════
-- LIMPIEZA POST-ESTABILIZACIÓN (NO ejecutar ahora)
-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Vercel env vars → eliminar NEXT_PUBLIC_DASHBOARD_PASSWORD (ya no existe en código)
-- 2. Opcional — revocar grants directos al rol anon (segunda capa de defensa):
--      REVOKE ALL ON leads FROM anon;
--      REVOKE ALL ON cotizaciones FROM anon;
--      ... (una por tabla)
--    Redundante mientras RLS esté activo, pero añade profundidad de defensa.
--    Solo aplicar cuando la operación sea 100% estable con el nuevo auth.
-- ═══════════════════════════════════════════════════════════════════════════════
