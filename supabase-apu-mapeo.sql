-- ═══════════════════════════════════════════════════════════════════════════════
-- APU ↔ CATALOGO_ITEMS — Mapeo por similitud de nombre
--
-- PASO 1: Correr el SELECT de diagnóstico y revisar los matches con Javier.
-- PASO 2: Aprobar cada fila y correr el UPDATE correspondiente.
--
-- IMPORTANTE: un ítem con apu_id NO cambia su valor_venta automáticamente.
--   El valor_venta sigue siendo el campo de referencia en el presupuestador.
--   La FK apu_id sirve para:
--     (a) saber qué APU respalda ese precio
--     (b) actualizar valor_venta desde la pantalla /apus cuando el APU cambia
--   Actualizar valor_venta desde el APU es un paso manual en /catálogo.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: Diagnóstico — candidatos de mapeo
-- Muestra: item del catálogo → APU propuesto → costo_apu calculado
-- Revisar con Javier antes de ejecutar el UPDATE.
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  ci.id          AS item_id,
  ci.codigo      AS item_codigo,
  ci.nombre      AS item_nombre,
  ci.valor_venta AS item_valor_venta_actual,
  a.id           AS apu_id_propuesto,
  a.codigo       AS apu_codigo,
  a.nombre       AS apu_nombre,
  v.costo_apu    AS apu_costo_calculado,
  -- diferencia entre costo_apu y valor_venta actual del ítem
  v.costo_apu - ci.valor_venta AS delta
FROM catalogo_items ci
JOIN apus a ON (
  -- Mapeos directos por nombre de APU conocido
  -- (ajustar si los nombres en catalogo_items difieren)
       (ci.nombre ILIKE '%estuco%'                   AND a.codigo = '1.1')
  OR   (ci.nombre ILIKE '%pintura%'                  AND a.codigo = '1.2')
  OR   (ci.nombre ILIKE '%mortero%'                  AND a.codigo = '1.3')
  OR   (ci.nombre ILIKE '%porcelanato%'              AND a.codigo = '1.4' AND a.nombre ILIKE '%porcelanato%')
  OR   (ci.nombre ILIKE '%cerámica%' AND ci.nombre ILIKE '%piso%' AND a.codigo = '1.4' AND a.nombre ILIKE '%cerámica%')
  OR   (ci.nombre ILIKE '%drywall%' AND (ci.nombre ILIKE '%baño%' OR ci.nombre ILIKE '%cocina%') AND a.codigo = '1.5')
  OR   (ci.nombre ILIKE '%demolición%'               AND a.codigo = '2.0')
  OR   (ci.nombre ILIKE '%enchape%' AND ci.nombre ILIKE '%baño%' AND ci.nombre NOT ILIKE '%complement%' AND a.codigo = '2.1' AND a.nombre NOT ILIKE '%complement%')
  OR   (ci.nombre ILIKE '%complement%' AND ci.nombre ILIKE '%baño%' AND a.codigo = '2.1' AND a.nombre ILIKE '%complement%')
  OR   (ci.nombre ILIKE '%nicho%'                    AND a.codigo = '2.2')
  OR   (ci.nombre ILIKE '%combo%' AND ci.nombre ILIKE '%básico%'   AND a.codigo = '2.3/2.4' AND a.nombre ILIKE '%básico%')
  OR   (ci.nombre ILIKE '%combo%' AND ci.nombre ILIKE '%premium%'  AND a.codigo = '2.3/2.4' AND a.nombre ILIKE '%premium%')
  OR   (ci.nombre ILIKE '%salpicadero%'              AND a.codigo = '3.1' AND a.nombre ILIKE '%salpicadero%')
  OR   (ci.nombre ILIKE '%muro%' AND ci.nombre ILIKE '%cocina%'    AND a.codigo = '3.1' AND a.nombre ILIKE '%muro%')
  OR   (ci.nombre ILIKE '%zona húmeda%'              AND a.codigo = '4.1')
  OR   (ci.nombre ILIKE '%luminaria%'                AND a.codigo = '6.1')
  OR   (ci.nombre ILIKE '%calentador%' AND ci.nombre ILIKE '%sin%' AND a.codigo = '7.1')
  OR   (ci.nombre ILIKE '%calentador%' AND ci.nombre ILIKE '%con%' AND a.codigo = '7.2')
  OR   (ci.nombre ILIKE '%cerradura%'                AND a.codigo = '7.3')
  OR   (ci.nombre ILIKE '%gas%' AND ci.nombre ILIKE '%horno%'      AND a.codigo = '7.7')
  OR   (ci.nombre ILIKE '%drywall%' AND ci.nombre ILIKE '%habitación%' AND a.codigo = '7.11')
  OR   (ci.nombre ILIKE '%drywall%' AND ci.nombre ILIKE '%sala%'   AND a.codigo = '7.12')
  OR   (ci.nombre ILIKE '%balcón%'                   AND a.codigo = '7.14')
)
JOIN v_apus_calculados v ON v.id = a.id
ORDER BY a.codigo, a.nombre;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: Aplicar el mapeo (correr DESPUÉS de revisar el PASO 1)
--
-- Vincula cada catalogo_item con su APU.
-- NO modifica valor_venta — eso es un paso manual separado si se desea.
-- ─────────────────────────────────────────────────────────────────────────────

/*
BEGIN;

UPDATE catalogo_items ci
SET apu_id = a.id
FROM apus a
WHERE (
       (ci.nombre ILIKE '%estuco%'                   AND a.codigo = '1.1')
  OR   (ci.nombre ILIKE '%pintura%'                  AND a.codigo = '1.2')
  OR   (ci.nombre ILIKE '%mortero%'                  AND a.codigo = '1.3')
  OR   (ci.nombre ILIKE '%porcelanato%'              AND a.codigo = '1.4' AND a.nombre ILIKE '%porcelanato%')
  OR   (ci.nombre ILIKE '%cerámica%' AND ci.nombre ILIKE '%piso%' AND a.codigo = '1.4' AND a.nombre ILIKE '%cerámica%')
  OR   (ci.nombre ILIKE '%drywall%' AND (ci.nombre ILIKE '%baño%' OR ci.nombre ILIKE '%cocina%') AND a.codigo = '1.5')
  OR   (ci.nombre ILIKE '%demolición%'               AND a.codigo = '2.0')
  OR   (ci.nombre ILIKE '%enchape%' AND ci.nombre ILIKE '%baño%' AND ci.nombre NOT ILIKE '%complement%' AND a.codigo = '2.1' AND a.nombre NOT ILIKE '%complement%')
  OR   (ci.nombre ILIKE '%complement%' AND ci.nombre ILIKE '%baño%' AND a.codigo = '2.1' AND a.nombre ILIKE '%complement%')
  OR   (ci.nombre ILIKE '%nicho%'                    AND a.codigo = '2.2')
  OR   (ci.nombre ILIKE '%combo%' AND ci.nombre ILIKE '%básico%'   AND a.codigo = '2.3/2.4' AND a.nombre ILIKE '%básico%')
  OR   (ci.nombre ILIKE '%combo%' AND ci.nombre ILIKE '%premium%'  AND a.codigo = '2.3/2.4' AND a.nombre ILIKE '%premium%')
  OR   (ci.nombre ILIKE '%salpicadero%'              AND a.codigo = '3.1' AND a.nombre ILIKE '%salpicadero%')
  OR   (ci.nombre ILIKE '%muro%' AND ci.nombre ILIKE '%cocina%'    AND a.codigo = '3.1' AND a.nombre ILIKE '%muro%')
  OR   (ci.nombre ILIKE '%zona húmeda%'              AND a.codigo = '4.1')
  OR   (ci.nombre ILIKE '%luminaria%'                AND a.codigo = '6.1')
  OR   (ci.nombre ILIKE '%calentador%' AND ci.nombre ILIKE '%sin%' AND a.codigo = '7.1')
  OR   (ci.nombre ILIKE '%calentador%' AND ci.nombre ILIKE '%con%' AND a.codigo = '7.2')
  OR   (ci.nombre ILIKE '%cerradura%'                AND a.codigo = '7.3')
  OR   (ci.nombre ILIKE '%gas%' AND ci.nombre ILIKE '%horno%'      AND a.codigo = '7.7')
  OR   (ci.nombre ILIKE '%drywall%' AND ci.nombre ILIKE '%habitación%' AND a.codigo = '7.11')
  OR   (ci.nombre ILIKE '%drywall%' AND ci.nombre ILIKE '%sala%'   AND a.codigo = '7.12')
  OR   (ci.nombre ILIKE '%balcón%'                   AND a.codigo = '7.14')
)
AND ci.apu_id IS NULL;  -- solo tocar ítems sin APU asignado

-- Cuántos quedaron vinculados
SELECT COUNT(*) AS items_vinculados FROM catalogo_items WHERE apu_id IS NOT NULL;

-- Cuántos quedaron sin APU (los que no tienen match exacto)
SELECT id, codigo, nombre FROM catalogo_items WHERE apu_id IS NULL ORDER BY nombre;

COMMIT;
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3 (opcional): Sincronizar valor_venta con costo_apu
--
-- Solo si se aprueba actualizar el precio de costo del catálogo desde el APU.
-- Esto afecta TODOS los presupuestos futuros que usen ese ítem.
-- Los presupuestos ya guardados usan su snapshot — no se ven afectados.
-- ─────────────────────────────────────────────────────────────────────────────

/*
BEGIN;

UPDATE catalogo_items ci
SET valor_venta = v.costo_apu
FROM v_apus_calculados v
WHERE ci.apu_id = v.id
  AND ci.valor_venta <> v.costo_apu;  -- solo tocar si hay diferencia

SELECT ci.nombre, ci.valor_venta AS nuevo_valor_venta, v.costo_apu
FROM catalogo_items ci
JOIN v_apus_calculados v ON v.id = ci.apu_id
ORDER BY ci.nombre;

COMMIT;
*/
