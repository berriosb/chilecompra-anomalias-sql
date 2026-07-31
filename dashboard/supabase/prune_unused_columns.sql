-- Poda de columnas no usadas para liberar espacio en Supabase free tier (500MB cap)
--
-- CONTEXTO: dashboard chilecompra-anomalias-sql ocupa 503MB (101% del cap free).
-- 4 columnas de ordenes_compra NO se usan en ningún RPC ni en el front,
-- pero pesan ~88MB en la tabla + espacio extra en índices/WAL/toast.
--
-- COLUMNAS A PODAR:
--   - tender_title         (1.6 MB,   96.9% NULL)  -- nadie lo lee
--   - oc_title             (52.6 MB,   0.0% NULL)  -- nadie lo lee
--   - category_description (34.0 MB,  26.7% NULL)  -- nadie lo lee
--   - supplier_scale       (0.4 MB,   91.3% NULL)  -- nadie lo lee
--
-- AHORRO ESTIMADO: ~88-110 MB (tabla + TOAST + índices secundarios)
-- RESULTADO: ~350-380 MB total (bajo cap con holgura para crecer)
--
-- ⚠️  EJECUTAR EN SUPABASE SQL EDITOR (NO es destructivo de filas, solo columnas)
-- ⚠️  Hacer backup antes si los datos importan (no tenemos acceso a la DB local de prod)
-- ⚠️  Si en el futuro se quiere usar alguna de estas columnas, hay que volver a crearlas
--     vía migración (los datos se pierden)

BEGIN;

-- 1. Verificar tamaño ANTES
SELECT
  pg_size_pretty(pg_total_relation_size('ordenes_compra')) AS total_antes,
  pg_size_pretty(pg_relation_size('ordenes_compra')) AS tabla_antes,
  pg_size_pretty(pg_total_relation_size('ordenes_compra') - pg_relation_size('ordenes_compra')) AS indices_antes;

-- 2. Podar las 4 columnas no usadas
ALTER TABLE ordenes_compra
  DROP COLUMN IF EXISTS tender_title,
  DROP COLUMN IF EXISTS oc_title,
  DROP COLUMN IF EXISTS category_description,
  DROP COLUMN IF EXISTS supplier_scale;

-- 3. VACUUM FULL para reclamar espacio de disco (no se puede dentro de transacción,
--    se hace fuera del BEGIN; lo dejo fuera)
--    => Después del COMMIT, correr manualmente:  VACUUM FULL ordenes_compra;

-- 4. Verificar tamaño DESPUÉS del ALTER (sin VACUUM aún)
SELECT
  pg_size_pretty(pg_total_relation_size('ordenes_compra')) AS total_despues_alter,
  pg_size_pretty(pg_relation_size('ordenes_compra')) AS tabla_despues_alter;

COMMIT;

-- 5. AHORA CORRER MANUALMENTE FUERA DE LA TRANSACCIÓN (toma ~30-60s, lockea la tabla):
--    VACUUM FULL ordenes_compra;
--
--    Verificar resultado:
--    SELECT pg_size_pretty(pg_total_relation_size('ordenes_compra'));
--
-- 6. Si todavía estás sobre 500MB, considerar:
--    a) DROP MATERIALIZED VIEW IF EXISTS mv_resumen_general;  -- si existe
--    b) Re-evaluar si necesitamos la tabla completa o solo agregados
