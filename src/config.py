"""
config.py — Configuración centralizada (lee .env)

Variables esperadas:
    SUPABASE_URL       — URL del proyecto Supabase
    SUPABASE_KEY       — Anon key o service_role key
    SUPABASE_DB_URL    — Connection string PostgreSQL directa (psycopg2)
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar .env desde la raíz del proyecto
PROJECT_ROOT = Path(__file__).parent.parent
ENV_FILE = PROJECT_ROOT / ".env"
load_dotenv(ENV_FILE)


class Config:
    """Configuración del proyecto."""
    
    # Paths
    PROJECT_ROOT = PROJECT_ROOT
    DATA_DIR = PROJECT_ROOT / "data"
    RAW_DIR = DATA_DIR / "raw"
    SAMPLE_DIR = DATA_DIR
    SQL_DIR = PROJECT_ROOT / "sql"
    REPORTS_DIR = PROJECT_ROOT / "reports"
    IMAGES_DIR = REPORTS_DIR / "images"
    
    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
    
    # Years to process
    YEARS = [2024, 2025]
    
    # OCDS table mapping
    # Cada tabla OCDS tiene la OC en awards.csv, datos del comprador en parties,
    # datos del proveedor en awards_suppliers.csv
    
    @classmethod
    def validate(cls):
        """Valida que las variables críticas estén definidas."""
        missing = []
        if not cls.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not cls.SUPABASE_DB_URL:
            missing.append("SUPABASE_DB_URL")
        
        if missing:
            print(f"⚠️  Variables de entorno faltantes: {missing}")
            print(f"   Copiá .env.example a .env y completá los valores.")
            return False
        return True
    
    @classmethod
    def ensure_dirs(cls):
        """Crea directorios necesarios si no existen."""
        for d in [cls.DATA_DIR, cls.RAW_DIR, cls.SAMPLE_DIR,
                  cls.SQL_DIR, cls.REPORTS_DIR, cls.IMAGES_DIR]:
            d.mkdir(parents=True, exist_ok=True)


# .env.example template
ENV_EXAMPLE = """# Supabase Configuration
# Obtén estas credenciales en https://supabase.com/dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-or-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres

# Years to process (space-separated)
YEARS=2024 2025
"""


def write_env_example():
    """Escribe .env.example si no existe."""
    example_path = PROJECT_ROOT / ".env.example"
    if not example_path.exists():
        example_path.write_text(ENV_EXAMPLE)
        print(f"✅ Creado: {example_path}")
    return example_path


if __name__ == "__main__":
    print(f"📁 PROJECT_ROOT: {Config.PROJECT_ROOT}")
    print(f"📁 DATA_DIR: {Config.DATA_DIR}")
    print(f"🔗 SUPABASE_URL: {Config.SUPABASE_URL or '(no configurado)'}")
    print()
    write_env_example()
    Config.ensure_dirs()
    print("✅ Directorios verificados")
