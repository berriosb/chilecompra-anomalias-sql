# ChileCompra — Análisis de Licitaciones Públicas

> Análisis de 918K órdenes de compra del Estado chileno en 2024 usando datos abiertos OCDS.
> Detección de concentración de mercado (HHI), top anómalos, estacionalidad y equidad territorial.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Dataset: OCDS](https://img.shields.io/badge/Dataset-OCDS-green)](https://data.open-contracting.org/es/publication/144)
[![SQL: SQLite/PostgreSQL](https://img.shields.io/badge/SQL-SQLite%2FPostgreSQL-blue)](./sql/)

## Hallazgos principales

> **918,052 OC analizadas** | **5,321 organismos compradores** | **35,492 proveedores** | **$3.24 billones CLP**

### Top 5 organismos compradores (2024)

| # | Organismo | OC | Monto (MM CLP) | Proveedores |
|---|---|---|---|---|
| 1 | CENABAST (Central Abastecimiento Salud) | 269 | 234,790 | 81 |
| 2 | ONEMI | 2,612 | 69,860 | 63 |
| 3 | FONASA | 227 | 47,690 | 116 |
| 4 | I. Municipalidad de Maipú | 115 | 32,290 | 101 |
| 5 | Hospital Puerto Montt | 8,845 | 31,520 | 734 |

### Top 5 proveedores (venta al Estado)

| # | Proveedor | OC | Monto (MM CLP) | Compradores |
|---|---|---|---|---|
| 1 | COPEC S.A. | 6,555 | 51,550 | 1,526 |
| 2 | Edenred Chile S.A. | 4,001 | 34,400 | 864 |
| 3 | Sanofi-Aventis | 238 | 23,900 | 34 |
| 4 | Gasco GLP | 7,849 | 23,900 | 1,599 |
| 5 | Turavion (viajes) | 61,125 | 22,550 | 1,653 |

### 🚨 Organismos con ALTA concentración de proveedores (HHI > 2500)

| Organismo | HHI | Proveedores | Monto (MM CLP) |
|---|---|---|---|
| MOP Ñuble (OO.HH.) | **7,237** | 14 | 10,900 |
| Servicio de Salud Sur | **6,304** | 280 | 18,170 |
| Parque Metropolitano | **2,724** | 164 | 19,280 |
| Municipalidad Huechuraba | **2,692** | 447 | 21,340 |
| PDI | **2,642** | 153 | 21,930 |

**Interpretación:** HHI > 2500 indica mercado altamente concentrado. El MOP Ñuble con solo 14 proveedores y un HHI de 7,237 es caso de libro: uno o dos proveedores dominan casi todo el gasto.

### Distribución geográfica del gasto

- **Región Metropolitana**: $2.13 billones (65.7% del total)
- **Valparaíso**: $186 mil millones (5.8%)
- **Biobío**: $161 mil millones (5.0%)
- Resto del país: < 4% cada región

---

## Contexto

El Estado chileno gasta ~US$15 mil millones al año en compras públicas a través de la plataforma **Mercado Público**, administrada por [ChileCompra](https://www.chilecompra.cl). La Ley 19.886 obliga a 850 instituciones del Estado (ministerios, municipalidades, hospitales, fuerzas armadas, universidades) a comprar a través de esta plataforma.

Este proyecto analiza los datos abiertos oficiales en formato **OCDS** (Open Contracting Data Standard), publicados por [Open Contracting Partnership](https://data.open-contracting.org/es/publication/144).

## Preguntas de negocio que responde

1. **¿Hay concentración sospechosa de proveedores?** Calculamos el **HHI** (Herfindahl-Hirschman Index) por organismo público.
2. **¿Hay OC con precios anómalos?** Detección via z-score e IQR por categoría.
3. **¿Cuándo compra más el Estado?** Estacionalidad mensual y por día de la semana.
4. **¿Quiénes son los proveedores dominantes?** Top proveedores por monto y por diversidad de compradores.
5. **¿Hay equidad territorial?** Gasto por región del proveedor.

## Dataset

| Campo | Valor |
|---|---|
| **Fuente** | [Open Contracting Partnership - ChileCompra](https://data.open-contracting.org/es/publication/144) |
| **Formato** | OCDS (Open Contracting Data Standard), CSV bulk |
| **Período** | 2024-01-01 → 2024-12-31 |
| **OC totales (post-limpieza)** | 918,052 |
| **Licencia** | [CC0 1.0 Universal (dominio público)](https://creativecommons.org/publicdomain/zero/1.0/) |

### Pipeline de datos

```
OCDS bulk CSV (5GB)
    ↓
download.py (Fastly CDN)
    ↓
etl.py (chunked, año por año, parties filtrado por chunks)
    ↓
chilecompra_combined.parquet (80MB, 918K filas, 18 columnas)
    ↓
load_sqlite.py → chilecompra.db (440MB, 5 índices)
    ↓
run_eda.py → 5 CSVs de resultados en reports/
```

## Estructura del repo

```
chilecompra-anomalias-sql/
├── README.md                       ← este archivo
├── LICENSE                         ← MIT
├── .gitignore
├── requirements.txt
│
├── data/
│   ├── README.md                   ← método de descarga + limpieza
│   ├── chilecompra_combined.parquet  ← 80MB, datos limpios
│   ├── chilecompra.db              ← 440MB, SQLite para queries
│   ├── sample_oc.csv               ← 1000 filas para recruiter
│   └── temp/                       ← parquets anuales (gitignored)
│
├── src/
│   ├── download.py                 ← descarga OCDS con curl
│   ├── etl.py                      ← une 4 CSVs → parquet (optimizado RAM)
│   ├── load_sqlite.py              ← parquet → SQLite con índices
│   ├── load_supabase.py            ← alternativa para PostgreSQL
│   ├── run_eda.py                  ← ejecuta 5 queries analíticas
│   ├── generate_sample.py          ← crea sample_oc.csv
│   └── config.py                   ← paths + .env
│
├── sql/
│   ├── schema.sql                  ← DDL PostgreSQL
│   ├── 01_eda_exploracion.sql
│   ├── 02_concentracion_proveedores.sql  ← HHI
│   ├── 03_anomalias_precio.sql
│   ├── 04_estacionalidad.sql
│   └── queries_auxiliares.sql      ← vistas + funciones
│
├── reports/
│   ├── 01_resumen_general.csv
│   ├── 02_top_compradores.csv
│   ├── 03_top_proveedores.csv
│   ├── 04_gasto_por_region.csv
│   └── 05_hhi_top30.csv            ← hallazgos de concentración
│
└── docs/
    ├── METODOLOGIA.md
    └── LIMITACIONES.md
```

## Cómo correr localmente

```bash
# 1. Clonar
git clone https://github.com/berriosb/chilecompra-anomalias-sql
cd chilecompra-anomalias-sql

# 2. Setup Python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Descargar datos OCDS (~525MB por año)
python src/download.py --years 2024 2025 --extract

# 4. ETL: unir CSVs en parquet limpio
python src/etl.py --years 2024 2025

# 5. Cargar a SQLite
python src/load_sqlite.py

# 6. Correr análisis
python src/run_eda.py

# 7. Ver resultados
ls reports/*.csv
sqlite3 data/chilecompra.db "SELECT * FROM ordenes_compra LIMIT 5"
```

## Stack técnico

| Capa | Tecnología | Razón |
|---|---|---|
| Datos | OCDS (CC0 1.0) | Datos abiertos oficiales sin auth |
| ETL | Python + pandas + pyarrow | Chunked processing, baja RAM |
| Storage | Parquet + SQLite | Eficiente, versionable, sin servicios externos |
| Queries | SQL estándar (CTEs, window functions) | Demuestra SQL avanzado |
| Visualización | Generada desde CSVs | Plotly/Matplotlib en próxima iteración |

## Limitaciones conocidas

Ver [`docs/LIMITACIONES.md`](./docs/LIMITACIONES.md) para detalle completo.

- **Período:** Solo 2024 (los datos OCDS históricos completos para Chile arrancan en 2022 pero los datasets por año tienen inconsistencias)
- **OC con monto $0 o negativo:** Filtradas (1.7% del dataset original)
- **OC con monto > $10B:** Filtradas (outliers extremos del source)
- **Compra Ágil (<$30K):** Excluida del dataset OCDS oficial
- **Empresas públicas:** No obligadas a usar Mercado Público, no aparecen
- **Obras públicas:** Excluidas (MOP, MINVU tienen mecanismo propio)

## Próximos pasos

- [ ] Generar visualizaciones (PNG + dashboard Next.js)
- [ ] Análisis de anomalías de precio con z-score por categoría UNSPSC
- [ ] Deploy dashboard en Vercel
- [ ] Cross-reference con SERNAC (proveedores con reclamos)
- [ ] Análisis de colusión por clusters temporales

## Autor

**Bastian Berrios** — Ingeniero Civil Industrial, buscando trabajo como Data Analyst
- GitHub: [@berriosb](https://github.com/berriosb)
- LinkedIn: [bastian-berrios](https://linkedin.com/in/bastian-berrios)

## Licencia

- **Código:** MIT
- **Datos:** CC0 1.0 Universal — [Open Contracting Partnership](https://data.open-contracting.org/es/publication/144)
