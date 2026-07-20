-- ═══════════════════════════════════════════════════════════════════════════════
-- BACKFILL: precios_snapshot → precio final (costo × 1.20)
--
-- PROBLEMA ACTUAL:
--   precios_snapshot guarda valor_venta (costo, sin markup)
--   p/[token] aplica × 1.20 al renderizar → cambiar el % rompe presupuestos ya enviados
--
-- FIX:
--   Multiplicar cada valor del snapshot por 1.20 (una sola vez)
--   Después de esto, p/[token] usará snap directamente (sin multiplicar)
--   Los presupuestos nuevos también guardarán el precio final en snapshot
--
-- ORDEN DE EJECUCIÓN:
--   1. Correr PASO 1 (queries de diagnóstico) → reportar resultados
--   2. Correr PASO 2 (validación Juan V2 en transacción ROLLBACK) → confirmar
--   3. Solo si PASO 2 OK → correr PASO 3 (backfill real)
--   4. Después del PASO 3 → hacer deploy del código que quita el × 1.20
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: Diagnóstico — cuántos registros hay y cuáles tienen contrato
-- CORRER EN SUPABASE SQL EDITOR. No modifica datos.
-- ─────────────────────────────────────────────────────────────────────────────

-- Conteos generales
SELECT
  (SELECT COUNT(*) FROM presupuestos)                     AS total_presupuestos,
  (SELECT COUNT(*) FROM contratos)                        AS total_contratos,
  (SELECT COUNT(DISTINCT presupuesto_id) FROM contratos)  AS presupuestos_con_contrato;

-- Listado de presupuestos con contrato (los más sensibles)
SELECT
  p.id              AS presupuesto_id,
  p.nombre_cliente,
  p.version_num,
  p.total_final,
  p.created_at::date AS fecha,
  c.numero_contrato
FROM presupuestos p
JOIN contratos c ON c.presupuesto_id = p.id
ORDER BY p.created_at DESC;

-- Todos los presupuestos (para tener el panorama completo)
SELECT
  id,
  nombre_cliente,
  version_num,
  total_final,
  estado,
  created_at::date AS fecha,
  jsonb_object_keys(seleccionados)  -- muestra los item IDs seleccionados
FROM presupuestos
ORDER BY created_at DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: Validación backfill sobre presupuestos con contrato — ROLLBACK AL FINAL
--
-- Copia este bloque completo y pégalo en una pestaña NUEVA de Supabase SQL Editor.
-- El ROLLBACK final deshace todo — ningún dato queda modificado en producción.
--
-- Valida los 2 presupuestos con contrato:
--   • Aplica ×1.20 al snapshot dentro del CTE writable
--   • Reconstruye: base_efectiva + subtotal_snap_nuevo
--   • Compara contra total_final guardado en DB (= lo que aparece en el contrato)
--   • Semáforo: OK | REDONDEO | DIFERENCIA
--
-- Solo avanzar al PASO 3 si "semaforo" = 'OK' en los 2 registros.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

WITH

-- 1. Aplicar backfill dentro del CTE (el ROLLBACK deshace este UPDATE)
backfill AS (
  UPDATE presupuestos
  SET precios_snapshot = (
    SELECT jsonb_object_agg(
      key,
      ROUND((value #>> '{}')::numeric * 1.20)::numeric
    )
    FROM jsonb_each(precios_snapshot) AS t(key, value)
  )
  WHERE precios_snapshot != '{}'::jsonb
  RETURNING
    id,
    nombre_cliente,
    version_num,
    total_final,
    precio_manual,
    precio_base,
    precios_snapshot
),

-- 2. Calcular subtotal del snapshot ya actualizado
subtotales AS (
  SELECT
    b.id,
    b.nombre_cliente,
    b.version_num,
    b.total_final,
    COALESCE(b.precio_manual, b.precio_base, 0)          AS base_efectiva,
    COALESCE(
      (SELECT SUM((val #>> '{}')::numeric)
       FROM jsonb_each(b.precios_snapshot) AS t(k, val)),
      0
    )                                                     AS subtotal_snap_nuevo
  FROM backfill b
)

-- 3. Resultado: solo los presupuestos que tienen contrato generado
SELECT
  s.nombre_cliente,
  s.version_num,
  c.numero_contrato,
  s.base_efectiva,
  s.subtotal_snap_nuevo,
  s.base_efectiva + s.subtotal_snap_nuevo                AS total_reconstruido,
  s.total_final                                          AS total_guardado_db,
  s.total_final - (s.base_efectiva + s.subtotal_snap_nuevo) AS diferencia,
  CASE
    WHEN s.total_final - (s.base_efectiva + s.subtotal_snap_nuevo) = 0
      THEN 'OK — backfill seguro'
    WHEN ABS(s.total_final - (s.base_efectiva + s.subtotal_snap_nuevo)) <= 500
      THEN 'REDONDEO — aceptable'
    ELSE
      'DIFERENCIA SIGNIFICATIVA — NO proceder con PASO 3'
  END                                                    AS semaforo
FROM subtotales s
JOIN contratos c ON c.presupuesto_id = s.id
ORDER BY s.nombre_cliente, s.version_num;

ROLLBACK;

-- ─────────────────────────────────────────────────────────────────────────────
-- Cómo interpretar los resultados:
--
--   total_reconstruido = base_efectiva + subtotal_snap_nuevo (snap ya con ×1.20)
--   total_guardado_db  = lo que Supabase tiene como total_final (= el contrato)
--   diferencia         = 0 ideal; ≤500 por redondeo es aceptable
--
-- Si "diferencia" es grande (>500):
--   • Verificar si hay items_manuales que contribuyen al total_final
--   • items_manuales no están en precios_snapshot → no se backfillan → crean desfase
--   • En ese caso reportar antes de proceder con PASO 3
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: Backfill real — SOLO correr después de validar PASO 2
--
-- Multiplica cada valor de precios_snapshot por 1.20 en TODOS los presupuestos.
-- Después de este paso: hacer deploy del código que quita el × 1.20 del render.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Verificar cuántos registros se van a tocar antes de ejecutar
SELECT COUNT(*) AS registros_a_actualizar
FROM presupuestos
WHERE precios_snapshot != '{}'::jsonb;

-- Aplicar backfill
UPDATE presupuestos
SET precios_snapshot = (
  SELECT jsonb_object_agg(
    key,
    ROUND((value #>> '{}')::numeric * 1.20)::numeric
  )
  FROM jsonb_each(precios_snapshot) AS t(key, value)
)
WHERE precios_snapshot != '{}'::jsonb;  -- skip presupuestos sin ítems (no tocar)

-- Verificación post-backfill: muestra valores antes/después para los contratos
-- (los más sensibles)
SELECT
  p.nombre_cliente,
  p.version_num,
  p.total_final,
  snap.key                              AS item_id,
  (snap.value #>> '{}')::numeric        AS snap_nuevo,
  (snap.value #>> '{}')::numeric / 1.20 AS snap_original_estimado
FROM presupuestos p
JOIN contratos c ON c.presupuesto_id = p.id
CROSS JOIN jsonb_each(p.precios_snapshot) AS snap(key, value)
ORDER BY p.nombre_cliente, snap.key;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- DESPUÉS DEL PASO 3: cambios de código que van con el deploy
-- (No son SQL — van en los archivos TypeScript)
--
-- app/p/[token]/page.tsx:130
--   ANTES: const precio = Math.round(snap * 1.20);
--   DESPUÉS: const precio = snap;
--
-- app/(admin)/presupuesto-manual/page.tsx — 5 ocurrencias de * 1.20:
--   ANTES: Math.round(i.valor_venta * 1.20)
--   DESPUÉS: Math.round(i.valor_venta * (1 + utilidadPct / 100))
--   + Leer utilidadPct desde config_precios al montar el componente
--   + En snapshot: precios_snapshot[item.id] = Math.round(item.valor_venta * (1 + utilidadPct/100))
--
-- Estos cambios van en el MISMO deploy que sigue al PASO 3.
-- ─────────────────────────────────────────────────────────────────────────────
