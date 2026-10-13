-- =============================================================
-- Migracion v4 — Security fix (RLS habilitada en 5 tablas)
-- =============================================================
-- Alerta Supabase Shield: rls_disabled_in_public en
--   resumen_kpis, top_proveedores, top_compradores, regiones, hhi_top30
--
-- Diagnostico:
--   * 5 tablas residuales (pobladas como "snapshots" en un experimento
--     previo, las migrations v3 las dropeaba y luego materialized_views.sql
--     las re-creaba como MV, pero la DB viva quedo inconsistente).
--   * Las RPCs resumen_general(), top_compradores(), top_proveedores(),
--     gasto_por_region(), hhi_top30() leen DE ESTAS TABLAS (no de las MVs).
--   * anon tiene GRANT DELETE/INSERT/UPDATE/TRUNCATE sobre las 5.
--     INSERT anon en resumen_kpis -> 201 Created (verificado 2026-08-04).
--     DELETE anon en resumen_kpis -> 204 No Content (verificado).
--   * Dashboard NO usa SELECT directo a estas tablas (solo RPC).
--
-- Fix:
--   1. ENABLE ROW LEVEL SECURITY en las 5 tablas
--   2. REVOCAR todos los privilegios anon/authenticated
--   3. GRANT SELECT solo a anon, authenticated
--   4. Policy "lectura publica": SELECT anon, authenticated USING (true)
--   5. Sin policy de INSERT/UPDATE/DELETE => anon no puede escribir
--   6. service_role mantiene acceso total para futuras ETL
-- =============================================================

BEGIN;

-- 1. RLS en cada tabla
ALTER TABLE resumen_kpis     ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_proveedores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_compradores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE regiones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE hhi_top30        ENABLE ROW LEVEL SECURITY;

-- 2. Revocar todo de anon y authenticated (incluye INSERT/UPDATE/DELETE/TRUNCATE)
REVOKE ALL ON resumen_kpis     FROM anon, authenticated;
REVOKE ALL ON top_proveedores  FROM anon, authenticated;
REVOKE ALL ON top_compradores  FROM anon, authenticated;
REVOKE ALL ON regiones         FROM anon, authenticated;
REVOKE ALL ON hhi_top30        FROM anon, authenticated;

-- 3. Devolver solo SELECT (que es lo legitimo: data publica OCDS CC0)
GRANT SELECT ON resumen_kpis     TO anon, authenticated;
GRANT SELECT ON top_proveedores  TO anon, authenticated;
GRANT SELECT ON top_compradores  TO anon, authenticated;
GRANT SELECT ON regiones         TO anon, authenticated;
GRANT SELECT ON hhi_top30        TO anon, authenticated;

-- 4. Policies: SELECT publico anon/authenticated, escritura denegada
DROP POLICY IF EXISTS "lectura publica resumen_kpis"    ON resumen_kpis;
DROP POLICY IF EXISTS "lectura publica top_proveedores" ON top_proveedores;
DROP POLICY IF EXISTS "lectura publica top_compradores" ON top_compradores;
DROP POLICY IF EXISTS "lectura publica regiones"        ON regiones;
DROP POLICY IF EXISTS "lectura publica hhi_top30"       ON hhi_top30;

CREATE POLICY "lectura publica resumen_kpis"    ON resumen_kpis    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "lectura publica top_proveedores" ON top_proveedores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "lectura publica top_compradores" ON top_compradores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "lectura publica regiones"        ON regiones        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "lectura publica hhi_top30"       ON hhi_top30       FOR SELECT TO anon, authenticated USING (true);

-- service_role mantiene acceso total para ETL (bypass de RLS por defecto,
-- pero los GRANTs quedan explicitos para auditoria).

COMMIT;

-- =============================================================
-- Verificacion post-fix
-- =============================================================
SELECT
    c.relname AS tabla,
    CASE c.relkind WHEN 'r' THEN 'table' WHEN 'm' THEN 'matview' END AS kind,
    t.rowsecurity AS rls_habilitado,
    (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname) AS policies,
    (
        SELECT string_agg(privilege_type, ',' ORDER BY privilege_type)
        FROM information_schema.role_table_grants
        WHERE table_schema='public'
          AND table_name=c.relname
          AND grantee='anon'
    ) AS grants_anon,
    (
        SELECT string_agg(privilege_type, ',' ORDER BY privilege_type)
        FROM information_schema.role_table_grants
        WHERE table_schema='public'
          AND table_name=c.relname
          AND grantee='authenticated'
    ) AS grants_authenticated
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_tables t ON t.schemaname = n.nspname AND t.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'm')
ORDER BY c.relname;