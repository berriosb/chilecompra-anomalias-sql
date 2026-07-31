#!/usr/bin/env python3
"""
ETL: parquet chilecompra → CSV normalizado → bulk upload a Supabase via REST API.

Usa SUPABASE_SERVICE_ROLE_KEY para bypass RLS en uploads.
"""
import os
import sys
import json
import time
from pathlib import Path

import pandas as pd
import urllib.request
import urllib.error

# Configuración
SUPABASE_URL = "https://marmiucihaqvbepeavgd.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not SUPABASE_KEY:
    print("ERROR: set SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
    sys.exit(1)

# Headers para REST API
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

def clean_nan(v):
    """Limpia NaN/None a None para JSON."""
    if v is None:
        return None
    if isinstance(v, float) and pd.isna(v):
        return None
    return v

def upload_chunk(rows: list[dict], table: str = "ordenes_compra"):
    """Sube un chunk de rows a Supabase via POST /rest/v1/{table}."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            if resp.status >= 300:
                body = resp.read().decode("utf-8", errors="replace")
                print(f"ERROR {resp.status}: {body[:500]}", file=sys.stderr)
                return False
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTPError {e.code}: {body[:500]}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Exception: {e}", file=sys.stderr)
        return False


def main():
    parquet_path = Path("/home/bastian-berrios/Proyectos/chilecompra-anomalias-sql/data/chilecompra_combined.parquet")
    if not parquet_path.exists():
        print(f"ERROR: {parquet_path} no existe", file=sys.stderr)
        sys.exit(1)

    print("Loading parquet...")
    df = pd.read_parquet(parquet_path)
    print(f"Loaded {len(df):,} rows, {len(df.columns)} cols")

    # Mapeo a schema de Supabase
    # tabla ordenes_compra(year, oc_id, oc_date, monto, buyer_id, buyer_name,
    #                     buyer_region, supplier_id, supplier_name, supplier_region,
    #                     category, procurement_method)
    print("Mapping columns...")

    # Columnas del parquet son las OCDS crudas — mapeo a nombres limpios
    rename_map = {
        "oc_id": "oc_id",
        "oc_date": "oc_date",
        "year": "year",
        "oc_amount_clp": "monto",
        "buyer_id": "buyer_id",
        "buyer_name": "buyer_name",
        "supplier_rut": "supplier_id",
        "supplier_name": "supplier_name",
        "supplier_region": "supplier_region",
        "category_description": "category",
        "procurement_method": "procurement_method",
    }

    # Si las columnas del parquet son diferentes, ajusto el mapeo
    cols_lower = {c.lower(): c for c in df.columns}
    actual_rename = {}
    for parquet_col, target_col in rename_map.items():
        for candidate in [parquet_col, parquet_col.lower(), parquet_col.upper()]:
            if candidate in cols_lower:
                actual_rename[cols_lower[candidate]] = target_col
                break

    if not actual_rename:
        print(f"ERROR: no se pudo mapear columnas. Tengo: {list(df.columns)}", file=sys.stderr)
        sys.exit(1)

    df = df.rename(columns=actual_rename)

    # Quedarse solo con las columnas que existen en el schema
    target_cols = ["year", "oc_id", "oc_date", "monto", "buyer_id", "buyer_name",
                   "supplier_id", "supplier_name", "supplier_region",
                   "category", "procurement_method"]

    available = [c for c in target_cols if c in df.columns]
    print(f"Cols para upload: {available}")
    df = df[available]

    # Limpieza
    df = df.replace({pd.NA: None, float("nan"): None})
    for col in df.columns:
        if df[col].dtype == "datetime64[ns]":
            df[col] = df[col].astype(str)
        elif df[col].dtype in ("float64", "float32"):
            df[col] = df[col].astype(object).where(df[col].notna(), None)

    # Subir en chunks
    chunk_size = 1000
    total = len(df)
    success = 0
    fail = 0
    start = time.time()

    for i in range(0, total, chunk_size):
        chunk = df.iloc[i:i+chunk_size].to_dict(orient="records")
        # Limpiar NaN
        chunk = [{k: clean_nan(v) for k, v in row.items()} for row in chunk]

        if upload_chunk(chunk):
            success += len(chunk)
        else:
            fail += len(chunk)

        # Status cada 10 chunks
        if (i // chunk_size) % 10 == 0:
            elapsed = time.time() - start
            rate = success / elapsed if elapsed > 0 else 0
            pct = (i / total) * 100
            print(f"  [{pct:5.1f}%] {success:,}/{total:,} OK ({fail} failed) — {rate:.0f} rows/s")

    elapsed = time.time() - start
    print(f"\nDONE: {success:,}/{total:,} uploaded in {elapsed:.1f}s ({success/elapsed:.0f} rows/s)")
    if fail:
        print(f"FAILED: {fail} rows", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
