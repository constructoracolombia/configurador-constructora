-- ═══════════════════════════════════════════════════════════════════════════════
-- BACKFILL PASO 3 — PRODUCCIÓN (irreversible)
--
-- PRERREQUISITO: haber ejecutado y validado el PASO 2 (ROLLBACK) sin diferencias.
-- CONSECUENCIA INMEDIATA: los presupuestos ya guardados pasarán a mostrar precios
--   correctos SOLO si el deploy del código (sin ×1.20 en p/[token]) va en el
--   MISMO push. Si el código viejo sigue activo después de este UPDATE, los
--   precios de los presupuestos públicos se DUPLICARÁN.
--
-- ORDEN DE EJECUCIÓN:
--   1. Deploy a Vercel (código nuevo) — esperar a que esté activo
--   2. Correr este SQL — los snapshots quedan con precio final
--   No correr en orden inverso.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Cuántos registros se van a tocar
SELECT COUNT(*) AS registros_a_actualizar
FROM presupuestos
WHERE precios_snapshot != '{}'::jsonb;

-- Aplicar × 1.20 a cada valor del snapshot
UPDATE presupuestos
SET precios_snapshot = (
  SELECT jsonb_object_agg(
    key,
    ROUND((value #>> '{}')::numeric * 1.20)::numeric
  )
  FROM jsonb_each(precios_snapshot) AS t(key, value)
)
WHERE precios_snapshot != '{}'::jsonb;

-- Verificación post-UPDATE: los 2 presupuestos con contrato
SELECT
  p.nombre_cliente,
  p.version_num,
  c.numero_contrato,
  p.total_final                                                    AS total_db,
  COALESCE(p.precio_manual, p.precio_base, 0)                      AS base_efectiva,
  COALESCE(
    (SELECT SUM((v #>> '{}')::numeric)
     FROM jsonb_each(p.precios_snapshot) AS t(k, v)), 0
  )                                                                AS subtotal_snap_nuevo,
  p.total_final - (
    COALESCE(p.precio_manual, p.precio_base, 0) +
    COALESCE(
      (SELECT SUM((v #>> '{}')::numeric)
       FROM jsonb_each(p.precios_snapshot) AS t(k, v)), 0
    )
  )                                                                AS diferencia
FROM presupuestos p
JOIN contratos c ON c.presupuesto_id = p.id
ORDER BY p.nombre_cliente;

COMMIT;

-- Si "diferencia" ≠ 0 después del COMMIT → investigar items_manuales.
-- Los items_manuales se suman aparte en el render y no están en precios_snapshot,
-- por lo que una diferencia igual al subtotal de items_manuales es normal y esperada.
