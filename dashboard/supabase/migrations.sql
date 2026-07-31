-- =============================================================
-- Migraciones Supabase — ChileCompra Dashboard
-- =============================================================
-- Estas queries se exponen como RPC (Remote Procedure Call)
-- vía PostgREST. El dashboard las llama desde `supabase.rpc()`.
--
-- Cómo correrlas:
--   1. Ir a Supabase Dashboard → SQL Editor
--   2. Pegar este archivo completo
--   3. Run
-- =============================================================

-- =============================================================
-- 0. Schema base (si todavía no se corrió)
-- =============================================================
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
CREATE OR REPLACE FUNCTION top_compradores(p_limit INT DEFAULT 15)
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
        buyer_id,
        buyer_name,
        COUNT(*)::BIGINT,
        SUM(oc_amount_clp)::BIGINT,
        ROUND(AVG(oc_amount_clp)),
        COUNT(DISTINCT supplier_rut)::BIGINT
    FROM ordenes_compra
    WHERE buyer_name IS NOT NULL
      AND oc_status IN ('active', 'completed')
    GROUP BY buyer_id, buyer_name
    ORDER BY monto_total DESC
    LIMIT p_limit;
$$;

-- =============================================================
-- 3. top_proveedores
-- =============================================================
CREATE OR REPLACE FUNCTION top_proveedores(p_limit INT DEFAULT 15)
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
        supplier_rut,
        supplier_name,
        supplier_legal_name,
        supplier_region,
        COUNT(*)::BIGINT,
        SUM(oc_amount_clp)::BIGINT,
        COUNT(DISTINCT buyer_id)::BIGINT
    FROM ordenes_compra
    WHERE supplier_rut IS NOT NULL
      AND oc_status IN ('active', 'completed')
    GROUP BY supplier_rut, supplier_name, supplier_legal_name, supplier_region
    ORDER BY monto_total DESC
    LIMIT p_limit;
$$;

-- =============================================================
-- 4. gasto_por_region
-- =============================================================
CREATE OR REPLACE FUNCTION gasto_por_region()
RETURNS TABLE (
    supplier_region  VARCHAR,
    num_oc           BIGINT,
    monto_total      BIGINT,
    num_proveedores  BIGINT,
    num_compradores  BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        TRIM(supplier_region),
        COUNT(*)::BIGINT,
        SUM(oc_amount_clp)::BIGINT,
        COUNT(DISTINCT supplier_rut)::BIGINT,
        COUNT(DISTINCT buyer_id)::BIGINT
    FROM ordenes_compra
    WHERE supplier_region IS NOT NULL
      AND TRIM(supplier_region) != ''
      AND oc_status IN ('active', 'completed')
    GROUP BY TRIM(supplier_region)
    ORDER BY monto_total DESC;
$$;

-- =============================================================
-- 5. hhi_top30
-- Calcula el HHI (Herfindahl-Hirschman Index) por organismo comprador.
-- HHI = SUM( (monto_proveedor / monto_total)^2 ) * 10000
-- =============================================================
CREATE OR REPLACE FUNCTION hhi_top30()
RETURNS TABLE (
    buyer_name       VARCHAR,
    monto_total      NUMERIC,
    num_proveedores  BIGINT,
    hhi              NUMERIC,
    nivel            TEXT
)
LANGUAGE sql STABLE
AS $$
    WITH top_compradores AS (
        SELECT
            oc.buyer_id,
            oc.buyer_name,
            SUM(oc.oc_amount_clp) AS monto_total
        FROM ordenes_compra oc
        WHERE oc.buyer_name IS NOT NULL
          AND oc.supplier_rut IS NOT NULL
          AND oc.oc_status IN ('active', 'completed')
        GROUP BY oc.buyer_id, oc.buyer_name
        ORDER BY monto_total DESC
        LIMIT 30
    ),
    gasto_por_proveedor AS (
        SELECT
            oc.buyer_id,
            oc.supplier_rut,
            SUM(oc.oc_amount_clp) AS monto_proveedor
        FROM ordenes_compra oc
        JOIN top_compradores tc ON oc.buyer_id = tc.buyer_id
        WHERE oc.supplier_rut IS NOT NULL
          AND oc.oc_status IN ('active', 'completed')
        GROUP BY oc.buyer_id, oc.supplier_rut
    )
    SELECT
        tc.buyer_name,
        ROUND(tc.monto_total),
        COUNT(DISTINCT gp.supplier_rut)::BIGINT,
        ROUND(SUM(
            (gp.monto_proveedor::NUMERIC / tc.monto_total) *
            (gp.monto_proveedor::NUMERIC / tc.monto_total) * 10000
        ), 1),
        CASE
            WHEN SUM(
                (gp.monto_proveedor::NUMERIC / tc.monto_total) *
                (gp.monto_proveedor::NUMERIC / tc.monto_total) * 10000
            ) < 1500 THEN 'Diversificado'
            WHEN SUM(
                (gp.monto_proveedor::NUMERIC / tc.monto_total) *
                (gp.monto_proveedor::NUMERIC / tc.monto_total) * 10000
            ) < 2500 THEN 'Moderado'
            ELSE 'Alta concentración'
        END
    FROM top_compradores tc
    JOIN gasto_por_proveedor gp ON tc.buyer_id = gp.buyer_id
    GROUP BY tc.buyer_id, tc.buyer_name, tc.monto_total
    ORDER BY hhi DESC;
$$;

-- =============================================================
-- 6. Grants (para que el anon key pueda invocar las RPCs)
-- =============================================================
GRANT EXECUTE ON FUNCTION resumen_general   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION top_compradores   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION top_proveedores   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION gasto_por_region  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION hhi_top30         TO anon, authenticated;

-- =============================================================
-- 7. RLS — Row Level Security (lectura pública controlada)
-- =============================================================
-- Habilitamos RLS pero dejamos SELECT libre para la tabla
-- (es data pública OCDS CC0).
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lectura publica" ON ordenes_compra;
CREATE POLICY "lectura publica"
    ON ordenes_compra
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- =============================================================
-- 8. (Opcional) Ejecutar las RPCs una vez para warm-up
-- =============================================================
SELECT resumen_general();
SELECT * FROM top_compradores(5);
SELECT * FROM top_proveedores(5);
