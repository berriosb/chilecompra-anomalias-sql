# Data — ChileCompra OCDS

## Fuente

- **Sitio oficial:** https://datos-abiertos.chilecompra.cl
- **Mirror internacional (OCDS):** https://data.open-contracting.org/es/publication/144
- **Licencia:** CC0 1.0 Universal (dominio público)

## Método de descarga

```bash
# 2024 (~525 MB comprimido, ~5.5 GB descomprimido)
curl -L "https://data.open-contracting.org/es/publication/144/download?name=2024.csv.tar.gz" \
  -o data/raw/chilecompra_2024.csv.tar.gz
tar -xzf data/raw/chilecompra_2024.csv.tar.gz -C data/raw/2024/
```

> Los tar.gz NO se commitean al repo (>100MB). Solo los parquets limpios.

## Pipeline de limpieza

| Filtro | Razón | OC removidas |
|---|---|---|
| `oc_amount_clp <= 0` | OC con errores en el source (INT64 min, NULL) | 59 |
| `oc_amount_clp > $10B CLP` | Outliers absurdos (>$10B en una sola OC) | <50 |
| Sin `buyer_name` o sin `supplier_rut` | Análisis no puede hacerse sin identificar contrapartes | ~24% |
| Status ≠ active/completed | OC canceladas o pendientes sin valor analítico | ~6% |
| `oc_date < 2024-01-01` | Datos fuera del período target | ~3% |

## Archivos generados

| Archivo | Tamaño | Contenido |
|---|---|---|
| `chilecompra_combined.parquet` | 80 MB | 918,052 OC limpias, 18 columnas |
| `chilecompra.db` | 440 MB | SQLite con 5 índices para queries rápidas |
| `sample_oc.csv` | 367 KB | 1,000 OC de muestra para recruiter |
| `temp/chilecompra_2024.parquet` | 115 MB | Parquet anual antes de combinar |

## Esquema (18 columnas)

```python
{
    'year': int,                        # 2024
    'oc_id': str,                       # ID único de la OC
    'oc_date': date,                    # fecha emisión
    'oc_status': str,                   # active | completed | cancelled
    'oc_amount_clp': int,               # monto en pesos chilenos
    'oc_currency': str,                 # CLP
    'oc_title': str,                    # descripción corta
    'buyer_id': str,                    # FK al organismo comprador
    'buyer_name': str,                  # nombre del organismo
    'procurement_method': str,          # direct | open | selective
    'category_id': str,                 # código UNSPSC
    'category_description': str,        # descripción categoría
    'tender_title': str,                # título del proceso de compra
    'supplier_name': str,               # nombre del proveedor
    'supplier_rut': str,                # RUT del proveedor
    'supplier_legal_name': str,         # razón social
    'supplier_region': str,             # región del proveedor
    'supplier_scale': str,              # micro | pequeña | mediana | grande
}
```

## Estadísticas del dataset final

```
OC totales:        918,052
Organismos:        5,321 únicos
Proveedores:       35,492 únicos (por RUT)
Período:           2024-01-01 → 2024-12-31
Monto total:       $3.24 billones CLP
Promedio OC:       $3.53 millones
Mediana OC:        $600K
P99:               $40.8 millones
```

## Reproducibilidad

Todo el pipeline es reproducible desde los CSVs originales:

```bash
python src/download.py --years 2024 2025 --extract
python src/etl.py --years 2024 2025
python src/load_sqlite.py
python src/run_eda.py
```

Tiempo total end-to-end: ~15 minutos en una máquina con 16GB RAM.
