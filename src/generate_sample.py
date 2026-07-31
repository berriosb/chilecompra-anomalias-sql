"""
generate_sample.py — Genera sample_oc.csv (1000 OC) para el repo.

El repo no commitea los 2.5GB de datos crudos, pero sí expone una muestra
de 1000 OC para que el recruiter pueda ver el formato sin descargar nada.
"""

import argparse
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))
from config import Config


def main():
    parser = argparse.ArgumentParser(description="Genera sample CSV")
    parser.add_argument(
        "--input",
        type=Path,
        default=Config.DATA_DIR / "chilecompra_combined.parquet",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Config.SAMPLE_DIR / "sample_oc.csv",
    )
    parser.add_argument("--n", type=int, default=1000, help="Cantidad de filas")
    parser.add_argument("--seed", type=int, default=42)
    
    args = parser.parse_args()
    
    if not args.input.exists():
        print(f"❌ No existe: {args.input}", file=sys.stderr)
        sys.exit(1)
    
    print(f"📂 Leyendo {args.input}...")
    df = pd.read_parquet(args.input)
    
    # Tomar muestra estratificada por año para mantener proporciones
    print(f"🎲 Tomando muestra de {args.n} filas (estratificada por año)...")
    sample = df.groupby("year", group_keys=False).apply(
        lambda x: x.sample(min(len(x), args.n // df["year"].nunique()), random_state=args.seed)
    ).head(args.n)
    
    # Limpiar NaN
    sample = sample.where(pd.notnull(sample), None)
    
    # Guardar
    args.output.parent.mkdir(parents=True, exist_ok=True)
    sample.to_csv(args.output, index=False)
    
    print(f"✅ Sample guardado: {args.output}")
    print(f"   {len(sample)} filas, {args.output.stat().st_size / 1024:.1f} KB")
    print()
    print("Primeras 3 filas:")
    print(sample.head(3).to_string(max_colwidth=40))


if __name__ == "__main__":
    main()
