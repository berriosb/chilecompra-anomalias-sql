-- schema.sql — Schema PostgreSQL optimizado para Supabase free tier (500MB)
--
-- Estrategia: una sola tabla plana por OC, con índices estratégicos.
-- ~17 columnas, ~6M filas estimadas (2024+2025).
-- Tamaño esperado: ~250-350MB en disco.

-- ============================================================
-- DROP (comentar si ya tenés datos)
-- ============================================================
DROP TABLE IF EXISTS ordenes_compra;

-- ============================================================
-- CREATE TABLE
-- ============================================================
CREATE TABLE ordenes_compra (
    -- Identificadores
    oc_id              VARCHAR(50)  PRIMARY KEY,
    year               SMALLINT     NOT NULL,

    -- OC data
    oc_date            DATE         NOT NULL,
    oc_status          VARCHAR(30),
    oc_amount_clp      BIGINT       NOT NULL CHECK (oc_amount_clp > 0),
    oc_currency        VARCHAR(10)  DEFAULT 'CLP',
    oc_title           TEXT,

    -- Comprador (organismo público)
    buyer_id           VARCHAR(50),
    buyer_name         VARCHAR(200),

    -- Proveedor
    supplier_name      VARCHAR(200),
    supplier_rut       VARCHAR(20),
    supplier_legal_name VARCHAR(200),
    supplier_region    VARCHAR(100),
    supplier_scale     VARCHAR(20),

    -- Compra
    procurement_method VARCHAR(50),
    category_id        VARCHAR(30),    -- UNSPSC code
    category_description VARCHAR(200),
    tender_title       TEXT
);

-- ============================================================
-- ÍNDICES — Optimizados para queries analíticas
-- ============================================================

-- Fecha (queries por período)
CREATE INDEX idx_oc_date ON ordenes_compra(oc_date);

-- Comprador (concentración por organismo)
CREATE INDEX idx_buyer_id ON ordenes_compra(buyer_id);
CREATE INDEX idx_buyer_name ON ordenes_compra(buyer_name);

-- Proveedor (concentración por proveedor)
CREATE INDEX idx_supplier_rut ON ordenes_compra(supplier_rut);

-- Categoría (anomalías por rubro)
CREATE INDEX idx_category_id ON ordenes_compra(category_id);

-- Método de compra (análisis por tipo)
CREATE INDEX idx_procurement_method ON ordenes_compra(procurement_method);

-- Monto (outliers)
CREATE INDEX idx_amount ON ordenes_compra(oc_amount_clp);

-- Región
CREATE INDEX idx_supplier_region ON ordenes_compra(supplier_region);

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista: OC activas (excluye canceladas)
CREATE OR REPLACE VIEW oc_activas AS
SELECT *
FROM ordenes_compra
WHERE oc_status IN ('active', 'completed');

-- Vista: OC con proveedor identificado
CREATE OR REPLACE VIEW oc_con_proveedor AS
SELECT *
FROM ordenes_compra
WHERE supplier_rut IS NOT NULL
  AND supplier_rut != '';

-- ============================================================
-- ESTADÍSTICAS — Para el query planner
-- ============================================================
ANALYZE ordenes_compra;

-- ============================================================
-- INFORMACIÓN DE TABLA
-- ============================================================
SELECT
    pg_size_pretty(pg_total_relation_size('ordenes_compra')) AS total_size,
    pg_size_pretty(pg_relation_size('ordenes_compra'))        AS table_size,
    pg_size_pretty(pg_indexes_size('ordenes_compra'))         AS indexes_size
;
