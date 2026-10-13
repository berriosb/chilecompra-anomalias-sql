"""
run_eda.py — Ejecuta queries analíticas clave sobre la DB SQLite
y guarda resultados como CSV/JSON para usar en el reporte.
"""
import sqlite3
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA = PROJECT_ROOT / 'data'
REPORTS = PROJECT_ROOT / 'reports'
REPORTS.mkdir(parents=True, exist_ok=True)

conn = sqlite3.connect(DATA / 'chilecompra.db')

def run_query(name, sql, save_csv=True):
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")
    cur = conn.cursor()
    cur.execute(sql)
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    print(f"Columnas: {cols}")
    print(f"Filas: {len(rows)}")
    
    if rows:
        # Imprimir primeras 10
        print(f"\nPrimeras 10 filas:")
        for r in rows[:10]:
            print(f"  {dict(zip(cols, r))}")
    
    if save_csv and rows:
        import csv
        out = REPORTS / f'{name}.csv'
        with open(out, 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(cols)
            w.writerows(rows)
        print(f"\n💾 Guardado: {out}")
    
    return rows

# ============================================
# QUERY 1: Resumen general
# ============================================
run_query('01_resumen_general', """
    SELECT 
        year,
        COUNT(*) AS total_oc,
        COUNT(DISTINCT buyer_id) AS organismos,
        COUNT(DISTINCT supplier_rut) AS proveedores,
        ROUND(SUM(oc_amount_clp) / 1e12, 3) AS monto_billones_clp,
        ROUND(AVG(oc_amount_clp) / 1e6, 2) AS promedio_millones,
        ROUND(MIN(oc_amount_clp) / 1e6, 2) AS min_millones,
        ROUND(MAX(oc_amount_clp) / 1e9, 2) AS max_mil_millones
    FROM ordenes_compra
    GROUP BY year
""")

# ============================================
# QUERY 2: Top 15 compradores por monto
# ============================================
run_query('02_top_compradores', """
    SELECT 
        buyer_name,
        COUNT(*) AS num_oc,
        ROUND(SUM(oc_amount_clp) / 1e9, 2) AS monto_mil_millones,
        ROUND(AVG(oc_amount_clp) / 1e6, 2) AS promedio_millones,
        COUNT(DISTINCT supplier_rut) AS num_proveedores
    FROM ordenes_compra
    WHERE buyer_name IS NOT NULL
    GROUP BY buyer_name
    ORDER BY monto_mil_millones DESC
    LIMIT 15
""")

# ============================================
# QUERY 3: Top 15 proveedores por venta al Estado
# ============================================
run_query('03_top_proveedores', """
    SELECT 
        supplier_rut,
        supplier_name,
        supplier_legal_name,
        supplier_region,
        COUNT(*) AS num_oc,
        ROUND(SUM(oc_amount_clp) / 1e9, 2) AS monto_mil_millones,
        COUNT(DISTINCT buyer_id) AS num_compradores
    FROM ordenes_compra
    WHERE supplier_rut IS NOT NULL
    GROUP BY supplier_rut, supplier_name, supplier_legal_name, supplier_region
    ORDER BY monto_mil_millones DESC
    LIMIT 15
""")

# ============================================
# QUERY 4: Gasto por región
# ============================================
run_query('04_gasto_por_region', """
    SELECT 
        supplier_region,
        COUNT(*) AS num_oc,
        ROUND(SUM(oc_amount_clp) / 1e9, 2) AS monto_mil_millones,
        COUNT(DISTINCT supplier_rut) AS num_proveedores,
        COUNT(DISTINCT buyer_id) AS num_compradores
    FROM ordenes_compra
    WHERE supplier_region IS NOT NULL AND supplier_region != ''
    GROUP BY supplier_region
    ORDER BY monto_mil_millones DESC
""")

# ============================================
# QUERY 5: Concentración (HHI) por organismo
# HHI = SUM(cuota^2) donde cuota es % del gasto del organismo
# HHI > 2500 = alta concentración
# Top 30 organismos con mayor gasto + su HHI
# ============================================
run_query('05_hhi_top30', """
    WITH top_compradores AS (
        SELECT buyer_id, buyer_name, SUM(oc_amount_clp) AS monto_total
        FROM ordenes_compra
        WHERE buyer_name IS NOT NULL AND supplier_rut IS NOT NULL
        GROUP BY buyer_id, buyer_name
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
        GROUP BY oc.buyer_id, oc.supplier_rut
    )
    SELECT 
        tc.buyer_name,
        ROUND(tc.monto_total / 1e9, 2) AS monto_mil_millones,
        COUNT(DISTINCT gp.supplier_rut) AS num_proveedores,
        ROUND(SUM(gp.monto_proveedor * gp.monto_proveedor / (tc.monto_total * tc.monto_total) * 10000), 1) AS hhi,
        CASE 
            WHEN SUM(gp.monto_proveedor * gp.monto_proveedor / (tc.monto_total * tc.monto_total) * 10000) < 1500 THEN '✅ Diversificado'
            WHEN SUM(gp.monto_proveedor * gp.monto_proveedor / (tc.monto_total * tc.monto_total) * 10000) < 2500 THEN '⚠️ Moderado'
            ELSE '🚨 Alta concentración'
        END AS nivel
    FROM top_compradores tc
    JOIN gasto_por_proveedor gp ON tc.buyer_id = gp.buyer_id
    GROUP BY tc.buyer_id, tc.buyer_name, tc.monto_total
    ORDER BY hhi DESC
""")

conn.close()
print(f"\n{'='*60}")
print(f"✅ Queries completadas. CSVs en: {REPORTS}/")
