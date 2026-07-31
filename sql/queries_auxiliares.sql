-- queries_auxiliares.sql
--
-- Vistas, CTEs y funciones auxiliares reutilizadas por las queries principales.


-- ============================================================
-- VISTA: OC activas con información completa
-- ============================================================
DROP VIEW IF EXISTS v_oc_completas;
CREATE VIEW v_oc_completas AS
SELECT *
FROM ordenes_compra
WHERE oc_status IN ('active', 'completed')
  AND oc_amount_clp BETWEEN 1000 AND 1e10
  AND buyer_name IS NOT NULL
  AND supplier_rut IS NOT NULL;


-- ============================================================
-- VISTA: Top organismos por gasto
-- ============================================================
DROP VIEW IF EXISTS v_top_compradores;
CREATE VIEW v_top_compradores AS
SELECT
    buyer_id,
    buyer_name,
    COUNT(*)                          AS num_oc,
    SUM(oc_amount_clp)                AS monto_total,
    AVG(oc_amount_clp)                AS monto_promedio,
    COUNT(DISTINCT supplier_rut)      AS num_proveedores
FROM v_oc_completas
GROUP BY buyer_id, buyer_name;


-- ============================================================
-- VISTA: Top proveedores por venta al Estado
-- ============================================================
DROP VIEW IF EXISTS v_top_proveedores;
CREATE VIEW v_top_proveedores AS
SELECT
    supplier_rut,
    supplier_name,
    supplier_legal_name,
    supplier_region,
    supplier_scale,
    COUNT(*)                          AS num_oc,
    SUM(oc_amount_clp)                AS monto_total,
    AVG(oc_amount_clp)                AS monto_promedio,
    COUNT(DISTINCT buyer_id)          AS num_compradores
FROM v_oc_completas
GROUP BY supplier_rut, supplier_name, supplier_legal_name,
         supplier_region, supplier_scale;


-- ============================================================
-- VISTA: Gasto por región
-- ============================================================
DROP VIEW IF EXISTS v_gasto_por_region;
CREATE VIEW v_gasto_por_region AS
SELECT
    supplier_region,
    COUNT(*)                          AS num_oc,
    SUM(oc_amount_clp)                AS monto_total,
    COUNT(DISTINCT supplier_rut)      AS num_proveedores,
    COUNT(DISTINCT buyer_id)          AS num_compradores
FROM v_oc_completas
WHERE supplier_region IS NOT NULL
GROUP BY supplier_region;


-- ============================================================
-- FUNCIÓN: Calcular HHI por organismo
-- ============================================================
DROP FUNCTION IF EXISTS calcular_hhi(BIGINT);
CREATE OR REPLACE FUNCTION calcular_hhi(p_buyer_id BIGINT)
RETURNS TABLE (
    buyer_name VARCHAR,
    hhi DOUBLE PRECISION,
    num_proveedores BIGINT,
    monto_total DOUBLE PRECISION,
    proveedor_dominante VARCHAR,
    cuota_dominante DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    WITH gasto_por_proveedor AS (
        SELECT
            supplier_rut,
            supplier_name,
            SUM(oc_amount_clp) AS monto
        FROM v_oc_completas
        WHERE buyer_id = p_buyer_id
        GROUP BY supplier_rut, supplier_name
    ),
    total AS (
        SELECT SUM(monto) AS monto_total FROM gasto_por_proveedor
    ),
    cuotas AS (
        SELECT
            supplier_name,
            monto,
            100.0 * monto / NULLIF((SELECT monto_total FROM total), 0) AS cuota_pct
        FROM gasto_por_proveedor
    )
    SELECT
        (SELECT buyer_name FROM ordenes_compra WHERE buyer_id = p_buyer_id LIMIT 1),
        SUM(cuota_pct * cuota_pct),
        COUNT(*),
        (SELECT monto_total FROM total)::DOUBLE PRECISION,
        (SELECT supplier_name FROM cuotas ORDER BY cuota_pct DESC LIMIT 1),
        (SELECT MAX(cuota_pct) FROM cuotas)
    FROM cuotas;
END;
$$ LANGUAGE plpgsql;
