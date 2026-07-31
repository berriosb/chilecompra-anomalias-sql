/**
 * Datos: Top 15 organismos compradores ChileCompra 2024
 * Generado por: src/run_eda.py → reports/02_top_compradores.csv
 * Fuente: data/chilecompra_combined.parquet (918K OC limpias)
 *
 * Pre-calculado en build-time para no depender de runtime DB.
 */

export interface TopCompradorRow {
  buyer_name: string;
  num_oc: number;
  monto_mil_millones: number;
  promedio_millones: number;
  num_proveedores: number;
}

export const TOP_COMPRADORES: TopCompradorRow[] = [
  { buyer_name: "CENTRAL DE ABASTECIMIENTO DEL SISTEMA NACIONAL DE SERVICIO DE SALUD", num_oc: 269, monto_mil_millones: 234.79, promedio_millones: 872.82, num_proveedores: 81 },
  { buyer_name: "SERVICIO NACIONAL DE PREVENCIÓN Y RESPUESTA ANTE DESASTRES", num_oc: 2612, monto_mil_millones: 69.86, promedio_millones: 26.75, num_proveedores: 63 },
  { buyer_name: "FONDO NACIONAL DE SALUD", num_oc: 227, monto_mil_millones: 47.69, promedio_millones: 210.08, num_proveedores: 116 },
  { buyer_name: "I MUNICIPALIDAD DE MAIPU", num_oc: 115, monto_mil_millones: 32.29, promedio_millones: 280.74, num_proveedores: 101 },
  { buyer_name: "HOSPITAL PUERTO MONTT SERVICIO DE SALUD DEL RELONCAVI", num_oc: 8845, monto_mil_millones: 31.52, promedio_millones: 3.56, num_proveedores: 734 },
  { buyer_name: "HOSPITAL DR GUSTAVO FRICKE DE VIÑA DEL MAR", num_oc: 6283, monto_mil_millones: 30.32, promedio_millones: 4.83, num_proveedores: 639 },
  { buyer_name: "SERVICIO DE SALUD ARAUCANIA SUR", num_oc: 603, monto_mil_millones: 28.94, promedio_millones: 47.99, num_proveedores: 330 },
  { buyer_name: "POLICIA DE INVESTIGACIONES DE CHILE", num_oc: 259, monto_mil_millones: 21.93, promedio_millones: 84.66, num_proveedores: 150 },
  { buyer_name: "Municipalidad de Huechuraba", num_oc: 765, monto_mil_millones: 21.69, promedio_millones: 28.36, num_proveedores: 485 },
  { buyer_name: "COMPLEJO ASISTENCIAL DR. SOTERO DEL RIO", num_oc: 5969, monto_mil_millones: 20.87, promedio_millones: 3.5, num_proveedores: 797 },
  { buyer_name: "I MUNICIPALIDAD DE TEMUCO", num_oc: 1706, monto_mil_millones: 20.81, promedio_millones: 12.2, num_proveedores: 572 },
  { buyer_name: "PARQUE METROPOLITANO DE SANTIAGO", num_oc: 33, monto_mil_millones: 19.28, promedio_millones: 584.21, num_proveedores: 26 },
  { buyer_name: "SERVICIO DE SALUD SUR UNIDAD HOSPITALARIA", num_oc: 447, monto_mil_millones: 18.17, promedio_millones: 40.65, num_proveedores: 279 },
  { buyer_name: "SERVICIO DE SALUD COQUIMBO HOSPITAL LA SERENA", num_oc: 4585, monto_mil_millones: 17.68, promedio_millones: 3.86, num_proveedores: 693 },
  { buyer_name: "HOSPITAL PADRE ALBERTO HURTADO", num_oc: 3771, monto_mil_millones: 17.54, promedio_millones: 4.65, num_proveedores: 535 },
];