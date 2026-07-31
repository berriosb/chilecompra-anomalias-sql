/**
 * Datos: Gasto por región del proveedor ChileCompra 2024
 * Generado por: src/run_eda.py → reports/04_gasto_por_region.csv
 */

export interface RegionRow {
  supplier_region: string;
  num_oc: number;
  monto_mil_millones: number;
  num_proveedores: number;
  num_compradores: number;
}

export const GASTO_POR_REGION: RegionRow[] = [
  { supplier_region: "Región Metropolitana de Santiago", num_oc: 560715, monto_mil_millones: 2129.45, num_proveedores: 11861, num_compradores: 5054 },
  { supplier_region: "Región de Valparaíso", num_oc: 52805, monto_mil_millones: 186.84, num_proveedores: 3271, num_compradores: 3252 },
  { supplier_region: "Región del Biobío", num_oc: 56188, monto_mil_millones: 161.65, num_proveedores: 2908, num_compradores: 3323 },
  { supplier_region: "Región de la Araucanía", num_oc: 35228, monto_mil_millones: 139.41, num_proveedores: 2249, num_compradores: 2465 },
  { supplier_region: "Región del Maule", num_oc: 31410, monto_mil_millones: 97.48, num_proveedores: 2492, num_compradores: 2273 },
  { supplier_region: "Región de los Lagos", num_oc: 28275, monto_mil_millones: 78.49, num_proveedores: 2189, num_compradores: 2076 },
  { supplier_region: "Región del Libertador General Bernardo O'Higgins", num_oc: 24604, monto_mil_millones: 65.28, num_proveedores: 1906, num_compradores: 2078 },
  { supplier_region: "Región de Coquimbo", num_oc: 18772, monto_mil_millones: 61.04, num_proveedores: 1530, num_compradores: 1897 },
  { supplier_region: "Región del Ñuble", num_oc: 19293, monto_mil_millones: 58.76, num_proveedores: 1358, num_compradores: 1940 },
  { supplier_region: "Región de Antofagasta", num_oc: 13241, monto_mil_millones: 45.22, num_proveedores: 650, num_compradores: 2235 },
  { supplier_region: "Región de Atacama", num_oc: 14731, monto_mil_millones: 37.77, num_proveedores: 612, num_compradores: 1583 },
  { supplier_region: "Región de Los Ríos", num_oc: 13014, monto_mil_millones: 35.26, num_proveedores: 964, num_compradores: 1493 },
  { supplier_region: "Región de Tarapacá", num_oc: 10138, monto_mil_millones: 30.63, num_proveedores: 710, num_compradores: 855 },
  { supplier_region: "Región de Arica y Parinacota", num_oc: 8243, monto_mil_millones: 26.15, num_proveedores: 533, num_compradores: 635 },
  { supplier_region: "Región de Magallanes y de la Antártica", num_oc: 10842, monto_mil_millones: 22.65, num_proveedores: 833, num_compradores: 447 },
  { supplier_region: "Región Aysén del General Carlos Ibáñez del Campo", num_oc: 11789, monto_mil_millones: 21.59, num_proveedores: 1251, num_compradores: 645 },
  { supplier_region: "Extranjero", num_oc: 35, monto_mil_millones: 0.13, num_proveedores: 5, num_compradores: 6 },
];