-- SEED APUs — Parte 2 de 4 (APUs 2.0 a 2.3/2.4 Premium, 6 registros)

BEGIN;

-- 2.0 Demolición enchape existente
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('2.0', 'Demolición enchape existente', 120000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Retiro de escombros', 'und', 1, 80000, 0);

-- 2.1 ENCHAPE DE BAÑO PRINCIPAL/SECUNDARIO
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('2.1', 'ENCHAPE DE BAÑO PRINCIPAL/SECUNDARIO', 400000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)', 'und', 16, 70000, 0),
  ((SELECT id FROM nuevo), 'Pegante',      'und',  7, 33000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',     'und',  1, 33000, 2),
  ((SELECT id FROM nuevo), 'Transporte',   'und',  0, 40000, 3);

-- 2.1 COMPLEMENTO ENCHAPE DE BAÑO SECUNDARIO
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('2.1', 'COMPLEMENTO ENCHAPE DE BAÑO SECUNDARIO', 400000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)', 'und', 9, 40000, 0),
  ((SELECT id FROM nuevo), 'Pegante',      'und', 4, 16000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',     'und', 1, 33000, 2),
  ((SELECT id FROM nuevo), 'Transporte',   'und', 0, 40000, 3);

-- 2.2 Nicho iluminado
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('2.2', 'Nicho iluminado', 150000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Ojo de buey', 'und',  2, 9000, 0),
  ((SELECT id FROM nuevo), 'Cable',       'und', 15, 4000, 1);

-- 2.3/2.4 Instalación Combo básico
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('2.3/2.4', 'Instalación Combo básico', 300000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Combo básico',     'und', 1, 450000, 0),
  ((SELECT id FROM nuevo), 'Silicona',         'und', 2,  12000, 1),
  ((SELECT id FROM nuevo), 'Sifón',            'und', 1,  30000, 2),
  ((SELECT id FROM nuevo), 'Cemento blanco',   'und', 1,  20000, 3),
  ((SELECT id FROM nuevo), 'Llave reguladora', 'und', 2,  20000, 4),
  ((SELECT id FROM nuevo), 'Transporte',       'und', 0,  40000, 5);

-- 2.3/2.4 Instalación Combo Premium
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('2.3/2.4', 'Instalación Combo Premium', 300000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Combo premium',    'und', 1, 1000000, 0),
  ((SELECT id FROM nuevo), 'Silicona',         'und', 2,   12000, 1),
  ((SELECT id FROM nuevo), 'Sifón',            'und', 1,   30000, 2),
  ((SELECT id FROM nuevo), 'Cemento blanco',   'und', 1,   20000, 3),
  ((SELECT id FROM nuevo), 'Llave reguladora', 'und', 2,   20000, 4),
  ((SELECT id FROM nuevo), 'Transporte',       'und', 0,   40000, 5);

COMMIT;

-- Verificar: SELECT codigo, nombre FROM apus ORDER BY created_at DESC LIMIT 6;
