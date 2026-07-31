/**
 * Datos: Top 30 organismos por concentración HHI ChileCompra 2024
 * Generado por: src/run_eda.py → reports/05_hhi_top30.csv
 *
 * HHI (Herfindahl-Hirschman Index): mide concentración de mercado.
 *   HHI < 1500: diversificado
 *   1500 ≤ HHI < 2500: moderado
 *   HHI ≥ 2500: alta concentración (riesgo de colusión)
 */

export interface HHIRow {
  buyer_name: string;
  monto_mil_millones: number;
  num_proveedores: number;
  hhi: number;
  nivel: "Alta concentración" | "Moderado" | "Diversificado";
}

export const HHI_TOP30: HHIRow[] = [
  { buyer_name: "MINISTERIO DE OBRAS PUBLICAS DIRECCION GRAL DE OO PP DCYF", monto_mil_millones: 10.9, num_proveedores: 14, hhi: 7237.1, nivel: "Alta concentración" },
  { buyer_name: "SERVICIO DE SALUD SUR UNIDAD HOSPITALARIA", monto_mil_millones: 18.17, num_proveedores: 280, hhi: 6303.9, nivel: "Alta concentración" },
  { buyer_name: "PARQUE METROPOLITANO DE SANTIAGO", monto_mil_millones: 19.28, num_proveedores: 164, hhi: 2724.5, nivel: "Alta concentración" },
  { buyer_name: "Municipalidad de Huechuraba", monto_mil_millones: 21.34, num_proveedores: 447, hhi: 2692.5, nivel: "Alta concentración" },
  { buyer_name: "POLICIA DE INVESTIGACIONES DE CHILE", monto_mil_millones: 21.93, num_proveedores: 153, hhi: 2642.3, nivel: "Alta concentración" },
  { buyer_name: "I MUNICIPALIDAD DE TEMUCO", monto_mil_millones: 20.81, num_proveedores: 572, hhi: 2378.6, nivel: "Moderado" },
  { buyer_name: "I MUNICIPALIDAD DE LO ESPEJO", monto_mil_millones: 13.71, num_proveedores: 53, hhi: 2291.3, nivel: "Moderado" },
  { buyer_name: "SERVICIO DE SALUD ARAUCANIA SUR", monto_mil_millones: 28.94, num_proveedores: 363, hhi: 1799.9, nivel: "Moderado" },
  { buyer_name: "SERVICIO DE SALUD ORIENTE HOSPITAL DEL SALVADOR", monto_mil_millones: 10.82, num_proveedores: 350, hhi: 1732.9, nivel: "Moderado" },
  { buyer_name: "I MUNICIPALIDAD DE PUENTE ALTO", monto_mil_millones: 14.32, num_proveedores: 18, hhi: 1731.3, nivel: "Moderado" },
  { buyer_name: "I MUNICIPALIDAD DE MAIPU", monto_mil_millones: 32.29, num_proveedores: 101, hhi: 730.2, nivel: "Diversificado" },
  { buyer_name: "HOSPITAL PADRE ALBERTO HURTADO", monto_mil_millones: 17.54, num_proveedores: 541, hhi: 711.2, nivel: "Diversificado" },
  { buyer_name: "SERVICIO NACIONAL DE PREVENCIÓN Y RESPUESTA ANTE DESASTRES", monto_mil_millones: 69.86, num_proveedores: 63, hhi: 661.9, nivel: "Diversificado" },
  { buyer_name: "SERVICIO DE SALUD DE TALCAHUANO HOSPITAL", monto_mil_millones: 11.5, num_proveedores: 356, hhi: 628.0, nivel: "Diversificado" },
  { buyer_name: "FONDO NACIONAL DE SALUD", monto_mil_millones: 47.69, num_proveedores: 119, hhi: 600.5, nivel: "Diversificado" },
  { buyer_name: "DIRECCION GENERAL DE GENDARMERIA DE CHILE", monto_mil_millones: 10.7, num_proveedores: 393, hhi: 543.8, nivel: "Diversificado" },
  { buyer_name: "CENTRAL DE ABASTECIMIENTO DEL SISTEMA NACIONAL DE SERVICIO DE SALUD", monto_mil_millones: 234.79, num_proveedores: 81, hhi: 512.0, nivel: "Diversificado" },
  { buyer_name: "COMPLEJO ASISTENCIAL DR. SOTERO DEL RIO", monto_mil_millones: 20.87, num_proveedores: 797, hhi: 423.0, nivel: "Diversificado" },
  { buyer_name: "SERVICIO DE SALUD VALDIVIA HOSPITAL BASE", monto_mil_millones: 12.73, num_proveedores: 529, hhi: 347.7, nivel: "Diversificado" },
  { buyer_name: "SERVICIO DE SALUD OCCIDENTE HOSPITAL SAN JUAN DE DIOS", monto_mil_millones: 17.48, num_proveedores: 804, hhi: 275.9, nivel: "Diversificado" },
  { buyer_name: "SERVICIO DE SALUD METROPOLITANO SUR", monto_mil_millones: 11.96, num_proveedores: 667, hhi: 256.6, nivel: "Diversificado" },
  { buyer_name: "SERVICIO DE SALUD VIÑA DEL MAR QUILLOTA", monto_mil_millones: 10.75, num_proveedores: 578, hhi: 250.9, nivel: "Diversificado" },
  { buyer_name: "SERVICIO NACIONAL DE SALUD HOSPITAL CARLOS VAN BUREN", monto_mil_millones: 13.87, num_proveedores: 555, hhi: 247.6, nivel: "Diversificado" },
  { buyer_name: "SERVICIO DE SALUD METROPOLITANA NORTE HOSPITAL SAN JOSE", monto_mil_millones: 14.24, num_proveedores: 723, hhi: 227.6, nivel: "Diversificado" },
  { buyer_name: "HOSPITAL DOCTOR HERNAN HENRIQUEZ ARAVENA", monto_mil_millones: 16.14, num_proveedores: 559, hhi: 196.6, nivel: "Diversificado" },
  { buyer_name: "COMPLEJO ASISTENCIAL DR.VICTOR RIOS RUIZ", monto_mil_millones: 15.46, num_proveedores: 662, hhi: 185.3, nivel: "Diversificado" },
  { buyer_name: "HOSPITAL PUERTO MONTT", monto_mil_millones: 31.52, num_proveedores: 734, hhi: 170.5, nivel: "Diversificado" },
  { buyer_name: "SERVICIO DE SALUD COQUIMBO HOSPITAL LA SERENA", monto_mil_millones: 17.68, num_proveedores: 698, hhi: 170.3, nivel: "Diversificado" },
  { buyer_name: "HOSPITAL DR GUSTAVO FRICKE DE VIÑA DEL MAR", monto_mil_millones: 30.32, num_proveedores: 640, hhi: 158.2, nivel: "Diversificado" },
  { buyer_name: "HOSPITAL DOCTOR ERNESTO TORRES GALDAMES", monto_mil_millones: 13.68, num_proveedores: 581, hhi: 156.4, nivel: "Diversificado" },
];