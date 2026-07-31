-- 02_concentracion_proveedores.sql
--
-- Análisis de concentración de proveedores por organismo público.
-- Calcula el HHI (Herfindahl-Hirschman Index) por cada comprador.
--
-- HHI = suma de (cuota_mercado_i)^2 para cada proveedor
--   HHI < 1500: mercado diversificado
--   1500-2500:  concentración moderada
--   > 2500:     alta concentración (competencia reducida)
--
-- También calcula:
--   - Total gastado por organismo
--   - Número de proveedores únicos
--   - Proveedor dominante (% del gasto)


WITH proveedores_por_comprador AS (
    SELECT
        buyer_id,
        buyer_name,
        supplier_rut,
        supplier_name,
        SUM(oc_amount_clp) AS monto_total_proveedor,
        COUNT(*)            AS num_oc
    FROM ordenes_compra
    WHERE buyer_id IS NOT NULL
      AND supplier_rut IS NOT NULL
      AND oc_status IN ('active', 'completed')
    GROUP BY buyer_id, buyer_name, supplier_rut, supplier_name
),

gasto_por_comprador AS (
    SELECT
        buyer_id,
        buyer_name,
        SUM(monto_total_proveedor)              AS monto_total_comprador,
        COUNT(DISTINCT supplier_rut)            AS num_proveedores_unicos,
        SUM(num_oc)                             AS num_oc_total
    FROM proveedores_por_comprador
    GROUP BY buyer_id, buyer_name
),

con_porcentajes AS (
    SELECT
        pc.buyer_id,
        pc.buyer_name,
        pc.supplier_rut,
        pc.supplier_name,
        pc.monto_total_proveedor,
        pc.num_oc,
        gc.monto_total_comprador,
        gc.num_proveedores_unicos,
        gc.num_oc_total,
        -- Cuota de mercado del proveedor dentro del organismo
        100.0 * pc.monto_total_proveedor / gc.monto_total_comprador AS cuota_pct
    FROM proveedores_por_comprador pc
    JOIN gasto_por_comprador gc USING (buyer_id)
),

hhi_por_comprador AS (
    SELECT
        buyer_id,
        buyer_name,
        monto_total_comprador,
        num_proveedores_unicos,
        num_oc_total,
        -- HHI: suma de (cuota_pct)^2
        ROUND(SUM(cuota_pct * cuota_pct), 2) AS hhi,
        -- Proveedor dominante
        MAX_BY(supplier_name, cuota_pct)     AS proveedor_dominante,
        MAX(cuota_pct)                        AS cuota_proveedor_dominante_pct
    FROM con_porcentajes
    GROUP BY buyer_id, buyer_name, monto_total_comprador,
             num_proveedores_unicos, num_oc_total
)

-- Resultado: organismos ordenados por HHI (más concentrado primero)
SELECT
    buyer_name                                                   AS organismo,
    ROUND(monto_total_comprador / 1e9, 2)                        AS monto_total_millones_clp,
    num_proveedores_unicos                                       AS proveedores_unicos,
    num_oc_total                                                 AS num_oc,
    hhi                                                          AS indice_hhi,
    CASE
        WHEN hhi < 1500                       THEN '✅ Diversificado'
        WHEN hhi BETWEEN 1500 AND 2500       THEN '⚠️ Moderado'
        ELSE '🚨 Alta concentración'
    END                                                          AS nivel_concentracion,
    proveedor_dominante                                          AS proveedor_principal,
    ROUND(cuota_proveedor_dominante_pct, 2)                      AS cuota_proveedor_principal_pct
FROM hhi_por_comprador
WHERE monto_total_comprador > 1e8  -- Solo organismos que gastaron > $100M CLP
ORDER BY hhi DESC
LIMIT 100;
