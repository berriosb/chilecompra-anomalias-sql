-- =============================================================
-- Migraciones Supabase v2 — ChileCompra Dashboard
-- =============================================================
-- Ejecutar en SQL Editor de Supabase, o via Management API.

-- 0. Tabla base
CREATE TABLE IF NOT EXISTS ordenes_compra (
    year                 SMALLINT     NOT NULL,
    oc_id                VARCHAR(50)  PRIMARY KEY,
    oc_date              DATE         NOT NULL,
    oc_status            VARCHAR(30),
    oc_amount_clp        BIGINT       NOT NULL CHECK (oc_amount_clp > 0),
    oc_currency          VARCHAR(10)  DEFAULT 'CLP',
    oc_title             TEXT,
    buyer_id             VARCHAR(50),
    buyer_name           VARCHAR(200),
    procurement_method   VARCHAR(50),
    category_id          VARCHAR(30),
    category_description VARCHAR(200),
    tender_title         TEXT,
    supplier_name        VARCHAR(200),
    supplier_rut         VARCHAR(20),
    supplier_legal_name  VARCHAR(200),
    supplier_region      VARCHAR(100),
    supplier_scale       VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_buyer_id          ON ordenes_compra(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_name        ON ordenes_compra(buyer_name);
CREATE INDEX IF NOT EXISTS idx_supplier_rut      ON ordenes_compra(supplier_rut);
CREATE INDEX IF NOT EXISTS idx_category_id       ON ordenes_compra(category_id);
CREATE INDEX IF NOT EXISTS idx_oc_date           ON ordenes_compra(oc_date);
CREATE INDEX IF NOT EXISTS idx_amount            ON ordenes_compra(oc_amount_clp);
CREATE INDEX IF NOT EXISTS idx_supplier_region   ON ordenes_compra(supplier_region);

-- =============================================================
-- 1. resumen_general
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
    SELECT
        COUNT(*)::BIGINT,
        COUNT(DISTINCT buyer_id)::BIGINT,
        COUNT(DISTINCT supplier_rut)::BIGINT,
        SUM(oc_amount_clp)::BIGINT,
        ROUND(AVG(oc_amount_clp)),
        COUNT(*) FILTER (WHERE supplier_rut IS NOT NULL)::BIGINT,
        COUNT(*) FILTER (WHERE buyer_name IS NOT NULL)::BIGINT
    FROM ordenes_compra
    WHERE oc_status IN ('active', 'completed')
      AND oc_amount_clp BETWEEN 1000 AND 1e10;
$$;

-- =============================================================
-- 2. top_compradores
-- =============================================================
DROP FUNCTION IF EXISTS top_compradores(INT) CASCADE;
CREATE FUNCTION top_compradores(p_limit INT DEFAULT 15)
RETURNS TABLE (
    buyer_id        VARCHAR,
    buyer_name      VARCHAR,
    num_oc          BIGINT,
    monto_total     BIGINT,
    monto_promedio  NUMERIC,
    num_proveedores BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        buyer_id::VARCHAR,
        buyer_name::VARCHAR,
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

-- =============================================================
-- 3. top_proveedores
-- =============================================================
DROP FUNCTION IF EXISTS top_proveedores(INT) CASCADE;
CREATE FUNCTION top_proveedores(p_limit INT DEFAULT 15)
RETURNS TABLE (
    supplier_rut        VARCHAR,
    supplier_name       VARCHAR,
    supplier_legal_name VARCHAR,
    supplier_region     VARCHAR,
    num_oc              BIGINT,
    monto_total         BIGINT,
    num_compradores     BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        supplier_rut::VARCHAR,
        supplier_name::VARCHAR,
        COALESCE(supplier_legal_name, supplier_name)::VARCHAR  AS supplier_legal_name,
        supplier_region::VARCHAR,
        COUNT(*)::BIGINT                                        AS num_oc,
        SUM(oc_amount_clp)::BIGINT                              AS monto_total,
        COUNT(DISTINCT buyer_id)::BIGINT                         AS num_compradores
    FROM ordenes_compra
    WHERE supplier_rut IS NOT NULL
      AND oc_status IN ('active', 'completed')
    GROUP BY supplier_rut, supplier_name, supplier_legal_name, supplier_region
    ORDER BY SUM(oc_amount_clp) DESC
    LIMIT p_limit;
$$;

-- =============================================================
-- 4. gasto_por_region
-- =============================================================
DROP FUNCTION IF EXISTS gasto_por_region() CASCADE;
CREATE FUNCTION gasto_por_region()
RETURNS TABLE (
    supplier_region VARCHAR,
    num_oc          BIGINT,
    monto_total     BIGINT,
    num_proveedores BIGINT,
    num_compradores BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        supplier_region::VARCHAR,
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

-- =============================================================
-- 5. hhi_top30
-- =============================================================
DROP FUNCTION IF EXISTS hhi_top30() CASCADE;
CREATE FUNCTION hhi_top30()
RETURNS TABLE (
    buyer_name VARCHAR,
    monto_total BIGINT,
    num_proveedores BIGINT,
    hhi NUMERIC,
    nivel VARCHAR
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
        bt.buyer_name::VARCHAR,
        bt.total::BIGINT                                       AS monto_total,
        (SELECT COUNT(DISTINCT oc.supplier_rut)
         FROM ordenes_compra oc
         WHERE oc.buyer_name = bt.buyer_name
           AND oc.supplier_rut IS NOT NULL
           AND oc.oc_status IN ('active', 'completed'))::BIGINT AS num_proveedores,
        ROUND(h.hhi, 1)                                         AS hhi,
        CASE
            WHEN h.hhi >= 2500 THEN 'Alta concentración'
            WHEN h.hhi >= 1500 THEN 'Moderado'
            ELSE 'Diversificado'
        END::VARCHAR                                            AS nivel
    FROM buyer_totals bt
    JOIN hhi_calc h USING (buyer_name)
    ORDER BY h.hhi DESC;
$$;

-- =============================================================
-- 6. RLS — lectura pública, escritura denegada
-- =============================================================
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lectura publica" ON ordenes_compra;
CREATE POLICY "lectura publica" ON ordenes_compra
    FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policy = anon no puede escribir, solo service_role

GRANT EXECUTE ON FUNCTION resumen_general     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION top_compradores     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION top_proveedores     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION gasto_por_region    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION hhi_top30           TO anon, authenticated;
