# Metodología

## Cálculo del HHI

El **Herfindahl-Hirschman Index** mide concentración de mercado:

```
HHI = Σ (s_i)² × 10,000

donde s_i = cuota de mercado del proveedor i (en fracción, ej: 0.25)
```

**Interpretación:**
| HHI | Nivel |
|---|---|
| < 1,500 | ✅ Diversificado |
| 1,500 - 2,500 | ⚠️ Moderadamente concentrado |
| > 2,500 | 🚨 Altamente concentrado |

**Aplicación a ChileCompra:** Calculamos HHI por cada organismo comprador, donde:
- `s_i` = monto gastado por el organismo al proveedor `i` / monto total gastado por el organismo
- Se calcula sobre OC con proveedor identificado (`supplier_rut IS NOT NULL`)

**Ejemplo real:**
- MOP Ñuble: 14 proveedores, HHI = 7,237 → mercado ALTAMENTE concentrado
- Significa que 1-2 proveedores dominan casi todo el gasto de ese organismo

## Limpieza de datos

### Pipeline

```
CSV raw (5GB) 
  → ETL (pandas, chunked) 
    → Parquet limpio (80MB)
      → SQLite con índices (440MB)
```

### Filtros aplicados

1. **Monto válido:** `$1K <= oc_amount_clp <= $10B CLP`
2. **Contrapartes identificadas:** `buyer_name IS NOT NULL AND supplier_rut IS NOT NULL`
3. **Status válido:** `oc_status IN ('active', 'completed')`
4. **Fecha válida:** `oc_date >= 2024-01-01`

### Manejo de valores faltantes

- **OC sin `buyer_name`:** Excluidas del análisis (no podemos atribuir gasto a organismo)
- **OC sin `supplier_rut`:** Excluidas del análisis (no podemos calcular concentración)
- **OC sin `category_description`:** Mantenidas (no afecta top compradores/proveedores)

## Queries SQL

### Top compradores (`02_top_compradores.sql`)

```sql
SELECT 
    buyer_name,
    COUNT(*) AS num_oc,
    SUM(oc_amount_clp) AS monto_total,
    AVG(oc_amount_clp) AS monto_promedio,
    COUNT(DISTINCT supplier_rut) AS num_proveedores
FROM ordenes_compra
GROUP BY buyer_name
ORDER BY monto_total DESC
LIMIT 15;
```

### HHI por organismo (`02_concentracion_proveedores.sql`)

```sql
WITH gasto_por_proveedor AS (
    SELECT 
        oc.buyer_id,
        oc.supplier_rut,
        SUM(oc.oc_amount_clp) AS monto_proveedor
    FROM ordenes_compra oc
    WHERE oc.supplier_rut IS NOT NULL
    GROUP BY oc.buyer_id, oc.supplier_rut
)
SELECT 
    oc.buyer_name,
    SUM(gp.monto_proveedor * gp.monto_proveedor / (total * total) * 10000) AS hhi
FROM ...
```

(Simplificado — ver archivo completo para la query con todos los joins)

## Reproducibilidad

Todo el pipeline se puede correr con:

```bash
python src/download.py --years 2024 2025 --extract
python src/etl.py --years 2024 2025
python src/load_sqlite.py
python src/run_eda.py
```

Tiempo total: ~15 minutos en una máquina con 16GB RAM.
