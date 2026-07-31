/**
 * Datos: Top 15 proveedores (venta al Estado) ChileCompra 2024
 * Generado por: src/run_eda.py → reports/03_top_proveedores.csv
 */

export interface TopProveedorRow {
  supplier_rut: string;
  supplier_name: string;
  supplier_legal_name: string;
  supplier_region: string;
  num_oc: number;
  monto_mil_millones: number;
  num_compradores: number;
}

export const TOP_PROVEEDORES: TopProveedorRow[] = [
  { supplier_rut: "995200007", supplier_name: "COPEC S.A.", supplier_legal_name: "COPEC S.A.", supplier_region: "Región Metropolitana de Santiago", num_oc: 6555, monto_mil_millones: 51.55, num_compradores: 1526 },
  { supplier_rut: "967813508", supplier_name: "EDENRED CHILE S.A.", supplier_legal_name: "EDENRED CHILE SOCIEDAD ANONIMA", supplier_region: "Región Metropolitana de Santiago", num_oc: 4001, monto_mil_millones: 34.4, num_compradores: 864 },
  { supplier_rut: "922510008", supplier_name: "SANOFI-AVENTIS DE CHILE S.A.", supplier_legal_name: "SANOFI-AVENTIS DE CHILE S.A.", supplier_region: "Región Metropolitana de Santiago", num_oc: 238, monto_mil_millones: 23.9, num_compradores: 34 },
  { supplier_rut: "965687408", supplier_name: "GASCO GLP S.A.", supplier_legal_name: "GASCO GLP S A", supplier_region: "Región Metropolitana de Santiago", num_oc: 7849, monto_mil_millones: 23.9, num_compradores: 1599 },
  { supplier_rut: "809894002", supplier_name: "AGENCIA DE VIAJES TURAVION SPA", supplier_legal_name: "AGENCIA DE VIAJES TURAVION SPA", supplier_region: "Región Metropolitana de Santiago", num_oc: 61125, monto_mil_millones: 22.55, num_compradores: 1653 },
  { supplier_rut: "968951106", supplier_name: "DISTRIBUIDORA COMERCIAL PHARMASAN", supplier_legal_name: "DISTRIBUIDORA COMERCIAL PHARMASAN LIMITADA", supplier_region: "Región Metropolitana de Santiago", num_oc: 44, monto_mil_millones: 22.27, num_compradores: 20 },
  { supplier_rut: "83002400K", supplier_name: "NOVARTIS CHILE S.A.", supplier_legal_name: "NOVARTIS CHILE S A", supplier_region: "Región Metropolitana de Santiago", num_oc: 600, monto_mil_millones: 21.82, num_compradores: 52 },
  { supplier_rut: "937450001", supplier_name: "JOHNSON Y JOHNSON DE CHILE S.A.", supplier_legal_name: "JOHNSON Y JOHNSON DE CHILE S A", supplier_region: "Región Metropolitana de Santiago", num_oc: 5044, monto_mil_millones: 21.59, num_compradores: 166 },
  { supplier_rut: "829994003", supplier_name: "ROCHE CHILE LIMITADA", supplier_legal_name: "ROCHE CHILE LIMITADA", supplier_region: "Región Metropolitana de Santiago", num_oc: 499, monto_mil_millones: 20.26, num_compradores: 91 },
  { supplier_rut: "776348740", supplier_name: "SCIENZA CHILE SPA", supplier_legal_name: "SCIENZA CHILE SPA", supplier_region: "Región Metropolitana de Santiago", num_oc: 13, monto_mil_millones: 19.48, num_compradores: 1 },
  { supplier_rut: "88277600K", supplier_name: "DEMARCO S.A.", supplier_legal_name: "DEMARCO S.A.", supplier_region: "Región Metropolitana de Santiago", num_oc: 54, monto_mil_millones: 19.0, num_compradores: 21 },
  { supplier_rut: "762993589", supplier_name: "SERVICIOS INTEGRADOS SIDAPT", supplier_legal_name: "SERVICIOS INTEGRADOS SIDAPT LIMITADA", supplier_region: "Región Metropolitana de Santiago", num_oc: 3829, monto_mil_millones: 17.2, num_compradores: 408 },
  { supplier_rut: "764475305", supplier_name: "AstraZeneca", supplier_legal_name: "ASTRAZENECA S.A.", supplier_region: "Región Metropolitana de Santiago", num_oc: 396, monto_mil_millones: 14.63, num_compradores: 108 },
  { supplier_rut: "969812509", supplier_name: "PFIZER CHILE S.A.", supplier_legal_name: "PFIZER CHILE S.A.", supplier_region: "Región Metropolitana de Santiago", num_oc: 519, monto_mil_millones: 14.55, num_compradores: 42 },
  { supplier_rut: "829994003", supplier_name: "ROCHE CHILE LIMITADA", supplier_legal_name: "ROCHE CHILE LIMITADA", supplier_region: "Región Metropolitana de Santiago", num_oc: 946, monto_mil_millones: 14.41, num_compradores: 80 },
];