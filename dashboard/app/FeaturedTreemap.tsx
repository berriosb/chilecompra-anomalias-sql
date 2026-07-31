"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, TrendingUp, Users, Info } from "lucide-react";

export interface CategoriaGasto {
  id: string;
  nombre: string;
  lines: string[];
  porcentaje: number;
  montoEstimado: string;
  color: string;
  descripcion: string;
  ejemplos: string[];
  topOrganismos: string[];
}

export const CATEGORIAS_GASTO: CategoriaGasto[] = [
  {
    id: "salud",
    nombre: "Salud",
    lines: ["Salud"],
    porcentaje: 28,
    montoEstimado: "$4.8 Billones CLP",
    color: "#1f3a52",
    descripcion: "Fármacos, insumos médicos, instrumental quirúrgico y servicios asistenciales hospitalarios.",
    ejemplos: ["CENABAST", "Vacunas e Insumos", "Mantenimiento Equipos Médicos"],
    topOrganismos: ["CENABAST", "Servicios de Salud Regionales", "Hospitales Públicos"],
  },
  {
    id: "infraestructura",
    nombre: "Infraestructura",
    lines: ["Infraestructura"],
    porcentaje: 18,
    montoEstimado: "$3.1 Billones CLP",
    color: "#3a6d7a",
    descripcion: "Obras públicas, pavimentación, construcción de establecimientos y licitaciones mayores de ingeniería.",
    ejemplos: ["Conservación Vial", "Obras Hospitalarias", "Mantención de Recintos"],
    topOrganismos: ["MOP (Vialidad)", "SERVIU Regionales", "Dirección de Arquitectura"],
  },
  {
    id: "tecnologia",
    nombre: "Tecnología",
    lines: ["Tecnología"],
    porcentaje: 12,
    montoEstimado: "$2.0 Billones CLP",
    color: "#5a9485",
    descripcion: "Software, servicios en la nube, licencias informáticas, ciberseguridad y soporte de infraestructura TI.",
    ejemplos: ["Licencias informáticas", "Servicios Cloud", "Soporte TI y desarrollo"],
    topOrganismos: ["Subsecretaría de Hacienda", "Registro Civil", "SII"],
  },
  {
    id: "educacion",
    nombre: "Educación",
    lines: ["Educación"],
    porcentaje: 10,
    montoEstimado: "$1.7 Billones CLP",
    color: "#4a7c8c",
    descripcion: "Mobiliario educacional, textos escolares, plataformas pedagógicas y mantención de colegios públicos.",
    ejemplos: ["Textos y licencias escolares", "Equipamiento Aulas", "Bienes pedagógicos"],
    topOrganismos: ["JUNAEB", "Mineduc", "Servicios Locales de Educación (SLEP)"],
  },
  {
    id: "equipamiento-suministros",
    nombre: "Equipamiento y suministros",
    lines: ["Equipamiento", "y suministros"],
    porcentaje: 8,
    montoEstimado: "$1.4 Billones CLP",
    color: "#d4a437",
    descripcion: "Artículos de oficina, papelería, repuestos operativos y mobiliario administrativo del Estado.",
    ejemplos: ["Papelería e Imprenta", "Mobiliario de oficina", "Insumos operativos"],
    topOrganismos: ["Municipalidades", "Gobiernos Regionales", "Ministerio del Interior"],
  },
  {
    id: "servicios-profesionales",
    nombre: "Servicios profesionales",
    lines: ["Servicios", "profesionales"],
    porcentaje: 6,
    montoEstimado: "$1.0 Billones CLP",
    color: "#1f3a52",
    descripcion: "Asesorías especializadas, estudios de factibilidad, auditorías externas y servicios de consultoría.",
    ejemplos: ["Estudios e Investigaciones", "Auditorías Externas", "Asesoría Legal y Técnica"],
    topOrganismos: ["Ministerio de Desarrollo Social", "CORFO", "Subsecretarías"],
  },
  {
    id: "alimentacion",
    nombre: "Alimentación",
    lines: ["Alimentación"],
    porcentaje: 5,
    montoEstimado: "$850 MIL Millones CLP",
    color: "#c1502e",
    descripcion: "Programa de alimentación escolar, raciones institucionales y concesiones de casino estatal.",
    ejemplos: ["Raciones escolares JUNAEB", "Servicios de Casino", "Viveres para FFAA y Gendarmería"],
    topOrganismos: ["JUNAEB", "Gendarmería de Chile", "Servicios de Salud"],
  },
  {
    id: "transporte",
    nombre: "Transporte",
    lines: ["Transporte"],
    porcentaje: 4,
    montoEstimado: "$680 MIL Millones CLP",
    color: "#4a7c8c",
    descripcion: "Combustibles, adquisición y mantención de flotas vehiculares institucionales y pasajes.",
    ejemplos: ["Combustible para flotas", "Mantención de vehículos", "Pasajes y movilidad"],
    topOrganismos: ["Carabineros de Chile", "Municipalidades", "Ministerio de Transportes"],
  },
  {
    id: "defensa",
    nombre: "Defensa y Seguridad",
    lines: ["Defensa"],
    porcentaje: 4,
    montoEstimado: "$680 MIL Millones CLP",
    color: "#3a6d7a",
    descripcion: "Equipamiento de protección, vestuario institucional, vehículos tácticos y sistemas de telecomunicaciones.",
    ejemplos: ["Uniformidad e Insumos", "Equipamiento táctico", "Sistemas de Comunicación"],
    topOrganismos: ["Carabineros", "PDI", "Fuerzas Armadas"],
  },
  {
    id: "energia",
    nombre: "Energía",
    lines: ["Energía"],
    porcentaje: 3,
    montoEstimado: "$510 MIL Millones CLP",
    color: "#6a7d8a",
    descripcion: "Suministro eléctrico institucional, alumbrado público y proyectos de eficiencia energética.",
    ejemplos: ["Luz y Suministro Eléctrico", "Eficiencia Energética", "Generadores e Insumos"],
    topOrganismos: ["Municipalidades", "Ministerio de Energía", "Hospitales"],
  },
  {
    id: "otros",
    nombre: "Otros Rubros",
    lines: ["Otros"],
    porcentaje: 2,
    montoEstimado: "$340 MIL Millones CLP",
    color: "#5a9485",
    descripcion: "Servicios generales, licitaciones menores y rubros diversos no clasificados previamente.",
    ejemplos: ["Aseo y Mantención general", "Seguridad privada", "Servicios eventuales"],
    topOrganismos: ["Organismos Variados"],
  },
];

/** Treemap layout sencillo: squarified simplificado (slice-and-dice) */
function layoutTreemap(
  items: CategoriaGasto[],
  x: number,
  y: number,
  w: number,
  h: number,
  vertical: boolean
): { x: number; y: number; w: number; h: number; item: CategoriaGasto }[] {
  if (items.length === 0) return [];
  if (items.length === 1) {
    return [{ x, y, w, h, item: items[0] }];
  }

  const total = items.reduce((s, c) => s + c.porcentaje, 0);
  const result: { x: number; y: number; w: number; h: number; item: CategoriaGasto }[] = [];

  let half = 0;
  let splitIdx = 0;
  for (let i = 0; i < items.length; i++) {
    half += items[i].porcentaje;
    if (half >= total / 2) {
      splitIdx = i + 1;
      break;
    }
  }
  if (splitIdx === 0) splitIdx = 1;

  const left = items.slice(0, splitIdx);
  const right = items.slice(splitIdx);
  const leftTotal = left.reduce((s, c) => s + c.porcentaje, 0);
  const ratio = leftTotal / total;

  if (vertical) {
    const splitW = w * ratio;
    result.push(...layoutTreemap(left, x, y, splitW, h, !vertical));
    result.push(...layoutTreemap(right, x + splitW, y, w - splitW, h, !vertical));
  } else {
    const splitH = h * ratio;
    result.push(...layoutTreemap(left, x, y, w, splitH, !vertical));
    result.push(...layoutTreemap(right, x, y + splitH, w, h - splitH, !vertical));
  }

  return result;
}

export function FeaturedTreemap() {
  const [selectedId, setSelectedId] = useState<string | null>("salud");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const rects = layoutTreemap(CATEGORIAS_GASTO, 0, 0, 100, 100, true);
  const gap = 0.5;

  const selectedCategory = CATEGORIAS_GASTO.find((c) => c.id === selectedId) || CATEGORIAS_GASTO[0];
  const hoveredCategory = CATEGORIAS_GASTO.find((c) => c.id === hoveredId);

  return (
    <div className="space-y-6">
      {/* Visualización Treemap SVG */}
      <div className="relative">
        <svg
          viewBox="0 0 100 100"
          className="w-full select-none"
          style={{ aspectRatio: "5/3" }}
          aria-label="Treemap de gasto público por categoría"
        >
          {rects.map((r) => {
            const isSelected = r.item.id === selectedId;
            const isHovered = r.item.id === hoveredId;

            const rx = r.x + gap / 2;
            const ry = r.y + gap / 2;
            const rw = Math.max(r.w - gap, 0.5);
            const rh = Math.max(r.h - gap, 0.5);
            const lines = r.item.lines;
            const fontSize = rw > 15 && rh > 12 ? 2.8 : rw > 8 && rh > 8 ? 2.2 : 0;

            return (
              <g
                key={r.item.id}
                className="cursor-pointer group"
                onClick={() => setSelectedId(r.item.id)}
                onMouseEnter={() => setHoveredId(r.item.id)}
                onMouseLeave={() => setHoveredId(null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedId(r.item.id);
                  }
                }}
              >
                <rect
                  x={rx}
                  y={ry}
                  width={rw}
                  height={rh}
                  rx="1"
                  fill={r.item.color}
                  opacity={isSelected ? 1 : isHovered ? 0.9 : 0.82}
                  stroke={isSelected ? "#ffffff" : isHovered ? "#ffffff" : "transparent"}
                  strokeWidth={isSelected ? 0.8 : isHovered ? 0.4 : 0}
                  className="transition-all duration-150 ease-in-out"
                />

                {/* Badge o Porcentaje en la esquina superior si el espacio lo permite */}
                {rw > 12 && rh > 10 && (
                  <text
                    x={rx + rw - 1.5}
                    y={ry + 2.5}
                    textAnchor="end"
                    fill="white"
                    opacity={0.7}
                    fontSize={1.8}
                    fontWeight="500"
                    style={{ pointerEvents: "none" }}
                  >
                    {r.item.porcentaje}%
                  </text>
                )}

                {/* Texto del nombre de categoría */}
                {fontSize > 0 && (
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2 - (lines.length - 1) * (fontSize * 0.6)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize={fontSize}
                    fontWeight={isSelected || isHovered ? "700" : "600"}
                    style={{ pointerEvents: "none" }}
                  >
                    {lines.map((line, li) => (
                      <tspan
                        key={li}
                        x={rx + rw / 2}
                        dy={li === 0 ? 0 : fontSize * 1.25}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover bar informativo rápido */}
        <div className="mt-2 text-xs text-ink-muted flex items-center justify-between px-1">
          <span>
            {hoveredCategory ? (
              <span className="text-ink font-medium">
                {hoveredCategory.nombre}: <strong>{hoveredCategory.porcentaje}%</strong> (~{hoveredCategory.montoEstimado})
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-accent shrink-0" />
                Haz clic en cualquier categoría para desplegar su detalle e ir a la sección correspondiente.
              </span>
            )}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-ink-muted">
            {selectedCategory ? `Seleccionado: ${selectedCategory.nombre}` : ""}
          </span>
        </div>
      </div>

      {/* Panel Detalle de Categoría Seleccionada */}
      {selectedCategory && (
        <div className="bg-paper border border-grid rounded-xl p-5 md:p-6 transition-all animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-grid pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                <h4 className="font-display text-xl md:text-2xl text-ink font-bold">
                  {selectedCategory.nombre}
                </h4>
                <span className="bg-accent/10 text-accent font-semibold text-xs px-2.5 py-0.5 rounded-full">
                  {selectedCategory.porcentaje}% del gasto total
                </span>
              </div>
              <p className="text-sm text-ink-muted">
                Monto aproximado proyectado 2024:{" "}
                <strong className="text-ink font-medium">{selectedCategory.montoEstimado}</strong>
              </p>
            </div>

            {/* Accesos directos a subpáginas del dashboard */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/compradores`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white rounded-lg text-xs font-medium hover:bg-ink/90 transition-colors shadow-sm"
              >
                <Building2 className="w-3.5 h-3.5" />
                Ver Compradores
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href={`/concentracion`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-grid bg-white text-ink rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                Ver Concentración (HHI)
                <ArrowRight className="w-3 h-3 text-ink-muted" />
              </Link>
              <Link
                href={`/proveedores`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-grid bg-white text-ink rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-accent" />
                Ver Proveedores
                <ArrowRight className="w-3 h-3 text-ink-muted" />
              </Link>
            </div>
          </div>

          {/* Información explicativa de la categoría */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-3.5 rounded-lg border border-grid">
              <span className="font-semibold text-ink uppercase tracking-wider text-[10px] block mb-1 text-ink-muted">
                Descripción del Rubro
              </span>
              <p className="text-ink leading-relaxed">{selectedCategory.descripcion}</p>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-grid">
              <span className="font-semibold text-ink uppercase tracking-wider text-[10px] block mb-1 text-ink-muted">
                Insumos Típicos Licitados
              </span>
              <ul className="list-disc list-inside text-ink space-y-0.5">
                {selectedCategory.ejemplos.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-grid">
              <span className="font-semibold text-ink uppercase tracking-wider text-[10px] block mb-1 text-ink-muted">
                Principales Compradores
              </span>
              <ul className="list-disc list-inside text-ink space-y-0.5">
                {selectedCategory.topOrganismos.map((org, idx) => (
                  <li key={idx}>{org}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
