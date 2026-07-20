-- SEED APUs — Parte 1 de 4 (APUs 1.1 a 1.5, 6 registros)

BEGIN;

-- 1.1 ESTUCAR APARTAMENTO CIUDADELA VERDE (44 m2)
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.1', 'ESTUCAR APARTAMENTO CIUDADELA VERDE (44 m2)', 800000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Yeso',       'Bulto',  7,  32000, 0),
  ((SELECT id FROM nuevo), 'Caolín',     'Bulto', 14,  11000, 1),
  ((SELECT id FROM nuevo), 'Cemento',    'Bulto',  1,  33000, 2),
  ((SELECT id FROM nuevo), 'Esquineros', 'Unidad',15,   7000, 3),
  ((SELECT id FROM nuevo), 'Transporte', 'Global', 0,  40000, 4),
  ((SELECT id FROM nuevo), 'Ivercryl',   '3 Kg',   1,  38000, 5);

-- 1.2 PINTURA A 3 MANOS
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.2', 'PINTURA A 3 MANOS', 650000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Pintura tipo 2', 'Cuñete', 2, 125000, 0),
  ((SELECT id FROM nuevo), 'Pintura tipo 1', 'Cuñete', 1, 260000, 1),
  ((SELECT id FROM nuevo), 'Supermastick',   'Cuñete', 1,  60000, 2),
  ((SELECT id FROM nuevo), 'Rodillos',       'Unidad', 2,  10000, 3),
  ((SELECT id FROM nuevo), 'Brochas',        'Unidad', 1,   9000, 4),
  ((SELECT id FROM nuevo), 'Lijas',          'Unidad', 5,   2000, 5),
  ((SELECT id FROM nuevo), 'Transporte',     'Global', 0,  40000, 6);

-- 1.3 MORTERO DE NIVELACIÓN IMPERMEABILIZADO
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.3', 'MORTERO DE NIVELACIÓN IMPERMEABILIZADO', 450000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Arena (m3)',  'Bulto',  4, 100000, 0),
  ((SELECT id FROM nuevo), 'Cemento',     'Bulto', 14,  33000, 1),
  ((SELECT id FROM nuevo), 'Mapei',       'Unidad', 1, 200000, 2),
  ((SELECT id FROM nuevo), 'Transporte',  'und',    0,  20000, 3);

-- 1.4 ENCHAPE DE PISO CERÁMICA + GUARDAESCOBAS + BALCÓN
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.4', 'ENCHAPE DE PISO CERÁMICA + GUARDAESCOBAS + BALCÓN', 1500000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)',          'und', 52, 40000, 0),
  ((SELECT id FROM nuevo), 'Pegante ceramica 25kg', 'und', 15, 16000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',              'und',  2, 33000, 2),
  ((SELECT id FROM nuevo), 'Distanciadores',        'und',  1, 40000, 3),
  ((SELECT id FROM nuevo), 'Transporte',            'und',  0, 80000, 4);

-- 1.4 ENCHAPE DE PISO PORCELANATO + GUARDAESCOBAS + BALCÓN
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.4', 'ENCHAPE DE PISO PORCELANATO + GUARDAESCOBAS + BALCÓN', 1500000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)',             'und', 49, 60000, 0),
  ((SELECT id FROM nuevo), 'Pegante porcelanato 25kg', 'und', 15, 30000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',                 'und',  2, 33000, 2),
  ((SELECT id FROM nuevo), 'Distanciadores',           'und',  1, 40000, 3),
  ((SELECT id FROM nuevo), 'Transporte',               'und',  0, 80000, 4);

-- 1.5 Drywall en baños y cocina
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.5', 'Drywall en baños y cocina', 300000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Perfiles', 'und', 1, 0, 0);

COMMIT;

-- Verificar: SELECT codigo, nombre FROM apus ORDER BY created_at DESC LIMIT 6;
