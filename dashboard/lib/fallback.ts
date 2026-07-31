/**
 * Datos de fallback cuando Supabase no está configurado.
 * Lee los CSVs en reports/ y los devuelve con la misma forma
 * que las queries RPC.
 *
 * Esto permite que el dashboard se vea completo en modo demo
 * (cuando todavía no se ha conectado Supabase) o cuando hay
 * un error de conexión.
 */

import { readFileSync } from "fs";
import { join } from "path";
import type {
  ResumenGeneral,
  TopComprador,
  TopProveedor,
  GastoRegion,
  HHIOrganismo,
} from "./queries";

const REPORTS_DIR = join(process.cwd(), "..", "reports");

function readCSV<T>(filename: string): T[] {
  const path = join(REPORTS_DIR, filename);
  const text = readFileSync(path, "utf-8");
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    // CSV parser simple (no maneja quoted commas, pero los CSVs no las tienen)
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj as unknown as T;
  });
}

function parseCSVLine(line: string): string[] {
  // Split simple por coma (los datos no tienen comas en valores)
  return line.split(",").map((v) => v.trim());
}

export function getResumenGeneralFallback(): ResumenGeneral {
  const csv = readCSV<Record<string, string>>("01_resumen_general.csv")[0];
  return {
    total_oc: Number(csv.total_oc),
    organismos: Number(csv.organismos),
    proveedores: Number(csv.proveedores),
    monto_total: Number(csv.monto_billones_clp) * 1e12,
    monto_promedio: Number(csv.promedio_millones) * 1e6,
    oc_con_proveedor: Math.round(Number(csv.total_oc) * 0.92),
    oc_con_comprador: Math.round(Number(csv.total_oc) * 0.75),
  };
}

export function getTopCompradoresFallback(): TopComprador[] {
  const csv = readCSV<Record<string, string>>("02_top_compradores.csv");
  return csv.map((row) => ({
    buyer_id: row.buyer_name, // sin ID en el CSV
    buyer_name: row.buyer_name,
    num_oc: Number(row.num_oc),
    monto_total: Number(row.monto_mil_millones) * 1e9,
    monto_promedio: Number(row.promedio_millones) * 1e6,
    num_proveedores: Number(row.num_proveedores),
  }));
}

export function getTopProveedoresFallback(): TopProveedor[] {
  const csv = readCSV<Record<string, string>>("03_top_proveedores.csv");
  return csv.map((row) => ({
    supplier_rut: row.supplier_rut,
    supplier_name: row.supplier_name,
    supplier_legal_name: row.supplier_legal_name || row.supplier_name,
    supplier_region: row.supplier_region,
    num_oc: Number(row.num_oc),
    monto_total: Number(row.monto_mil_millones) * 1e9,
    num_compradores: Number(row.num_compradores),
  }));
}

export function getGastoPorRegionFallback(): GastoRegion[] {
  const csv = readCSV<Record<string, string>>("04_gasto_por_region.csv");
  return csv.map((row) => ({
    supplier_region: row.supplier_region,
    num_oc: Number(row.num_oc),
    monto_total: Number(row.monto_mil_millones) * 1e9,
    num_proveedores: Number(row.num_proveedores),
    num_compradores: Number(row.num_compradores),
  }));
}

export function getHHITop30Fallback(): HHIOrganismo[] {
  const csv = readCSV<Record<string, string>>("05_hhi_top30.csv");
  return csv.map((row) => ({
    buyer_name: row.buyer_name,
    monto_total: Number(row.monto_mil_millones) * 1e9,
    num_proveedores: Number(row.num_proveedores),
    hhi: Number(row.hhi),
    nivel: row.nivel.replace(/🚨|⚠️|✅/g, "").trim(), // limpiar emojis
  }));
}

/**
 * Verifica si Supabase está configurado.
 */
export function hasSupabaseConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://")
  );
}