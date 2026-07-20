-- SEED APUs — Parte 4 de 4 (APUs 7.3 a 7.14, 5 registros)

BEGIN;

-- 7.3 Cerradura inteligente con enchape de madera interno
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.3', 'Cerradura inteligente con enchape de madera interno', 300000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Cerradura inteligente instalada', 'und', 1, 600000, 0),
  ((SELECT id FROM nuevo), 'Enchape interno de puerta',       'und', 1, 400000, 1),
  ((SELECT id FROM nuevo), 'Transporte',                      'und', 0,  50000, 2);

-- 7.7 Punto de gas independiente para horno (placeholder)
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.7', 'Punto de gas independiente para horno', 0, 10)
  RETURNING id
)
SELECT id FROM nuevo;

-- 7.11 Diseño Drywall iluminado habitación principal (placeholder)
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.11', 'Diseño Drywall iluminado habitación principal', 0, 10)
  RETURNING id
)
SELECT id FROM nuevo;

-- 7.12 Diseño Drywall iluminado sala (placeholder)
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.12', 'Diseño Drywall iluminado sala', 0, 10)
  RETURNING id
)
SELECT id FROM nuevo;

-- 7.14 Ampliación de balcón (placeholder)
-- MDO=259.200 conservado. Materiales pendientes de revisión manual.
-- El archivo fuente tenía cantidad=86.400 generando costo irreal (~$5.944M).
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.14', 'Ampliación de balcón', 259200, 10)
  RETURNING id
)
SELECT id FROM nuevo;

COMMIT;

-- Verificar: SELECT codigo, nombre FROM apus ORDER BY created_at DESC LIMIT 5;
