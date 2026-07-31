/**
 * Queries para el dashboard.
 *
 * Estrategia de dos modos:
 *   1. Si Supabase está configurado → RPC functions en Postgres
 *   2. Si no → fallback a CSVs en reports/ (modo demo offline)
 *
 * Esto permite que el dashboard funcione SIN Supabase configurado
 * (ideal para deploy de prueba, Vercel preview sin env vars, etc.)
 *
 * Cada función devuelve la misma forma (TypeScript types)
 * sin importar el origen de los datos.
 */

import {
  getResumenGeneralFallback,
  getTopCompradoresFallback,
  getTopProveedoresFallback,
  getGastoPorRegionFallback,
  getHHITop30Fallback,
  hasSupabaseConfig,
} from "./fallback";
import { createClient } from "./supabase/server";

export { hasSupabaseConfig };

export interface ResumenGeneral {
  total_oc: number;
  organismos: number;
  proveedores: number;
  monto_total: number;
  monto_promedio: number;
  oc_con_proveedor: number;
  oc_con_comprador: number;
}

export interface TopComprador {
  buyer_id: string;
  buyer_name: string;
  num_oc: number;
  monto_total: number;
  monto_promedio: number;
  num_proveedores: number;
}

export interface TopProveedor {
  supplier_rut: string;
  supplier_name: string;
  supplier_legal_name: string;
  supplier_region: string;
  num_oc: number;
  monto_total: number;
  num_compradores: number;
}

export interface GastoRegion {
  supplier_region: string;
  num_oc: number;
  monto_total: number;
  num_proveedores: number;
  num_compradores: number;
}

export interface HHIOrganismo {
  buyer_name: string;
  monto_total: number;
  num_proveedores: number;
  hhi: number;
  nivel: string;
}

export async function getResumenGeneral(): Promise<ResumenGeneral> {
  if (!hasSupabaseConfig()) return getResumenGeneralFallback();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("resumen_general");
    if (error) throw error;
    // Blindaje: si Supabase retorna null o vacío, usar fallback embebido
    if (!data || (typeof data === "object" && data.total_oc == null)) {
      console.warn("resumen_general RPC returned null/empty, using fallback");
      return getResumenGeneralFallback();
    }
    return data as ResumenGeneral;
  } catch (e) {
    console.error("Supabase failed, using fallback:", e);
    return getResumenGeneralFallback();
  }
}

export async function getTopCompradores(limit = 15): Promise<TopComprador[]> {
  if (!hasSupabaseConfig()) return getTopCompradoresFallback().slice(0, limit);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("top_compradores", { p_limit: limit });
    if (error) throw error;
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn("top_compradores RPC returned null/empty, using fallback");
      return getTopCompradoresFallback().slice(0, limit);
    }
    return data as TopComprador[];
  } catch (e) {
    console.error("Supabase failed, using fallback:", e);
    return getTopCompradoresFallback().slice(0, limit);
  }
}

export async function getTopProveedores(limit = 15): Promise<TopProveedor[]> {
  if (!hasSupabaseConfig()) return getTopProveedoresFallback().slice(0, limit);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("top_proveedores", { p_limit: limit });
    if (error) throw error;
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn("top_proveedores RPC returned null/empty, using fallback");
      return getTopProveedoresFallback().slice(0, limit);
    }
    return data as TopProveedor[];
  } catch (e) {
    console.error("Supabase failed, using fallback:", e);
    return getTopProveedoresFallback().slice(0, limit);
  }
}

export async function getGastoPorRegion(): Promise<GastoRegion[]> {
  if (!hasSupabaseConfig()) return getGastoPorRegionFallback();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("gasto_por_region");
    if (error) throw error;
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn("gasto_por_region RPC returned null/empty, using fallback");
      return getGastoPorRegionFallback();
    }
    return data as GastoRegion[];
  } catch (e) {
    console.error("Supabase failed, using fallback:", e);
    return getGastoPorRegionFallback();
  }
}

export async function getHHITop30(): Promise<HHIOrganismo[]> {
  if (!hasSupabaseConfig()) return getHHITop30Fallback();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("hhi_top30");
    if (error) throw error;
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn("hhi_top30 RPC returned null/empty, using fallback");
      return getHHITop30Fallback();
    }
    return data as HHIOrganismo[];
  } catch (e) {
    console.error("Supabase failed, using fallback:", e);
    return getHHITop30Fallback();
  }
}