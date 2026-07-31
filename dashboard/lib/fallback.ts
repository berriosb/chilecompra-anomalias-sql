/**
 * Datos embebidos (fallback offline).
 *
 * Estos datos son los hallazgos clave del análisis ChileCompra 2024.
 * Se embeben como TypeScript modules en lugar de CSVs para que
 * (a) el dashboard funcione offline / sin filesystem
 * (b) Vercel no necesite archivos runtime en /var/...
 *
 * Los datos originales están en /reports/*.csv en el repo
 * y vienen de src/run_eda.py ejecutando contra data/chilecompra.db.
 */

import {
  RESUMEN_TRANSFORMED,
  type ResumenValues,
} from "./data/resumen";
import {
  TOP_COMPRADORES,
  type TopCompradorRow,
} from "./data/top-compradores";
import {
  TOP_PROVEEDORES,
  type TopProveedorRow,
} from "./data/top-proveedores";
import {
  GASTO_POR_REGION,
  type RegionRow,
} from "./data/regiones";
import {
  HHI_TOP30,
  type HHIRow,
} from "./data/hhi";
import type {
  ResumenGeneral,
  TopComprador,
  TopProveedor,
  GastoRegion,
  HHIOrganismo,
} from "./queries";

// Resumen general
export function getResumenGeneralFallback(): ResumenGeneral {
  return RESUMEN_TRANSFORMED as ResumenGeneral;
}

// Top compradores
export function getTopCompradoresFallback(): TopComprador[] {
  return TOP_COMPRADORES.map((r: TopCompradorRow) => ({
    buyer_id: r.buyer_name, // el CSV no tiene ID, usamos el nombre
    buyer_name: r.buyer_name,
    num_oc: r.num_oc,
    // Convertir miles de millones → CLP raw
    monto_total: Math.round(r.monto_mil_millones * 1e9),
    monto_promedio: Math.round(r.promedio_millones * 1e6),
    num_proveedores: r.num_proveedores,
  }));
}

// Top proveedores
export function getTopProveedoresFallback(): TopProveedor[] {
  return TOP_PROVEEDORES.map((r: TopProveedorRow) => ({
    supplier_rut: r.supplier_rut,
    supplier_name: r.supplier_name,
    supplier_legal_name: r.supplier_legal_name,
    supplier_region: r.supplier_region,
    num_oc: r.num_oc,
    monto_total: Math.round(r.monto_mil_millones * 1e9),
    num_compradores: r.num_compradores,
  }));
}

// Gasto por región
export function getGastoPorRegionFallback(): GastoRegion[] {
  return GASTO_POR_REGION.map((r: RegionRow) => ({
    supplier_region: r.supplier_region.trim(),
    num_oc: r.num_oc,
    monto_total: Math.round(r.monto_mil_millones * 1e9),
    num_proveedores: r.num_proveedores,
    num_compradores: r.num_compradores,
  }));
}

// HHI top 30
export function getHHITop30Fallback(): HHIOrganismo[] {
  return HHI_TOP30.map((r: HHIRow) => ({
    buyer_name: r.buyer_name,
    monto_total: Math.round(r.monto_mil_millones * 1e9),
    num_proveedores: r.num_proveedores,
    hhi: r.hhi,
    nivel: r.nivel,
  }));
}

/**
 * Verifica si Supabase está configurado.
 * Si las env vars están presentes → intenta RPC.
 * Si no → usa datos embebidos.
 */
export function hasSupabaseConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://")
  );
}

// Re-exportar ResumenValues para usos externos
export type { ResumenValues };
