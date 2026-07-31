-- 04_estacionalidad.sql
--
-- Análisis de estacionalidad: ¿cuándo compra más el Estado?
-- Patrones esperados:
--   - Marzo y noviembre: meses de ajuste presupuestario
--   - Efecto pre-electoral: año anterior a elecciones presidenciales
--   - Estacionalidad por método de compra


-- ============================================================
-- 1. Gasto mensual agregado
-- ============================================================
WITH gasto_mensual AS (
    SELECT
        DATE_TRUNC('month', oc_date)        AS mes,
        year,
        EXTRACT(MONTH FROM oc_date)::INT   AS mes_num,
        COUNT(*)                            AS num_oc,
        SUM(oc_amount_clp) / 1e9            AS monto_mil_millones_clp
    FROM ordenes_compra
    WHERE oc_date IS NOT NULL
    GROUP BY DATE_TRUNC('month', oc_date), year, EXTRACT(MONTH FROM oc_date)
)
SELECT
    mes_num,
    ROUND(AVG(num_oc), 0)                   AS promedio_oc_mes,
    ROUND(AVG(monto_mil_millones_clp), 2)   AS promedio_monto_mil_millones_clp,
    COUNT(*)                                 AS num_meses_observados
FROM gasto_mensual
GROUP BY mes_num
ORDER BY mes_num;


-- ============================================================
-- 2. Serie de tiempo completa (para gráfico)
-- ============================================================
SELECT
    DATE_TRUNC('month', oc_date)            AS mes,
    COUNT(*)                                AS num_oc,
    SUM(oc_amount_clp) / 1e9                AS monto_mil_millones_clp,
    COUNT(DISTINCT buyer_id)                AS organismos_activos,
    COUNT(DISTINCT supplier_rut)            AS proveedores_activos
FROM ordenes_compra
WHERE oc_date IS NOT NULL
GROUP BY DATE_TRUNC('month', oc_date)
ORDER BY mes;


-- ============================================================
-- 3. Comparación por día de la semana
-- ============================================================
SELECT
    EXTRACT(ISODOW FROM oc_date)::INT       AS dia_semana,
    CASE EXTRACT(ISODOW FROM oc_date)::INT
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
        WHEN 7 THEN 'Domingo'
    END                                     AS dia_nombre,
    COUNT(*)                                AS num_oc,
    ROUND(SUM(oc_amount_clp) / 1e9, 2)     AS monto_mil_millones_clp
FROM ordenes_compra
WHERE oc_date IS NOT NULL
GROUP BY EXTRACT(ISODOW FROM oc_date)
ORDER BY dia_semana;


-- ============================================================
-- 4. Estacionalidad por método de compra
-- ============================================================
SELECT
    procurement_method,
    EXTRACT(MONTH FROM oc_date)::INT       AS mes_num,
    COUNT(*)                                AS num_oc,
    ROUND(SUM(oc_amount_clp) / 1e6, 2)     AS monto_millones_clp
FROM ordenes_compra
WHERE procurement_method IS NOT NULL
  AND oc_date IS NOT NULL
GROUP BY procurement_method, EXTRACT(MONTH FROM oc_date)
ORDER BY procurement_method, mes_num;
