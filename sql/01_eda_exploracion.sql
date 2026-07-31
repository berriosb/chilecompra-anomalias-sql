-- 01_eda_exploracion.sql
--
-- Análisis exploratorio inicial: distribución de OC, rangos, outliers básicos.

-- ============================================================
-- 1. Resumen general
-- ============================================================
SELECT
    year,
    COUNT(*)                                    AS total_oc,
    COUNT(DISTINCT buyer_id)                    AS organismos_unicos,
    COUNT(DISTINCT supplier_rut)                AS proveedores_unicos,
    ROUND(SUM(oc_amount_clp) / 1e9, 2)         AS monto_total_mil_millones_clp,
    ROUND(AVG(oc_amount_clp) / 1e6, 2)          AS monto_promedio_millones_clp,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY oc_amount_clp) / 1e6, 2)
                                                AS mediana_monto_millones_clp,
    MIN(oc_date)                                AS primera_oc,
    MAX(oc_date)                                AS ultima_oc
FROM ordenes_compra
GROUP BY year
ORDER BY year;


-- ============================================================
-- 2. Distribución de OC por estado
-- ============================================================
SELECT
    oc_status,
    COUNT(*)                                    AS num_oc,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct
FROM ordenes_compra
GROUP BY oc_status
ORDER BY num_oc DESC;


-- ============================================================
-- 3. Distribución de OC por método de compra
-- ============================================================
SELECT
    procurement_method,
    COUNT(*)                                    AS num_oc,
    ROUND(SUM(oc_amount_clp) / 1e9, 2)         AS monto_total_mil_millones_clp,
    ROUND(AVG(oc_amount_clp) / 1e6, 2)          AS monto_promedio_millones_clp
FROM ordenes_compra
WHERE procurement_method IS NOT NULL
GROUP BY procurement_method
ORDER BY monto_total_mil_millones_clp DESC;


-- ============================================================
-- 4. Distribución de OC por escala de proveedor
-- ============================================================
SELECT
    supplier_scale,
    COUNT(*)                                    AS num_oc,
    ROUND(SUM(oc_amount_clp) / 1e9, 2)         AS monto_total_mil_millones_clp,
    ROUND(AVG(oc_amount_clp) / 1e6, 2)          AS monto_promedio_millones_clp,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct
FROM ordenes_compra
WHERE supplier_scale IS NOT NULL
GROUP BY supplier_scale
ORDER BY num_oc DESC;


-- ============================================================
-- 5. Top 10 organismos compradores por monto
-- ============================================================
SELECT
    buyer_name,
    COUNT(*)                                    AS num_oc,
    ROUND(SUM(oc_amount_clp) / 1e9, 2)         AS monto_total_mil_millones_clp,
    ROUND(AVG(oc_amount_clp) / 1e6, 2)          AS monto_promedio_millones_clp,
    COUNT(DISTINCT supplier_rut)                AS proveedores_unicos
FROM ordenes_compra
WHERE buyer_name IS NOT NULL
GROUP BY buyer_name
ORDER BY monto_total_mil_millones_clp DESC
LIMIT 10;


-- ============================================================
-- 6. Distribución de OC por región del proveedor
-- ============================================================
SELECT
    supplier_region,
    COUNT(*)                                    AS num_oc,
    ROUND(SUM(oc_amount_clp) / 1e9, 2)         AS monto_total_mil_millones_clp,
    COUNT(DISTINCT supplier_rut)                AS proveedores_unicos
FROM ordenes_compra
WHERE supplier_region IS NOT NULL
  AND supplier_region != ''
GROUP BY supplier_region
ORDER BY monto_total_mil_millones_clp DESC;
