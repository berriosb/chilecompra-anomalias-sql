"""
etl.py — Une los CSVs de OCDS en una tabla plana optimizada para análisis.

OPTIMIZACIÓN DE MEMORIA:
    - Procesa año por año (no concat en memoria)
    - Lee parties SOLO con columnas esenciales + filtra suppliers en chunks
    - Hace merge por chunks de awards (no todo de una)
    - Libera memoria agresivamente entre pasos

Estructura OCDS original:
    main.csv                  → procesos de compra (1 fila = 1 proceso)
    awards.csv                → adjudicaciones/OC (1 fila = 1 OC, hay varias por proceso)
    awards_suppliers.csv      → relación OC-proveedor
    parties.csv               → compradores y proveedores (con RUT, región)
    contracts.csv             → contratos firmados (opcional para análisis avanzado)
"""

import argparse
import gc
import sys
from pathlib import Path

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

sys.path.insert(0, str(Path(__file__).parent))
from config import Config


# Columnas mínimas para cada CSV
COLUMNS_AWARDS = [
    "id", "date", "title", "status", "value_amount",
    "value_currency", "main_ocid",
]

COLUMNS_MAIN = [
    "ocid", "buyer_id", "buyer_name",
    "tender_procurementMethod", "tender_classification_id",
    "tender_classification_description", "tender_title",
]

COLUMNS_AWARDS_SUPPLIERS = ["id", "name", "awards_id"]

# SOLO las columnas que necesitamos de parties
COLUMNS_PARTIES = [
    "id", "identifier_id", "identifier_legalName",
    "address_region", "details_scale", "roles",
]


def process_year(year: int, raw_dir: Path, chunk_size: int = 200_000) -> pd.DataFrame:
    """
    Carga y une los CSVs de un año, devolviendo tabla plana por OC.
    Optimizado para baja memoria.
    """
    year_dir = raw_dir / str(year)
    print(f"\n{'='*60}")
    print(f"   Procesando {year}")
    print(f"{'='*60}")

    # 1. Cargar awards (núcleo) — completo, no por chunks
    print(f"   [1/4] awards.csv...")
    df_awards = pd.read_csv(
        year_dir / "awards.csv",
        usecols=COLUMNS_AWARDS,
        dtype={
            "id": "string",
            "date": "string",
            "status": "string",
            "value_amount": "float64",
            "value_currency": "string",
            "main_ocid": "string",
        },
    )
    df_awards = df_awards.rename(columns={"id": "oc_id"})
    # Filtrar OC con monto inválido AHORA (reduce memoria)
    df_awards = df_awards[df_awards["value_amount"].notna() & (df_awards["value_amount"] > 0)]
    print(f"         {len(df_awards):,} OC válidas")

    # 2. Cargar main (procesos)
    print(f"   [2/4] main.csv...")
    df_main = pd.read_csv(
        year_dir / "main.csv",
        usecols=COLUMNS_MAIN,
        dtype={
            "ocid": "string",
            "buyer_id": "string",
            "buyer_name": "string",
            "tender_procurementMethod": "string",
            "tender_classification_id": "string",
            "tender_classification_description": "string",
        },
    )
    print(f"         {len(df_main):,} procesos")

    # 3. Merge awards + main
    print(f"   [3/4] Merge awards + main...")
    df = df_awards.merge(df_main, left_on="main_ocid", right_on="ocid", how="left")
    del df_awards, df_main
    gc.collect()
    print(f"         {len(df):,} filas después del merge")

    # 4. Cargar awards_suppliers (chico)
    print(f"   [4/4] awards_suppliers.csv + parties.csv (por chunks)...")
    df_suppliers_rel = pd.read_csv(
        year_dir / "awards_suppliers.csv",
        usecols=COLUMNS_AWARDS_SUPPLIERS,
        dtype={"id": "string", "name": "string", "awards_id": "string"},
    )

    # Merge con suppliers_rel
    df = df.merge(
        df_suppliers_rel[["id", "name", "awards_id"]],
        left_on="oc_id",
        right_on="awards_id",
        how="left",
    )
    df = df.rename(columns={"id": "supplier_id", "name": "supplier_name"})
    df = df.drop(columns=["awards_id"])
    del df_suppliers_rel
    gc.collect()
    print(f"         + suppliers_rel: {df['supplier_id'].notna().sum():,} matches")

    # 5. Procesar parties POR CHUNKS para filtrar suppliers primero
    parties_file = year_dir / "parties.csv"
    supplier_data_chunks = []

    # Primero: leer solo columnas necesarias y filtrar suppliers
    # Usamos chunked reading para no cargar 964MB de golpe
    parties_reader = pd.read_csv(
        parties_file,
        usecols=COLUMNS_PARTIES,
        dtype={
            "id": "string",
            "identifier_id": "string",
            "address_region": "string",
            "details_scale": "string",
            "roles": "string",
        },
        chunksize=chunk_size,
    )

    print(f"         Procesando parties.csv en chunks...")
    for i, chunk in enumerate(parties_reader):
        # Filtrar solo suppliers (reduce ~50% de filas)
        suppliers = chunk[chunk["roles"].str.contains("supplier", na=False, case=False)]
        if len(suppliers) > 0:
            # Solo columnas que necesitamos (sin 'roles' ya que filtramos)
            supplier_data_chunks.append(
                suppliers[["id", "identifier_id", "identifier_legalName",
                          "address_region", "details_scale"]]
            )
        if (i + 1) % 10 == 0:
            print(f"            chunk {i+1}, acumulado: {sum(len(c) for c in supplier_data_chunks):,} suppliers")
        del chunk
        gc.collect()

    df_parties_suppliers = pd.concat(supplier_data_chunks, ignore_index=True)
    del supplier_data_chunks
    gc.collect()
    print(f"         {len(df_parties_suppliers):,} suppliers únicos en parties")

    # Deduplicar por id (puede haber duplicados)
    df_parties_suppliers = df_parties_suppliers.drop_duplicates(subset=["id"], keep="first")
    print(f"         después de deduplicar: {len(df_parties_suppliers):,}")

    # 6. Merge final con parties
    print(f"   [5/5] Merge final con parties...")
    df = df.merge(
        df_parties_suppliers,
        left_on="supplier_id",
        right_on="id",
        how="left",
    )
    del df_parties_suppliers
    gc.collect()

    # 7. Renombrar columnas finales
    df = df.rename(columns={
        "date": "oc_date",
        "title": "oc_title",
        "status": "oc_status",
        "value_amount": "oc_amount_clp",
        "value_currency": "oc_currency",
        "buyer_id": "buyer_id",
        "buyer_name": "buyer_name",
        "tender_procurementMethod": "procurement_method",
        "tender_classification_id": "category_id",
        "tender_classification_description": "category_description",
        "tender_title": "tender_title",
        "identifier_id": "supplier_rut",
        "identifier_legalName": "supplier_legal_name",
        "address_region": "supplier_region",
        "details_scale": "supplier_scale",
    })

    # 8. Selección final
    final_columns = [
        "oc_id", "oc_date", "oc_status", "oc_amount_clp", "oc_currency",
        "oc_title", "buyer_id", "buyer_name",
        "procurement_method", "category_id", "category_description", "tender_title",
        "supplier_name", "supplier_rut", "supplier_legal_name",
        "supplier_region", "supplier_scale",
    ]
    available = [c for c in final_columns if c in df.columns]
    df_final = df[available].copy()
    del df
    gc.collect()

    # 9. Tipos finales
    if "oc_date" in df_final.columns:
        df_final["oc_date"] = pd.to_datetime(df_final["oc_date"], errors="coerce")
        # Si quedó algún NaT, lo dejamos - el parquet lo maneja como null
    if "oc_amount_clp" in df_final.columns:
        df_final["oc_amount_clp"] = df_final["oc_amount_clp"].astype("int64")

    df_final["year"] = year
    df_final = df_final[["year"] + [c for c in df_final.columns if c != "year"]]

    print(f"\n   ✅ {year} completado: {len(df_final):,} OC, {len(df_final.columns)} columnas")
    return df_final


def main():
    parser = argparse.ArgumentParser(description="ETL: une CSVs OCDS en tabla plana")
    parser.add_argument("--years", nargs="+", type=int, default=Config.YEARS)
    parser.add_argument("--raw-dir", type=Path, default=Config.RAW_DIR)
    parser.add_argument("--output-dir", type=Path, default=Config.DATA_DIR)
    parser.add_argument("--output-format", choices=["parquet", "csv"], default="parquet")
    parser.add_argument("--chunk-size", type=int, default=200_000,
                       help="Tamaño de chunk para parties.csv")

    args = parser.parse_args()
    Config.ensure_dirs()

    print(f"🚀 ETL para años: {args.years}")
    print(f"   Memoria disponible: 16GB total")
    print(f"   Estrategia: año por año + chunked parties processing")

    # Procesar año por año y guardar resultado parcial
    temp_dir = args.output_dir / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)

    annual_files = []
    for year in args.years:
        try:
            df_year = process_year(year, args.raw_dir, args.chunk_size)

            # Guardar resultado del año
            year_file = temp_dir / f"chilecompra_{year}.parquet"
            pq.write_table(pa.Table.from_pandas(df_year), year_file, compression="snappy")
            print(f"   💾 Guardado: {year_file} ({year_file.stat().st_size/1e6:.1f}MB)")
            annual_files.append(year_file)

            del df_year
            gc.collect()
        except Exception as e:
            print(f"❌ Error procesando {year}: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            continue

    if not annual_files:
        print("❌ No se procesó ningún año.", file=sys.stderr)
        sys.exit(1)

    # Combinar archivos anuales
    print(f"\n📊 Combinando {len(annual_files)} archivos anuales...")
    tables = [pq.read_table(f) for f in annual_files]
    combined = pa.concat_tables(tables)
    df_combined = combined.to_pandas()
    del tables, combined
    gc.collect()

    # Guardar final
    if args.output_format == "parquet":
        output_file = args.output_dir / "chilecompra_combined.parquet"
        pq.write_table(pa.Table.from_pandas(df_combined), output_file, compression="snappy")
    else:
        output_file = args.output_dir / "chilecompra_combined.csv"
        df_combined.to_csv(output_file, index=False)

    size_mb = output_file.stat().st_size / 1e6
    print(f"\n✅ Archivo final: {output_file} ({size_mb:.1f} MB)")

    # Limpiar temporales SOLO si combinó exitosamente
    if len(annual_files) > 1:
        for f in annual_files:
            f.unlink()
        temp_dir.rmdir()

    # Resumen final
    print(f"\n{'='*60}")
    print(f"📈 RESUMEN FINAL")
    print(f"{'='*60}")
    print(f"   OC totales: {len(df_combined):,}")
    print(f"   Monto total: {df_combined['oc_amount_clp'].sum() / 1e12:.2f} billones CLP")
    print(f"   OC con proveedor identificado: {df_combined['supplier_rut'].notna().sum():,} ({100*df_combined['supplier_rut'].notna().mean():.1f}%)")
    print(f"   OC con comprador identificado: {df_combined['buyer_name'].notna().sum():,} ({100*df_combined['buyer_name'].notna().mean():.1f}%)")
    print(f"   Rango fechas: {df_combined['oc_date'].min()} → {df_combined['oc_date'].max()}")
    print(f"   Organismos compradores únicos: {df_combined['buyer_name'].nunique():,}")
    print(f"   Proveedores únicos (por RUT): {df_combined['supplier_rut'].nunique():,}")
    print(f"   Categorías UNSPSC únicas: {df_combined['category_id'].nunique():,}")


if __name__ == "__main__":
    main()
