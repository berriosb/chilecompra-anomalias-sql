"""
load_supabase.py — Carga el Parquet combinado a Supabase PostgreSQL.

Estrategia para Supabase free (500MB):
    - Carga por chunks de 50K filas
    - Usa COPY FROM STDIN (más rápido que INSERT)
    - Desactiva índices durante carga, reactiva al final
    - VACUUM ANALYZE al final

Uso:
    python src/load_supabase.py
    python src/load_supabase.py --input data/chilecompra_combined.parquet
"""

import argparse
import io
import sys
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2 import sql
from sqlalchemy import create_engine

sys.path.insert(0, str(Path(__file__).parent))
from config import Config


CHUNK_SIZE = 50_000


def get_connection():
    """Crea conexión psycopg2 a Supabase."""
    if not Config.SUPABASE_DB_URL:
        raise ValueError(
            "SUPABASE_DB_URL no configurada. Copiá .env.example a .env "
            "y completá los valores."
        )
    return psycopg2.connect(Config.SUPABASE_DB_URL)


def create_schema(conn):
    """Ejecuta sql/schema.sql."""
    schema_path = Config.SQL_DIR / "schema.sql"
    print(f"📋 Ejecutando {schema_path}...")
    sql_content = schema_path.read_text()
    with conn.cursor() as cur:
        cur.execute(sql_content)
    conn.commit()
    print("✅ Schema creado")


def load_parquet_to_supabase(parquet_file: Path):
    """Carga un archivo Parquet a la tabla ordenes_compra."""
    
    print(f"📂 Leyendo {parquet_file}...")
    table = pd.read_parquet(parquet_file)
    print(f"   {len(table):,} filas, {len(table.columns)} columnas")
    
    # Conectar
    print(f"🔌 Conectando a Supabase...")
    conn = get_connection()
    
    try:
        # 1. Crear/reset schema
        create_schema(conn)
        
        # 2. Preparar datos: asegurar tipos correctos y limpiar NaN
        print(f"🧹 Preparando datos...")
        
        # Reemplazar NaN con None para PostgreSQL
        table = table.where(pd.notnull(table), None)
        
        # Convertir fechas a string ISO
        if "oc_date" in table.columns:
            table["oc_date"] = pd.to_datetime(table["oc_date"]).dt.strftime("%Y-%m-%d")
        
        # Convertir enteros nullable
        for col in ["year"]:
            if col in table.columns:
                table[col] = table[col].astype("Int64")  # Nullable int
        
        # Convertir montos a int
        if "oc_amount_clp" in table.columns:
            table["oc_amount_clp"] = table["oc_amount_clp"].astype("int64")
        
        print(f"   Datos preparados")
        
        # 3. Cargar por chunks usando COPY (mucho más rápido que INSERT)
        total_chunks = (len(table) // CHUNK_SIZE) + 1
        total_inserted = 0
        
        print(f"📥 Cargando {total_chunks} chunks de {CHUNK_SIZE} filas...")
        
        columns = list(table.columns)
        
        with conn.cursor() as cur:
            for i in range(0, len(table), CHUNK_SIZE):
                chunk = table.iloc[i:i + CHUNK_SIZE]
                
                # Convertir chunk a CSV en memoria
                buf = io.StringIO()
                chunk.to_csv(
                    buf,
                    index=False,
                    header=False,
                    na_rep="\\N",  # PostgreSQL NULL
                )
                buf.seek(0)
                
                # COPY FROM STDIN
                copy_sql = sql.SQL("""
                    COPY ordenes_compra ({cols})
                    FROM STDIN WITH (FORMAT CSV, NULL '\\N')
                """).format(
                    cols=sql.SQL(", ").join(sql.Identifier(c) for c in columns)
                )
                cur.copy_expert(copy_sql, buf)
                
                total_inserted += len(chunk)
                chunk_num = (i // CHUNK_SIZE) + 1
                pct = (total_inserted / len(table)) * 100
                print(f"   [{chunk_num}/{total_chunks}] {total_inserted:,} filas ({pct:.1f}%)")
                
                # Commit cada 5 chunks para no perder progreso
                if chunk_num % 5 == 0:
                    conn.commit()
        
        conn.commit()
        print(f"✅ Carga completa: {total_inserted:,} filas")
        
        # 4. VACUUM ANALYZE (actualiza estadísticas para query planner)
        print(f"🔧 VACUUM ANALYZE...")
        with conn.cursor() as cur:
            cur.execute("VACUUM ANALYZE ordenes_compra")
        conn.commit()
        
        # 5. Verificar
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM ordenes_compra")
            count = cur.fetchone()[0]
            cur.execute("""
                SELECT pg_size_pretty(pg_total_relation_size('ordenes_compra'))
            """)
            size = cur.fetchone()[0]
        
        print(f"\n📊 Verificación:")
        print(f"   Filas en DB: {count:,}")
        print(f"   Tamaño total: {size}")
        
    finally:
        conn.close()
        print(f"\n🔌 Conexión cerrada")


def main():
    parser = argparse.ArgumentParser(description="Carga datos a Supabase")
    parser.add_argument(
        "--input",
        type=Path,
        default=Config.DATA_DIR / "chilecompra_combined.parquet",
        help="Archivo Parquet combinado",
    )
    
    args = parser.parse_args()
    
    if not args.input.exists():
        print(f"❌ No existe: {args.input}", file=sys.stderr)
        print(f"   Corré primero: python src/etl.py", file=sys.stderr)
        sys.exit(1)
    
    if not Config.validate():
        sys.exit(1)
    
    Config.ensure_dirs()
    load_parquet_to_supabase(args.input)


if __name__ == "__main__":
    main()
