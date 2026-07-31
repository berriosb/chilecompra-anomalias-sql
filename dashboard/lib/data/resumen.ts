/**
 * Resumen general del dataset ChileCompra 2024 (post-limpieza)
 * 918,052 OC | 5,321 organismos | 35,492 proveedores | $3.24 billones CLP
 */

export interface ResumenValues {
  total_oc: number;
  organismos: number;
  proveedores: number;
  monto_billones_clp: number;
  promedio_millones: number;
  min_millones: number;
  max_mil_millones: number;
}

export const RESUMEN_GENERAL: ResumenValues = {
  total_oc: 918052,
  organismos: 5321,
  proveedores: 35492,
  monto_billones_clp: 3.242,
  promedio_millones: 3.53,
  min_millones: 0.0,
  max_mil_millones: 9.99,
};

export const RESUMEN_TRANSFORMED = {
  total_oc: RESUMEN_GENERAL.total_oc,
  organismos: RESUMEN_GENERAL.organismos,
  proveedores: RESUMEN_GENERAL.proveedores,
  // Convertir a CLP para las queries API (compatibilidad con queries.ts)
  monto_total: Math.round(RESUMEN_GENERAL.monto_billones_clp * 1e12),
  monto_promedio: Math.round(RESUMEN_GENERAL.promedio_millones * 1e6),
  oc_con_proveedor: Math.round(RESUMEN_GENERAL.total_oc * 0.92),
  oc_con_comprador: Math.round(RESUMEN_GENERAL.total_oc * 0.75),
};