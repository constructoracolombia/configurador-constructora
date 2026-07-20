-- SEED APUs — Parte 3 de 4 (APUs 3.1 a 7.2, 6 registros)

BEGIN;

-- 3.1 ENCHAPE DE SALPICADERO
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('3.1', 'ENCHAPE DE SALPICADERO', 250000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)', 'und', 3, 40000, 0),
  ((SELECT id FROM nuevo), 'Pegante',      'und', 2, 16000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',     'und', 1, 33000, 2);

-- 3.1 ENCHAPE DE MURO COCINA COMPLETO
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('3.1', 'ENCHAPE DE MURO COCINA COMPLETO', 100000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)', 'und', 10, 40000, 0),
  ((SELECT id FROM nuevo), 'Pegante',      'und',  2, 16000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',     'und',  0, 33000, 2);

-- 4.1 ENCHAPE ZONA HÚMEDA
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('4.1', 'ENCHAPE ZONA HÚMEDA', 450000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)', 'und', 15, 40000, 0),
  ((SELECT id FROM nuevo), 'Pegante',      'und',  4, 15000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',     'und',  1, 33000, 2);

-- 6.1 Luminarias Led
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('6.1', 'Luminarias Led', 100000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Luminarias Led',      'und', 9,   7000, 0),
  ((SELECT id FROM nuevo), 'Transporte',          'und', 0,  10000, 1),
  ((SELECT id FROM nuevo), '20% Gasolina al mes', 'und', 1, 120000, 2),
  ((SELECT id FROM nuevo), '20% Taxis al mes',    'und', 1,  80000, 3);

-- 7.1 Tubería de agua caliente a duchas - sin calentador (placeholder)
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.1', 'Tubería de agua caliente a duchas - sin calentador', 0, 10)
  RETURNING id
)
SELECT id FROM nuevo;

-- 7.2 Tubería de agua caliente a duchas - con calentador
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.2', 'Tubería de agua caliente a duchas - con calentador', 1200000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Calentador', 'und', 1, 850000, 0);

COMMIT;

-- Verificar: SELECT codigo, nombre FROM apus ORDER BY created_at DESC LIMIT 6;
