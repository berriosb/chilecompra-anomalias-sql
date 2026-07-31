-- =============================================================
-- Migraciones Supabase v3 — ChileCompra Dashboard
-- =============================================================
-- Cambios v3:
--   * supplier_name, category_description ampliados a TEXT
--     (algunos valores pasan 200 chars)
-- =============================================================

-- DROP todo lo previo
DROP TABLE IF EXISTS ordenes_compra CASCADE;
DROP FUNCTION IF EXISTS resumen_general() CASCADE;
DROP FUNCTION IF EXISTS top_compradores(INT) CASCADE;
DROP FUNCTION IF EXISTS top_proveedores(INT) CASCADE;
DROP FUNCTION IF EXISTS gasto_por_region() CASCADE;
DROP FUNCTION IF EXISTS hhi_top30() CASCADE;

CREATE TABLE ordenes_compra (
    year                 SMALLINT     NOT NULL,
    oc_id                VARCHAR(50)  PRIMARY KEY,
    oc_date              DATE         NOT NULL,
    oc_status            VARCHAR(30),
    oc_amount_clp        BIGINT       NOT NULL CHECK (oc_amount_clp > 0),
    oc_currency          VARCHAR(10)  DEFAULT 'CLP',
    oc_title             TEXT,
    buyer_id             VARCHAR(50),
    buyer_name           TEXT,
    procurement_method   VARCHAR(50),
    category_id          VARCHAR(30),
    category_description TEXT,
    tender_title         TEXT,
    supplier_name        TEXT,
    supplier_rut         VARCHAR(20),
    supplier_legal_name  TEXT,
    supplier_region      TEXT,
    supplier_scale       VARCHAR(20)
);

CREATE INDEX idx_buyer_id          ON ordenes_compra(buyer_id);
CREATE INDEX idx_buyer_name        ON ordenes_compra(buyer_name);
CREATE INDEX idx_supplier_rut      ON ordenes_compra(supplier_rut);
CREATE INDEX idx_category_id       ON ordenes_compra(category_id);
CREATE INDEX idx_oc_date           ON ordenes_compra(oc_date);
CREATE INDEX idx_amount            ON ordenes_compra(oc_amount_clp);
CREATE INDEX idx_supplier_region   ON ordenes_compra(supplier_region);

-- 1. resumen_general
CREATE OR REPLACE FUNCTION resumen_general()
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
    SELECT
        COUNT(*)::BIGINT                                          AS total_oc,
        COUNT(DISTINCT buyer_id)::BIGINT                          AS organismos,
        COUNT(DISTINCT supplier_rut)::BIGINT                       AS proveedores,
        SUM(oc_amount_clp)::BIGINT                                AS monto_total,
        ROUND(AVG(oc_amount_clp))                                  AS monto_promedio,
        COUNT(*) FILTER (WHERE supplier_rut IS NOT NULL)::BIGINT  AS oc_con_proveedor,
        COUNT(*) FILTER (WHERE buyer_name IS NOT NULL)::BIGINT     AS oc_con_comprador
    FROM ordenes_compra
    WHERE oc_status IN ('active', 'completed')
      AND oc_amount_clp BETWEEN 1000 AND 1e10;
$$;

-- 2. top_compradores
CREATE OR REPLACE FUNCTION top_compradores(p_limit INT DEFAULT 15)
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
    SELECT
        buyer_id::TEXT,
        buyer_name::TEXT,
        COUNT(*)::BIGINT                                          AS num_oc,
        SUM(oc_amount_clp)::BIGINT                                AS monto_total,
        ROUND(AVG(oc_amount_clp))                                  AS monto_promedio,
        COUNT(DISTINCT supplier_rut)::BIGINT                       AS num_proveedores
    FROM ordenes_compra
    WHERE buyer_name IS NOT NULL
      AND oc_status IN ('active', 'completed')
    GROUP BY buyer_id, buyer_name
    ORDER BY SUM(oc_amount_clp) DESC
    LIMIT p_limit;
$$;

-- 3. top_proveedores
CREATE OR REPLACE FUNCTION top_proveedores(p_limit INT DEFAULT 15)
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
    SELECT
        supplier_rut::TEXT,
        supplier_name::TEXT,
        COALESCE(supplier_legal_name, supplier_name)::TEXT        AS supplier_legal_name,
        supplier_region::TEXT,
        COUNT(*)::BIGINT                                          AS num_oc,
        SUM(oc_amount_clp)::BIGINT                                AS monto_total,
        COUNT(DISTINCT buyer_id)::BIGINT                          AS num_compradores
    FROM ordenes_compra
    WHERE supplier_rut IS NOT NULL
      AND oc_status IN ('active', 'completed')
    GROUP BY supplier_rut, supplier_name, supplier_legal_name, supplier_region
    ORDER BY SUM(oc_amount_clp) DESC
    LIMIT p_limit;
$$;

-- 4. gasto_por_region
CREATE OR REPLACE FUNCTION gasto_por_region()
RETURNS TABLE (
    supplier_region TEXT,
    num_oc          BIGINT,
    monto_total     BIGINT,
    num_proveedores BIGINT,
    num_compradores BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        supplier_region::TEXT,
        COUNT(*)::BIGINT                                  AS num_oc,
        SUM(oc_amount_clp)::BIGINT                        AS monto_total,
        COUNT(DISTINCT supplier_rut)::BIGINT              AS num_proveedores,
        COUNT(DISTINCT buyer_id)::BIGINT                  AS num_compradores
    FROM ordenes_compra
    WHERE supplier_region IS NOT NULL
      AND oc_status IN ('active', 'completed')
    GROUP BY supplier_region
    ORDER BY SUM(oc_amount_clp) DESC;
$$;

-- 5. hhi_top30
CREATE OR REPLACE FUNCTION hhi_top30()
RETURNS TABLE (
    buyer_name      TEXT,
    monto_total     BIGINT,
    num_proveedores BIGINT,
    hhi             NUMERIC,
    nivel           TEXT
)
LANGUAGE sql STABLE
AS $$
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
        SELECT
            oc.buyer_name,
            oc.supplier_rut,
            SUM(oc.oc_amount_clp) AS sub
        FROM ordenes_compra oc
        WHERE oc.buyer_name IN (SELECT buyer_name FROM buyer_totals)
          AND oc.supplier_rut IS NOT NULL
          AND oc.oc_status IN ('active', 'completed')
        GROUP BY oc.buyer_name, oc.supplier_rut
    ),
    hhi_calc AS (
        SELECT
            bs.buyer_name,
            SUM(POWER((bs.sub::NUMERIC / bt.total::NUMERIC) * 100, 2)) AS hhi
        FROM buyer_supplier bs
        JOIN buyer_totals bt USING (buyer_name)
        GROUP BY bs.buyer_name
    )
    SELECT
        bt.buyer_name::TEXT,
        bt.total::BIGINT,
        (SELECT COUNT(DISTINCT oc.supplier_rut)
         FROM ordenes_compra oc
         WHERE oc.buyer_name = bt.buyer_name
           AND oc.supplier_rut IS NOT NULL)::BIGINT                AS num_proveedores,
        ROUND(h.hhi, 1)                                            AS hhi,
        CASE
            WHEN h.hhi >= 2500 THEN 'Alta concentración'
            WHEN h.hhi >= 1500 THEN 'Moderado'
            ELSE 'Diversificado'
        END::TEXT                                                   AS nivel
    FROM buyer_totals bt
    JOIN hhi_calc h USING (buyer_name)
    ORDER BY h.hhi DESC;
$$;

-- RLS
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lectura publica" ON ordenes_compra;
CREATE POLICY "lectura publica" ON ordenes_compra
    FOR SELECT USING (true);

GRANT EXECUTE ON FUNCTION resumen_general     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION top_compradores     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION top_proveedores     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION gasto_por_region    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION hhi_top30           TO anon, authenticated;
