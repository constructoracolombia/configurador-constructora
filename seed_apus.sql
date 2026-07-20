-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: 23 APUs extraídos del Excel — Constructora Colombia
-- Cadena: materiales + MDO = costo_directo; ×(1+AI%) = costo_apu
-- El % de utilidad global es configurable en config_precios — NO va aquí.
--
-- PREREQUISITO: correr supabase-apu-schema.sql primero.
-- IDEMPOTENTE: usar ON CONFLICT o borrar antes si se requiere re-seed.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1.1 ESTUCAR APARTAMENTO CIUDADELA VERDE (44 m2)
-- Costo directo: (7×32k + 14×11k + 1×33k + 15×7k + 0×40k + 1×38k) + 800k
--              = (224k + 154k + 33k + 105k + 0 + 38k) + 800k
--              = 554k + 800k = 1.354.000
-- Costo APU (+10% AI): 1.354.000 × 1.10 = 1.489.400
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.1', 'ESTUCAR APARTAMENTO CIUDADELA VERDE (44 m2)', 800000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Yeso',       'Bulto',  7,  32000, 0),
  ((SELECT id FROM nuevo), 'Caolín',     'Bulto',  14, 11000, 1),
  ((SELECT id FROM nuevo), 'Cemento',    'Bulto',  1,  33000, 2),
  ((SELECT id FROM nuevo), 'Esquineros', 'Unidad', 15,  7000, 3),
  ((SELECT id FROM nuevo), 'Transporte', 'Global', 0,  40000, 4),
  ((SELECT id FROM nuevo), 'Ivercryl',   '3 Kg',   1,  38000, 5);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1.2 PINTURA A 3 MANOS
-- Costo directo: (2×125k + 1×260k + 1×60k + 2×10k + 1×9k + 5×2k + 0×40k) + 650k
--              = (250k + 260k + 60k + 20k + 9k + 10k + 0) + 650k
--              = 609k + 650k = 1.259.000
-- Costo APU (+10% AI): 1.384.900
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.2', 'PINTURA A 3 MANOS', 650000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Pintura tipo 2', 'Cuñete', 2,  125000, 0),
  ((SELECT id FROM nuevo), 'Pintura tipo 1', 'Cuñete', 1,  260000, 1),
  ((SELECT id FROM nuevo), 'Supermastick',   'Cuñete', 1,   60000, 2),
  ((SELECT id FROM nuevo), 'Rodillos',       'Unidad', 2,   10000, 3),
  ((SELECT id FROM nuevo), 'Brochas',        'Unidad', 1,    9000, 4),
  ((SELECT id FROM nuevo), 'Lijas',          'Unidad', 5,    2000, 5),
  ((SELECT id FROM nuevo), 'Transporte',     'Global', 0,   40000, 6);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1.3 MORTERO DE NIVELACIÓN IMPERMEABILIZADO
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.3', 'MORTERO DE NIVELACIÓN IMPERMEABILIZADO', 450000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Arena (m3)',  'Bulto', 4,  100000, 0),
  ((SELECT id FROM nuevo), 'Cemento',     'Bulto', 14,  33000, 1),
  ((SELECT id FROM nuevo), 'Mapei',       'Unidad', 1, 200000, 2),
  ((SELECT id FROM nuevo), 'Transporte',  'und',    0,  20000, 3);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1.4 ENCHAPE DE PISO CERÁMICA + GUARDAESCOBAS + BALCÓN
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.4', 'ENCHAPE DE PISO CERÁMICA + GUARDAESCOBAS + BALCÓN', 1500000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)',           'und', 52, 40000, 0),
  ((SELECT id FROM nuevo), 'Pegante ceramica 25kg',  'und', 15, 16000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',               'und',  2, 33000, 2),
  ((SELECT id FROM nuevo), 'Distanciadores',         'und',  1, 40000, 3),
  ((SELECT id FROM nuevo), 'Transporte',             'und',  0, 80000, 4);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1.4 ENCHAPE DE PISO PORCELANATO + GUARDAESCOBAS + BALCÓN
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.4', 'ENCHAPE DE PISO PORCELANATO + GUARDAESCOBAS + BALCÓN', 1500000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)',              'und', 49, 60000, 0),
  ((SELECT id FROM nuevo), 'Pegante porcelanato 25kg',  'und', 15, 30000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',                  'und',  2, 33000, 2),
  ((SELECT id FROM nuevo), 'Distanciadores',            'und',  1, 40000, 3),
  ((SELECT id FROM nuevo), 'Transporte',                'und',  0, 80000, 4);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1.5 Drywall en baños y cocina
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('1.5', 'Drywall en baños y cocina', 300000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Perfiles', 'und', 1, 0, 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2.0 Demolición enchape existente
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('2.0', 'Demolición enchape existente', 120000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Retiro de escombros', 'und', 1, 80000, 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2.1 ENCHAPE DE BAÑO PRINCIPAL/SECUNDARIO
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- 2.1 COMPLEMENTO ENCHAPE DE BAÑO SECUNDARIO
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- 2.2 Nicho iluminado
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('2.2', 'Nicho iluminado', 150000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Ojo de buey', 'und',  2, 9000, 0),
  ((SELECT id FROM nuevo), 'Cable',       'und', 15, 4000, 1);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2.3/2.4 Instalación Combo básico
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('2.3/2.4', 'Instalación Combo básico', 300000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Combo básico',    'und', 1, 450000, 0),
  ((SELECT id FROM nuevo), 'Silicona',        'und', 2,  12000, 1),
  ((SELECT id FROM nuevo), 'Sifón',           'und', 1,  30000, 2),
  ((SELECT id FROM nuevo), 'Cemento blanco',  'und', 1,  20000, 3),
  ((SELECT id FROM nuevo), 'Llave reguladora','und', 2,  20000, 4),
  ((SELECT id FROM nuevo), 'Transporte',      'und', 0,  40000, 5);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2.3/2.4 Instalación Combo Premium
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('2.3/2.4', 'Instalación Combo Premium', 300000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Combo premium',   'und', 1, 1000000, 0),
  ((SELECT id FROM nuevo), 'Silicona',        'und', 2,   12000, 1),
  ((SELECT id FROM nuevo), 'Sifón',           'und', 1,   30000, 2),
  ((SELECT id FROM nuevo), 'Cemento blanco',  'und', 1,   20000, 3),
  ((SELECT id FROM nuevo), 'Llave reguladora','und', 2,   20000, 4),
  ((SELECT id FROM nuevo), 'Transporte',      'und', 0,   40000, 5);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3.1 ENCHAPE DE SALPICADERO
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('3.1', 'ENCHAPE DE SALPICADERO', 250000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)', 'und', 3, 40000, 0),
  ((SELECT id FROM nuevo), 'Pegante',      'und', 2, 16000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',     'und', 1, 33000, 2);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3.1 ENCHAPE DE MURO COCINA COMPLETO
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('3.1', 'ENCHAPE DE MURO COCINA COMPLETO', 100000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)', 'und', 10, 40000, 0),
  ((SELECT id FROM nuevo), 'Pegante',      'und',  2, 16000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',     'und',  0, 33000, 2);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4.1 ENCHAPE ZONA HÚMEDA
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('4.1', 'ENCHAPE ZONA HÚMEDA', 450000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Enchape (m2)', 'und', 15, 40000, 0),
  ((SELECT id FROM nuevo), 'Pegante',      'und',  4, 15000, 1),
  ((SELECT id FROM nuevo), 'Boquilla',     'und',  1, 33000, 2);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6.1 Luminarias Led
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('6.1', 'Luminarias Led', 100000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Luminarias Led',       'und', 9,  7000, 0),
  ((SELECT id FROM nuevo), 'Transporte',           'und', 0, 10000, 1),
  ((SELECT id FROM nuevo), '20% Gasolina al mes',  'und', 1,120000, 2),
  ((SELECT id FROM nuevo), '20% Taxis al mes',     'und', 1, 80000, 3);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7.1 Tubería de agua caliente a duchas - sin calentador
-- Sin materiales, sin MDO. Placeholder para ítem del catálogo.
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.1', 'Tubería de agua caliente a duchas - sin calentador', 0, 10)
  RETURNING id
)
SELECT id FROM nuevo; -- no hay materiales; consume el CTE para ejecutar el INSERT

-- ─────────────────────────────────────────────────────────────────────────────
-- 7.2 Tubería de agua caliente a duchas - con calentador
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.2', 'Tubería de agua caliente a duchas - con calentador', 1200000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Calentador', 'und', 1, 850000, 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7.3 Cerradura inteligente con enchape de madera interno
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.3', 'Cerradura inteligente con enchape de madera interno', 300000, 10)
  RETURNING id
)
INSERT INTO apu_materiales (apu_id, nombre, unidad, cantidad, valor_unitario, orden) VALUES
  ((SELECT id FROM nuevo), 'Cerradura inteligente instalada', 'und', 1, 600000, 0),
  ((SELECT id FROM nuevo), 'Enchape interno de puerta',       'und', 1, 400000, 1),
  ((SELECT id FROM nuevo), 'Transporte',                      'und', 0,  50000, 2);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7.7 Punto de gas independiente para horno — placeholder sin materiales
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.7', 'Punto de gas independiente para horno', 0, 10)
  RETURNING id
)
SELECT id FROM nuevo;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7.11 Diseño Drywall iluminado habitación principal — placeholder
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.11', 'Diseño Drywall iluminado habitación principal', 0, 10)
  RETURNING id
)
SELECT id FROM nuevo;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7.12 Diseño Drywall iluminado sala — placeholder
-- ─────────────────────────────────────────────────────────────────────────────
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.12', 'Diseño Drywall iluminado sala', 0, 10)
  RETURNING id
)
SELECT id FROM nuevo;

-- 7.14 Ampliación de balcón — placeholder sin materiales
-- MDO=259.200 conservado. Materiales pendientes de revisión manual:
-- el archivo fuente tenía cantidad=86.400 generando un costo irreal (~$5.944M).
-- Cargar los materiales correctos desde la UI de APUs una vez verificados.
WITH nuevo AS (
  INSERT INTO apus (codigo, nombre, mdo, ai_porcentaje)
  VALUES ('7.14', 'Ampliación de balcón', 259200, 10)
  RETURNING id
)
SELECT id FROM nuevo;

COMMIT;

-- Verificación post-seed:
-- SELECT codigo, nombre, mdo FROM apus ORDER BY codigo, nombre;
-- SELECT a.codigo, a.nombre, COUNT(m.id) as num_materiales
-- FROM apus a LEFT JOIN apu_materiales m ON m.apu_id = a.id
-- GROUP BY a.id ORDER BY a.codigo, a.nombre;
