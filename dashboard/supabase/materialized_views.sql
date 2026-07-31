-- =============================================================
-- Materialized Views — para evitar timeout en queries pesadas
-- =============================================================
-- Plan free de Supabase tiene statement timeout de 3.5s.
-- Las queries sobre 918K rows exceden ese límite.
-- Solución: pre-calcular en materialized views + refrescar
-- cada vez que se actualicen los datos.

DROP MATERIALIZED VIEW IF EXISTS mv_resumen_general CASCADE;
CREATE MATERIALIZED VIEW mv_resumen_general AS
    SELECT
        COUNT(*)::BIGINT                                          AS total_oc,
        COUNT(DISTINCT buyer_id)::BIGINT                          AS organismos,
        COUNT(DISTINCT supplier_rut)::BIGINT                      AS proveedores,
        SUM(oc_amount_clp)::BIGINT                                AS monto_total,
        ROUND(AVG(oc_amount_clp))                                 AS monto_promedio,
        COUNT(*) FILTER (WHERE supplier_rut IS NOT NULL)::BIGINT  AS oc_con_proveedor,
        COUNT(*) FILTER (WHERE buyer_name IS NOT NULL)::BIGINT    AS oc_con_comprador
    FROM ordenes_compra
    WHERE oc_status IN ('active', 'completed')
      AND oc_amount_clp BETWEEN 1000 AND 1e10;

CREATE UNIQUE INDEX ON mv_resumen_general ((1));

DROP MATERIALIZED VIEW IF EXISTS mv_top_compradores CASCADE;
CREATE MATERIALIZED VIEW mv_top_compradores AS
    SELECT
        buyer_id,
        buyer_name,
        COUNT(*)::BIGINT                                          AS num_oc,
        SUM(oc_amount_clp)::BIGINT                                AS monto_total,
        ROUND(AVG(oc_amount_clp))                                 AS monto_promedio,
        COUNT(DISTINCT supplier_rut)::BIGINT                      AS num_proveedores
    FROM ordenes_compra
    WHERE buyer_name IS NOT NULL
      AND oc_status IN ('active', 'completed')
    GROUP BY buyer_id, buyer_name
    ORDER BY SUM(oc_amount_clp) DESC
    LIMIT 100;  -- top 100 para flexibilidad

CREATE INDEX ON mv_top_compradores (monto_total DESC);

DROP MATERIALIZED VIEW IF EXISTS mv_top_proveedores CASCADE;
CREATE MATERIALIZED VIEW mv_top_proveedores AS
    SELECT
        supplier_rut,
        supplier_name,
        COALESCE(supplier_legal_name, supplier_name)              AS supplier_legal_name,
        supplier_region,
        COUNT(*)::BIGINT                                          AS num_oc,
        SUM(oc_amount_clp)::BIGINT                                AS monto_total,
        COUNT(DISTINCT buyer_id)::BIGINT                          AS num_compradores
    FROM ordenes_compra
    WHERE supplier_rut IS NOT NULL
      AND oc_status IN ('active', 'completed')
    GROUP BY supplier_rut, supplier_name, supplier_legal_name, supplier_region
    ORDER BY SUM(oc_amount_clp) DESC
    LIMIT 100;

CREATE INDEX ON mv_top_proveedores (monto_total DESC);

DROP MATERIALIZED VIEW IF EXISTS mv_gasto_por_region CASCADE;
CREATE MATERIALIZED VIEW mv_gasto_por_region AS
    SELECT
        supplier_region,
        COUNT(*)::BIGINT                                          AS num_oc,
        SUM(oc_amount_clp)::BIGINT                                AS monto_total,
        COUNT(DISTINCT supplier_rut)::BIGINT                      AS num_proveedores,
        COUNT(DISTINCT buyer_id)::BIGINT                          AS num_compradores
    FROM ordenes_compra
    WHERE supplier_region IS NOT NULL
      AND oc_status IN ('active', 'completed')
    GROUP BY supplier_region
    ORDER BY SUM(oc_amount_clp) DESC;

CREATE INDEX ON mv_gasto_por_region (monto_total DESC);

DROP MATERIALIZED VIEW IF EXISTS mv_hhi_top30 CASCADE;
CREATE MATERIALIZED VIEW mv_hhi_top30 AS
    WITH buyer_totals AS (
        SELECT
            buyer_name,
            SUM(oc_amount_clp) AS total
        FROM ordenes_compra
        WHERE buyer_name IS NOT NULL
          AND supplier_rut IS NOT NULL
          AND oc_status IN ('active', 'completed')
        GROUP BY buyer_name
        ORDER BY SUM(oc_amount_clp) DESC
        LIMIT 30
    ),
    buyer_supplier AS (
        SELECT oc.buyer_name, oc.supplier_rut, SUM(oc.oc_amount_clp) AS sub
        FROM ordenes_compra oc
        WHERE oc.buyer_name IN (SELECT buyer_name FROM buyer_totals)
          AND oc.supplier_rut IS NOT NULL
          AND oc.oc_status IN ('active', 'completed')
        GROUP BY oc.buyer_name, oc.supplier_rut
    ),
    hhi_calc AS (
        SELECT bs.buyer_name,
               SUM(POWER((bs.sub::NUMERIC / bt.total::NUMERIC) * 100, 2)) AS hhi
        FROM buyer_supplier bs
        JOIN buyer_totals bt USING (buyer_name)
        GROUP BY bs.buyer_name
    )
    SELECT
        bt.buyer_name,
        bt.total::BIGINT                                          AS monto_total,
        (SELECT COUNT(DISTINCT oc.supplier_rut)
         FROM ordenes_compra oc
         WHERE oc.buyer_name = bt.buyer_name
           AND oc.supplier_rut IS NOT NULL)::BIGINT                AS num_proveedores,
        ROUND(h.hhi, 1)                                            AS hhi,
        CASE
            WHEN h.hhi >= 2500 THEN 'Alta concentración'
            WHEN h.hhi >= 1500 THEN 'Moderado'
            ELSE 'Diversificado'
        END                                                        AS nivel
    FROM buyer_totals bt
    JOIN hhi_calc h USING (buyer_name)
    ORDER BY h.hhi DESC;

CREATE INDEX ON mv_hhi_top30 (hhi DESC);

-- =============================================================
-- RPC functions que ahora leen de las MVs (instantáneo)
-- =============================================================
DROP FUNCTION IF EXISTS resumen_general() CASCADE;
CREATE FUNCTION resumen_general()
RETURNS TABLE (
    total_oc          BIGINT,
    organismos        BIGINT,
    proveedores       BIGINT,
    monto_total       BIGINT,
    monto_promedio    NUMERIC,
    oc_con_proveedor  BIGINT,
    oc_con_comprador  BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT total_oc, organismos, proveedores, monto_total, monto_promedio::NUMERIC,
           oc_con_proveedor, oc_con_comprador
    FROM mv_resumen_general;
$$;

DROP FUNCTION IF EXISTS top_compradores(INT) CASCADE;
CREATE FUNCTION top_compradores(p_limit INT DEFAULT 15)
RETURNS TABLE (
    buyer_id        TEXT,
    buyer_name      TEXT,
    num_oc          BIGINT,
    monto_total     BIGINT,
    monto_promedio  NUMERIC,
    num_proveedores BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT buyer_id::TEXT, buyer_name::TEXT, num_oc, monto_total, monto_promedio::NUMERIC, num_proveedores
    FROM mv_top_compradores
    LIMIT p_limit;
$$;

DROP FUNCTION IF EXISTS top_proveedores(INT) CASCADE;
CREATE FUNCTION top_proveedores(p_limit INT DEFAULT 15)
RETURNS TABLE (
    supplier_rut        TEXT,
    supplier_name       TEXT,
    supplier_legal_name TEXT,
    supplier_region     TEXT,
    num_oc              BIGINT,
    monto_total         BIGINT,
    num_compradores     BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT supplier_rut::TEXT, supplier_name::TEXT, supplier_legal_name::TEXT,
           supplier_region::TEXT, num_oc, monto_total, num_compradores
    FROM mv_top_proveedores
    LIMIT p_limit;
$$;

DROP FUNCTION IF EXISTS gasto_por_region() CASCADE;
CREATE FUNCTION gasto_por_region()
RETURNS TABLE (
    supplier_region TEXT,
    num_oc          BIGINT,
    monto_total     BIGINT,
    num_proveedores BIGINT,
    num_compradores BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT supplier_region::TEXT, num_oc, monto_total, num_proveedores, num_compradores
    FROM mv_gasto_por_region;
$$;

DROP FUNCTION IF EXISTS hhi_top30() CASCADE;
CREATE FUNCTION hhi_top30()
RETURNS TABLE (
    buyer_name      TEXT,
    monto_total     BIGINT,
    num_proveedores BIGINT,
    hhi             NUMERIC,
    nivel           TEXT
)
LANGUAGE sql STABLE
AS $$
    SELECT buyer_name::TEXT, monto_total, num_proveedores, hhi::NUMERIC, nivel::TEXT
    FROM mv_hhi_top30;
$$;

-- =============================================================
-- Permisos
-- =============================================================
GRANT SELECT ON mv_resumen_general  TO anon, authenticated;
GRANT SELECT ON mv_top_compradores  TO anon, authenticated;
GRANT SELECT ON mv_top_proveedores  TO anon, authenticated;
GRANT SELECT ON mv_gasto_por_region TO anon, authenticated;
GRANT SELECT ON mv_hhi_top30        TO anon, authenticated;

GRANT EXECUTE ON FUNCTION resumen_general     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION top_compradores     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION top_proveedores     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION gasto_por_region    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION hhi_top30           TO anon, authenticated;
