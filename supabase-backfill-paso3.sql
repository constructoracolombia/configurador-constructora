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

-- Verificación post-UPDATE: los presupuestos con contrato
--
-- NOTA: precios_snapshot es un price book completo (todos los ítems del catálogo).
-- La fórmula correcta une snapshot con seleccionados para obtener solo los ítems
-- que el cliente eligió, multiplicados por su cantidad. Sumar todo el snapshot
-- daría ~3x el total real (suma el catálogo entero).
SELECT
  p.nombre_cliente,
  p.version_num,
  c.numero_contrato,
  p.total_final                                                    AS total_db,
  COALESCE(p.precio_manual, p.precio_base, 0)                      AS base_efectiva,
  -- Subtotal correcto: solo ítems seleccionados × cantidad
  COALESCE(
    (SELECT SUM(
       (snap.value #>> '{}')::numeric
       * COALESCE((sel.value #>> '{}')::numeric, 1)
     )
     FROM jsonb_each(p.seleccionados)    AS sel(key, value)
     JOIN jsonb_each(p.precios_snapshot) AS snap ON snap.key = sel.key),
    0
  )                                                                AS subtotal_seleccionados,
  -- Total reconstruido = base + adicionales seleccionados
  -- (items_manuales van aparte en el render, no en precios_snapshot)
  COALESCE(p.precio_manual, p.precio_base, 0) + COALESCE(
    (SELECT SUM(
       (snap.value #>> '{}')::numeric
       * COALESCE((sel.value #>> '{}')::numeric, 1)
     )
     FROM jsonb_each(p.seleccionados)    AS sel(key, value)
     JOIN jsonb_each(p.precios_snapshot) AS snap ON snap.key = sel.key),
    0
  )                                                                AS total_reconstruido,
  p.total_final - (
    COALESCE(p.precio_manual, p.precio_base, 0) + COALESCE(
      (SELECT SUM(
         (snap.value #>> '{}')::numeric
         * COALESCE((sel.value #>> '{}')::numeric, 1)
       )
       FROM jsonb_each(p.seleccionados)    AS sel(key, value)
       JOIN jsonb_each(p.precios_snapshot) AS snap ON snap.key = sel.key),
      0
    )
  )                                                                AS diferencia
FROM presupuestos p
JOIN contratos c ON c.presupuesto_id = p.id
ORDER BY p.nombre_cliente;

COMMIT;

-- Si "diferencia" ≠ 0:
--   • Diferencia = subtotal de items_manuales → normal (van fuera del snapshot)
--   • Diferencia > subtotal_manuales → investigar antes de considerar OK
