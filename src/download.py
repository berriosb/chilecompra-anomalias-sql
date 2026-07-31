"""
download.py — Descarga datos OCDS de ChileCompra desde Open Contracting Partnership

Fuente: https://data.open-contracting.org/es/publication/144
Licencia: CC0 1.0 Universal (dominio público)

Uso:
    python src/download.py --years 2024 2025
    python src/download.py --years 2025 --output-dir ./data/raw

Cada año descarga ~500MB comprimido (después ~2.5GB descomprimido).
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

# URLs reales de descarga (Fastly CDN)
BASE_URL = "https://data.open-contracting.org/es/publication/144/download"
DIRECT_URL = "https://fastly.data.open-contracting.org/downloads/chile_compra_api_releases/3730"

AVAILABLE_YEARS = [2022, 2023, 2024, 2025, 2026]


def download_year(year: int, output_dir: Path) -> Path:
    """
    Descarga un año de datos OCDS en formato CSV bulk.
    
    Args:
        year: Año a descargar (2022-2026)
        output_dir: Directorio donde guardar el .tar.gz
    
    Returns:
        Path al archivo .tar.gz descargado
    """
    if year not in AVAILABLE_YEARS:
        raise ValueError(f"Año {year} no disponible. Opciones: {AVAILABLE_YEARS}")
    
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"chilecompra_{year}.csv.tar.gz"
    
    if output_file.exists() and output_file.stat().st_size > 100_000_000:
        print(f"✅ Ya existe: {output_file} ({output_file.stat().st_size / 1e6:.1f} MB)")
        return output_file
    
    # Primero obtenemos la URL redirigida (Fastly)
    redirect_url = f"{BASE_URL}?name={year}.csv.tar.gz"
    
    print(f"📥 Descargando ChileCompra OCDS {year}...")
    print(f"   URL: {redirect_url}")
    print(f"   Destino: {output_file}")
    
    # Usamos curl con resume automático en caso de corte
    cmd = [
        "curl",
        "-L",                              # Seguir redirects
        "--retry", "5",                    # Reintentar 5 veces
        "--retry-delay", "3",              # 3s entre reintentos
        "--connect-timeout", "30",
        "--max-time", "1800",              # 30 min max
        "-o", str(output_file),
        redirect_url,
    ]
    
    try:
        result = subprocess.run(cmd, check=True)
        print(f"✅ Descarga completa: {output_file.stat().st_size / 1e6:.1f} MB")
        return output_file
    except subprocess.CalledProcessError as e:
        print(f"❌ Error descargando {year}: {e}", file=sys.stderr)
        if output_file.exists():
            output_file.unlink()
        raise


def extract_tar(tar_file: Path, extract_dir: Path) -> Path:
    """
    Descomprime el .tar.gz en el directorio destino.
    
    Args:
        tar_file: Path al .tar.gz
        extract_dir: Directorio destino
    
    Returns:
        Path al directorio con los CSVs extraídos
    """
    extract_dir.mkdir(parents=True, exist_ok=True)
    
    year = tar_file.name.split("_")[1].split(".")[0]
    year_dir = extract_dir / year
    
    if year_dir.exists() and any(year_dir.glob("*.csv")):
        print(f"✅ Ya extraído: {year_dir}")
        return year_dir
    
    print(f"📦 Descomprimiendo {tar_file.name}...")
    cmd = ["tar", "-xzf", str(tar_file), "-C", str(extract_dir)]
    
    try:
        subprocess.run(cmd, check=True)
        print(f"✅ Extraído en: {year_dir}")
        return year_dir
    except subprocess.CalledProcessError as e:
        print(f"❌ Error extrayendo: {e}", file=sys.stderr)
        raise


def main():
    parser = argparse.ArgumentParser(
        description="Descarga datos OCDS de ChileCompra",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--years",
        nargs="+",
        type=int,
        default=[2024, 2025],
        choices=AVAILABLE_YEARS,
        help="Años a descargar (default: 2024 2025)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("./data/raw"),
        help="Directorio donde guardar (default: ./data/raw)",
    )
    parser.add_argument(
        "--extract",
        action="store_true",
        help="Descomprimir después de descargar",
    )
    
    args = parser.parse_args()
    
    print(f"🚀 Descargando {len(args.years)} año(s): {args.years}")
    print(f"   Directorio: {args.output_dir.absolute()}")
    print()
    
    downloaded_files = []
    for year in args.years:
        try:
            tar_file = download_year(year, args.output_dir)
            downloaded_files.append(tar_file)
            
            if args.extract:
                extract_tar(tar_file, args.output_dir)
            print()
        except Exception as e:
            print(f"⚠️  Falló descarga de {year}: {e}", file=sys.stderr)
            continue
    
    print()
    print(f"✨ Descarga completa. {len(downloaded_files)} archivo(s):")
    for f in downloaded_files:
        size_mb = f.stat().st_size / 1e6
        print(f"   - {f} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
