"""
Insertar los 5,000 OC que faltan.
Primero identifico cuáles están en local pero no en Supabase.
"""
import os, sys, json, urllib.request, urllib.error
import pandas as pd

SUPABASE_URL = "https://marmiucihaqvbepeavgd.supabase.co"
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not KEY:
    sys.exit("set SUPABASE_SERVICE_ROLE_KEY")

HEADERS_GET = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Prefer": "count=exact",
}
HEADERS_POST = {
    **HEADERS_GET,
    "Content-Type": "application/json",
    "Prefer": "return=minimal,resolution=ignore-duplicates",
}

print("Cargando local...", flush=True)
df = pd.read_parquet("data/chilecompra_combined.parquet")
local_ids = set(df["oc_id"].astype(str))
print(f"Local: {len(df):,} ({len(local_ids):,} únicos)", flush=True)

# Descargar todos los IDs desde Supabase, paginando
print("Descargando IDs desde Supabase (puede tomar 5 min)...", flush=True)
remote_ids = set()
offset = 0
batch = 5000
while True:
    url = f"{SUPABASE_URL}/rest/v1/ordenes_compra?select=oc_id&offset={offset}&limit={batch}"
    req = urllib.request.Request(url, headers=HEADERS_GET)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            data = json.loads(r.read())
    except Exception as e:
        print(f"  Error en offset {offset}: {e}", flush=True)
        time.sleep(2)
        continue
    if not data:
        break
    remote_ids.update(row["oc_id"] for row in data)
    offset += batch
    if offset % 50000 == 0:
        print(f"  {offset:,} rows escaneadas, {len(remote_ids):,} únicos", flush=True)
    if len(data) < batch:
        break

print(f"Remote: {len(remote_ids):,} únicos", flush=True)

faltan_ids = local_ids - remote_ids
print(f"Faltan: {len(faltan_ids):,}", flush=True)

if not faltan_ids:
    print("Ya están todos!")
    sys.exit(0)

# Insertar los que faltan
df_faltan = df[df["oc_id"].astype(str).isin(faltan_ids)].copy()
print(f"A insertar: {len(df_faltan):,} rows", flush=True)

# Convertir tipos
for col in df_faltan.columns:
    if df_faltan[col].dtype == "datetime64[ns]":
        df_faltan[col] = df_faltan[col].astype(str)
    elif df_faltan[col].dtype in ("float64", "float32"):
        df_faltan[col] = df_faltan[col].astype(object).where(df_faltan[col].notna(), None)

CHUNK = 1000
success = 0
fail = 0
import time
for i in range(0, len(df_faltan), CHUNK):
    sub = df_faltan.iloc[i:i + CHUNK]
    chunk = []
    for _, row in sub.iterrows():
        rec = {}
        for k in df.columns:
            v = row[k]
            if v is None or (isinstance(v, float) and pd.isna(v)):
                rec[k] = None
            elif hasattr(v, "isoformat"):
                rec[k] = v.isoformat()
            else:
                rec[k] = v
        chunk.append(rec)
    data = json.dumps(chunk, default=str).encode("utf-8")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/ordenes_compra",
        data=data,
        headers=HEADERS_POST,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            if r.status < 300:
                success += len(chunk)
            else:
                fail += len(chunk)
                print(f"  HTTP {r.status}: {r.read()[:200]}", file=sys.stderr)
    except Exception as e:
        fail += len(chunk)
        print(f"  ERR: {e}", file=sys.stderr)

    if (i // CHUNK) % 1 == 0:
        print(f"  {success:,}/{len(df_faltan):,} OK | {fail} fail", flush=True)

print(f"\nFinal: {success:,} OK | {fail} fail")
