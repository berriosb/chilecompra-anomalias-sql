-- 03_anomalias_precio.sql
--
-- Detección de órdenes de compra con precios anómalos.
-- Estrategia: z-score e IQR por categoría (UNSPSC).
--
-- Justificación: Una OC de $100M puede ser normal para "Equipos médicos"
-- pero anómala para "Material de oficina". Normalizar por categoría es clave.


WITH stats_por_categoria AS (
    SELECT
        category_id,
        category_description,
        COUNT(*)                                        AS num_oc,
        AVG(oc_amount_clp)                              AS avg_amount,
        STDDEV(oc_amount_clp)                           AS stddev_amount,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY oc_amount_clp) AS q1,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY oc_amount_clp) AS median,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY oc_amount_clp) AS q3
    FROM ordenes_compra
    WHERE category_id IS NOT NULL
      AND oc_status IN ('active', 'completed')
      AND oc_amount_clp > 0
    GROUP BY category_id, category_description
    HAVING COUNT(*) >= 50  -- Solo categorías con suficiente muestra
),

con_zscore AS (
    SELECT
        oc.oc_id,
        oc.oc_date,
        oc.buyer_name,
        oc.supplier_name,
        oc.supplier_rut,
        oc.category_description,
        oc.oc_amount_clp,
        sc.avg_amount,
        sc.stddev_amount,
        sc.median,
        sc.q1,
        sc.q3,
        -- Z-score: cuántas desviaciones estándar sobre la media
        (oc.oc_amount_clp - sc.avg_amount) / NULLIF(sc.stddev_amount, 0) AS z_score,
        -- IQR outlier: si monto > Q3 + 1.5*IQR
        sc.q3 + 1.5 * (sc.q3 - sc.q1)                                  AS iqr_upper_bound,
        -- Ratio vs mediana (más interpretable)
        ROUND(oc.oc_amount_clp / NULLIF(sc.median, 0), 2)              AS ratio_vs_mediana
    FROM ordenes_compra oc
    JOIN stats_por_categoria sc
      ON oc.category_id = sc.category_id
    WHERE oc.oc_status IN ('active', 'completed')
      AND oc.oc_amount_clp > 0
)

-- Top OC anómalas (z-score > 5 Y monto > $10M)
SELECT
    oc_id,
    oc_date,
    buyer_name                                                  AS organismo,
    supplier_name                                               AS proveedor,
    category_description                                        AS rubro,
    ROUND(oc_amount_clp / 1e6, 2)                              AS monto_millones_clp,
    ROUND(median / 1e6, 2)                                     AS mediana_rubro_millones_clp,
    ROUND(z_score, 2)                                          AS z_score,
    ratio_vs_mediana                                            AS veces_mediana,
    CASE
        WHEN z_score > 10  THEN '🚨 Extremo'
        WHEN z_score > 5   THEN '⚠️ Muy anómalo'
        WHEN z_score > 3   THEN '⚡ Anómalo'
        ELSE NULL
    END                                                         AS severidad
FROM con_zscore
WHERE z_score > 5
  AND oc_amount_clp > 1e7  -- > $10M CLP
ORDER BY z_score DESC
LIMIT 200;
