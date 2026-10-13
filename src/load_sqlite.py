"""
load_sqlite.py — Carga el parquet a SQLite local para validar queries.

SQLite es perfecto para esto:
- Mismo SQL estándar (95% compatible con PostgreSQL)
- Archivo único (data/chilecompra.db) — fácil de commitear o compartir
- Sin auth, sin costos, sin Supabase setup
- Rápido para 1M filas

Para producción: cambiar a load_supabase.py (ya escrito)
"""

import sqlite3
import sys
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA = PROJECT_ROOT / 'data'
PARQUET = DATA / 'chilecompra_combined.parquet'
DB_FILE = DATA / 'chilecompra.db'

def main():
    if not PARQUET.exists():
        print(f"❌ No existe: {PARQUET}", file=sys.stderr)
        sys.exit(1)

    # Borrar DB anterior si existe
    if DB_FILE.exists():
        DB_FILE.unlink()
        print(f"🗑️  Borrado: {DB_FILE}")

    print(f"📂 Cargando {PARQUET}...")
    df = pd.read_parquet(PARQUET)
    print(f"   {len(df):,} filas, {len(df.columns)} columnas")

    # Renombrar columnas para SQL (sin caracteres especiales)
    df.columns = [c.replace('-', '_') for c in df.columns]

    print(f"💾 Guardando en SQLite: {DB_FILE}")
    conn = sqlite3.connect(DB_FILE)

    # Crear tabla
    df.to_sql('ordenes_compra', conn, if_exists='replace', index=False)

    # Crear índices
    print("🔧 Creando índices...")
    cur = conn.cursor()
    cur.execute("CREATE INDEX idx_buyer_id ON ordenes_compra(buyer_id)")
    cur.execute("CREATE INDEX idx_supplier_rut ON ordenes_compra(supplier_rut)")
    cur.execute("CREATE INDEX idx_category_id ON ordenes_compra(category_id)")
    cur.execute("CREATE INDEX idx_oc_date ON ordenes_compra(oc_date)")
    cur.execute("CREATE INDEX idx_amount ON ordenes_compra(oc_amount_clp)")
    conn.commit()

    # Verificar
    cur.execute("SELECT COUNT(*) FROM ordenes_compra")
    count = cur.fetchone()[0]
    size_mb = DB_FILE.stat().st_size / 1e6
    print(f"✅ DB creada: {count:,} filas, {size_mb:.1f}MB")

    # Stats
    cur.execute("SELECT COUNT(DISTINCT buyer_name) FROM ordenes_compra")
    orgs = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT supplier_rut) FROM ordenes_compra")
    sups = cur.fetchone()[0]
    cur.execute("SELECT SUM(oc_amount_clp) FROM ordenes_compra")
    total = cur.fetchone()[0]
    print(f"   Organismos: {orgs:,}")
    print(f"   Proveedores: {sups:,}")
    print(f"   Monto total: {total/1e12:.2f} billones CLP")

    conn.close()
    print(f"\n🚀 Para consultar:")
    print(f"   sqlite3 {DB_FILE}")
    print(f"   sqlite3 {DB_FILE} < sql/02_concentracion_proveedores.sql")

if __name__ == '__main__':
    main()
