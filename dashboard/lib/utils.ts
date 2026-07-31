import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind class merger (estilo shadcn).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formato de número con separador de miles en estilo chileno.
 * 1234567 -> "1.234.567"
 */
export function formatCLP(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Formato compacto: 1234567890 -> "1.234M" / "1.5B"
 */
export function formatCompact(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";

  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(1)}B`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}M`; // miles de millones (CLP)
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

/**
 * Etiqueta para el nivel de concentración HHI.
 */
export function hhiLevel(hhi: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (hhi < 1500) {
    return {
      label: "Diversificado",
      color: "text-hhi-low",
      bg: "bg-hhi-low/10",
    };
  }
  if (hhi < 2500) {
    return {
      label: "Moderado",
      color: "text-hhi-mid",
      bg: "bg-hhi-mid/10",
    };
  }
  return {
    label: "Alta concentración",
    color: "text-hhi-high",
    bg: "bg-hhi-high/10",
  };
}

/**
 * Truncar string con ellipsis.
 */
export function truncate(s: string | null | undefined, n = 50): string {
  if (!s) return "—";
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}
