import Link from "next/link";
import {
  ArrowUpRight,
  Database,
  TrendingUp,
  Users,
  Building2,
  Github,
} from "lucide-react";
export const dynamic = "force-dynamic";

import { getResumenGeneral, hasSupabaseConfig } from "@/lib/queries";
import { formatCompact, formatCLP } from "@/lib/utils";

/**
 * Landing page del dashboard.
 *
 * Server Component: hace fetch a Supabase en el servidor,
 * nunca expone credenciales al cliente.
 *
 * Si Supabase no está configurado, usa fallback automático
 * a los CSVs en reports/ (modo demo offline).
 */
export default async function HomePage() {
  const hasSupabase = hasSupabaseConfig();

  let resumen = null;
  let error = null;
  try {
    resumen = await getResumenGeneral();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />

      {/* Hero con fondo cyan claro + red de nodos decorativa */}
      <section className="relative overflow-hidden border-b border-grid bg-[#e8f0ee]">
        <NodeNetworkDecor />
        <div className="relative max-w-6xl mx-auto px-6 pt-12 md:pt-16 pb-24 md:pb-32">
          <p className="text-sm uppercase tracking-[0.2em] text-ink-muted mb-6 font-medium">
            ChileCompra · 2024
          </p>
          <h1 className="font-display text-5xl md:text-7xl text-ink leading-[1.05] tracking-tight mb-8 max-w-4xl">
            ¿Quién gasta la plata
            <br />
            pública, en qué, y
            <br />
            con quién?
          </h1>
          <p className="text-lg md:text-xl text-ink-muted max-w-2xl leading-relaxed">
            Análisis de <strong className="text-ink font-semibold">918K órdenes de compra</strong>{" "}
            del Estado chileno.
            <br className="hidden md:block" />
            Datos abiertos OCDS para transparencia y eficiencia.
          </p>
        </div>
      </section>

      {/* KPIs — cards con íconos de color, sobre el borde del hero */}
      {resumen && (
        <section className="max-w-6xl mx-auto px-6 -mt-16 md:-mt-20 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <KPI
              icon={<Database className="w-5 h-5" />}
              label="Total Órdenes"
              value={formatCLP(resumen.total_oc)}
              iconBg="bg-[#4a7c8c]"
            />
            <KPI
              icon={<Building2 className="w-5 h-5" />}
              label="Organismos"
              value={formatCLP(resumen.organismos)}
              iconBg="bg-[#5a9485]"
            />
            <KPI
              icon={<Users className="w-5 h-5" />}
              label="Proveedores"
              value={formatCLP(resumen.proveedores)}
              iconBg="bg-[#d4a437]"
            />
            <KPI
              icon={<TrendingUp className="w-5 h-5" />}
              label="Monto Total"
              value={`CLP $${formatCompact(resumen.monto_total)}`}
              iconBg="bg-[#c1502e]"
            />
          </div>
        </section>
      )}

      {/* Banner demo (cuando funciona con fallback CSVs) */}
      {!hasSupabase && resumen && (
        <section className="max-w-6xl mx-auto px-6 pt-6">
          <div className="border border-grid bg-bg-subtle rounded-lg p-4 text-sm text-ink-muted">
            <strong className="text-ink">Modo demo:</strong>{" "}
            datos servidos desde los CSVs locales. Para conectar Supabase, agregá
            las env vars <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en
            Vercel + corré las migraciones en SQL Editor.
          </div>
        </section>
      )}

      {/* Banner error */}
      {error && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="border border-red-300 bg-red-50 rounded-lg p-6">
            <h3 className="font-display text-xl mb-2 text-red-900">
              Error al consultar Supabase
            </h3>
            <pre className="text-red-800 text-sm whitespace-pre-wrap">{error}</pre>
            <p className="text-red-800 mt-4">
              Verificá que: (1) las env vars estén configuradas, (2) hayas corrido{" "}
              <code className="bg-red-100 px-1 rounded">migrations.sql</code>, (3) la
              tabla <code className="bg-red-100 px-1 rounded">ordenes_compra</code>{" "}
              tenga datos.
            </p>
          </div>
        </section>
      )}

      {/* Explorar el análisis — 4 cards con mini-gráficos */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <h2 className="font-display text-3xl md:text-4xl text-ink mb-10">
          Explorar el análisis
        </h2>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <NavCard
            href="/compradores"
            title="¿Quién compra más?"
            subtitle="Top 15 organismos compradores por monto total."
            visual={<TreemapPreview />}
            visualBg="bg-[#e8f0ee]"
          />
          <NavCard
            href="/proveedores"
            title="¿Quién vende más?"
            subtitle="Top 15 proveedores del Estado por venta total."
            visual={<BarChartPreview />}
          />
          <NavCard
            href="/geografia"
            title="¿Dónde están los proveedores?"
            subtitle="Distribución del gasto por región del proveedor."
            visual={<ChileMapPreview />}
            visualBg="bg-[#e8f0ee]"
          />
          <NavCard
            href="/concentracion"
            title="¿Dónde hay concentración sospechosa?"
            subtitle="HHI por organismo: detecta mercados poco competitivos."
            visual={<ScatterPreview />}
          />
        </div>
      </section>

      {/* Visualización Destacada — Treemap de gasto por categoría */}
      <section className="max-w-6xl mx-auto px-6 pb-16 md:pb-24">
        <h2 className="font-display text-3xl md:text-4xl text-ink mb-10">
          Visualización Destacada
        </h2>
        <div className="border border-grid rounded-xl overflow-hidden bg-white">
          <div className="p-5 md:p-6 border-b border-grid">
            <h3 className="font-display text-lg md:text-xl text-ink">
              Gasto Público por Categoría
            </h3>
            <p className="text-sm text-ink-muted mt-1">
              Distribución del gasto estatal 2024 por rubro — tamaño proporcional al monto total
            </p>
          </div>
          <div className="p-4 md:p-6">
            <FeaturedTreemap />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="relative z-20">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl text-ink hover:opacity-80 transition-opacity"
        >
          ChileCompra<span className="text-accent">.</span>
        </Link>
        <nav className="hidden md:flex gap-8 text-sm text-ink-muted">
          <Link href="/compradores" className="hover:text-ink transition-colors">
            Compradores
          </Link>
          <Link href="/proveedores" className="hover:text-ink transition-colors">
            Proveedores
          </Link>
          <Link href="/geografia" className="hover:text-ink transition-colors">
            Geografía
          </Link>
          <Link href="/concentracion" className="hover:text-ink transition-colors">
            Concentración
          </Link>
        </nav>
      </div>
    </header>
  );
}

function KPI({
  icon,
  label,
  value,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white border border-grid rounded-xl p-4 md:p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`${iconBg} text-white rounded-md w-9 h-9 flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <span className="text-[11px] uppercase tracking-wider text-ink-muted font-medium pt-1.5">
          {label}
        </span>
      </div>
      <div className="font-display text-2xl md:text-3xl text-ink tabular leading-none font-semibold">
        {value}
      </div>
    </div>
  );
}

function NavCard({
  href,
  title,
  subtitle,
  visual,
  visualBg,
}: {
  href: string;
  title: string;
  subtitle: string;
  visual: React.ReactNode;
  visualBg?: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-white border border-grid rounded-xl overflow-hidden hover:border-ink-muted hover:shadow-md transition-all"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px]">
        <div className="p-5 md:p-6 flex flex-col justify-between min-h-[160px]">
          <div>
            <h3 className="font-display text-xl md:text-2xl text-ink mb-2 leading-snug">
              {title}
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed">{subtitle}</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-ink-muted group-hover:text-accent transition-colors">
            <span>Explorar</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div
          className={`${visualBg ?? "bg-bg-subtle"} flex items-center justify-center p-4 sm:border-l border-grid min-h-[140px] sm:min-h-0`}
        >
          {visual}
        </div>
      </div>
    </Link>
  );
}

function Footer() {
  return (
    <footer className="border-t border-grid mt-12 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: Attribution & links */}
          <div className="text-xs text-ink-muted space-y-1.5">
            <p>
              Datos:{" "}
              <a
                className="underline hover:text-ink transition-colors"
                href="https://data.open-contracting.org/es/publication/144"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Contracting Partnership
              </a>
              {" "}· Licencia CC0 1.0 Universal
            </p>
            <p>
              Pipeline de análisis:{" "}
              <a
                className="inline-flex items-center gap-1 underline hover:text-ink transition-colors"
                href="https://github.com/berriosb/chilecompra-anomalias-sql"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-3 h-3" />
                github.com/berriosb/chilecompra-anomalias-sql
              </a>
            </p>
          </div>

          {/* Right: Logos */}
          <div className="flex items-center gap-6">
            <Link href="/" className="font-display text-base text-ink hover:opacity-80 transition-opacity">
              ChileCompra<span className="text-accent">.</span>
            </Link>
            <div className="h-6 w-px bg-grid" />
            <a
              href="https://www.open-contracting.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors"
            >
              <OcpLogo />
              <span className="text-xs font-medium leading-tight">
                Open<br />Contracting<br />Partnership
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Decoraciones y mini-gráficos placeholder (SVG inline)
   ============================================================ */

/** Red de nodos decorativa para el hero */
function NodeNetworkDecor() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1200 500"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5a9485" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#5a9485" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Líneas conectoras */}
      <g stroke="#5a9485" strokeWidth="0.5" opacity="0.4" fill="none">
        <path d="M 800 100 L 950 180 L 1100 120" />
        <path d="M 750 200 L 900 280 L 1050 220" />
        <path d="M 850 320 L 1000 380 L 1150 300" />
        <path d="M 700 80 L 800 100" />
        <path d="M 950 180 L 1050 220" />
        <path d="M 900 280 L 1000 380" />
        <path d="M 1100 120 L 1150 300" />
        <path d="M 800 100 L 900 280" />
        <path d="M 1050 220 L 1150 300" />
      </g>
      {/* Nodos */}
      {[
        [800, 100, 4],
        [950, 180, 5],
        [1100, 120, 4],
        [750, 200, 3],
        [900, 280, 6],
        [1050, 220, 4],
        [850, 320, 3],
        [1000, 380, 5],
        [1150, 300, 4],
        [700, 80, 2],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r! * 6} fill="url(#nodeGlow)" />
          <circle cx={cx} cy={cy} r={r} fill="#5a9485" />
        </g>
      ))}
    </svg>
  );
}

/** Treemap placeholder para ¿Quién compra más? */
function TreemapPreview() {
  const cells = [
    { x: 0, y: 0, w: 50, h: 50, c: "#1f3a52" },
    { x: 50, y: 0, w: 30, h: 50, c: "#3a6d7a" },
    { x: 80, y: 0, w: 20, h: 25, c: "#c1502e" },
    { x: 80, y: 25, w: 20, h: 25, c: "#d4a437" },
    { x: 0, y: 50, w: 35, h: 50, c: "#5a9485" },
    { x: 35, y: 50, w: 30, h: 50, c: "#6a7d8a" },
    { x: 65, y: 50, w: 18, h: 25, c: "#8a6d4a" },
    { x: 65, y: 75, w: 18, h: 25, c: "#9a8d6a" },
    { x: 83, y: 50, w: 17, h: 50, c: "#b5a07a" },
  ];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-32" aria-hidden="true">
      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.x}
          y={cell.y}
          width={cell.w}
          height={cell.h}
          fill={cell.c}
        />
      ))}
    </svg>
  );
}

/** Bar chart placeholder para ¿Quién vende más? */
function BarChartPreview() {
  const bars = [40, 35, 30, 28, 25, 22, 20, 18, 16, 14, 12, 10, 9, 8, 7];
  return (
    <svg viewBox="0 0 100 60" className="w-full h-32" aria-hidden="true">
      {bars.map((h, i) => {
        const x = 4 + i * 6.2;
        const y = 55 - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="4.2"
            height={h}
            fill={i < 3 ? "#1f3a52" : i < 7 ? "#5a9485" : "#a3b3a8"}
          />
        );
      })}
      <line x1="0" y1="55" x2="100" y2="55" stroke="#8a8580" strokeWidth="0.3" />
    </svg>
  );
}

/** Mapa de Chile minimal placeholder */
function ChileMapPreview() {
  return (
    <svg viewBox="0 0 60 100" className="h-32 w-auto" aria-hidden="true">
      <path
        d="M 25 5 Q 30 10 28 20 L 30 35 Q 32 50 28 60 L 25 80 Q 22 90 18 95 L 15 95 Q 12 90 14 80 L 18 60 Q 20 50 18 35 L 20 20 Q 22 10 25 5 Z"
        fill="#5a9485"
        opacity="0.4"
      />
      {/* Círculos de intensidad por región */}
      <circle cx="22" cy="25" r="4" fill="#1f3a52" opacity="0.8" />
      <circle cx="26" cy="40" r="6" fill="#1f3a52" opacity="0.9" />
      <circle cx="24" cy="55" r="3" fill="#5a9485" opacity="0.7" />
      <circle cx="20" cy="70" r="3" fill="#5a9485" opacity="0.6" />
      <circle cx="18" cy="85" r="2" fill="#a3b3a8" opacity="0.6" />
    </svg>
  );
}

/** Scatter plot placeholder para HHI */
function ScatterPreview() {
  // Cluster denso abajo-izq, outliers arriba-derecha (HHI alto)
  const points: [number, number][] = [];
  // Cluster bajo
  for (let i = 0; i < 30; i++) {
    points.push([15 + Math.random() * 25, 70 + Math.random() * 20]);
  }
  // Outliers
  for (let i = 0; i < 5; i++) {
    points.push([55 + Math.random() * 30, 15 + Math.random() * 30]);
  }
  return (
    <svg viewBox="0 0 100 100" className="w-full h-32" aria-hidden="true">
      {/* Ejes */}
      <line x1="5" y1="95" x2="95" y2="95" stroke="#8a8580" strokeWidth="0.3" />
      <line x1="5" y1="5" x2="5" y2="95" stroke="#8a8580" strokeWidth="0.3" />
      {points.map(([x, y], i) => {
        const isOutlier = x > 50;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={isOutlier ? 2.5 : 1.5}
            fill={isOutlier ? "#c1502e" : "#5a9485"}
            opacity={isOutlier ? 0.9 : 0.6}
          />
        );
      })}
    </svg>
  );
}

/* ============================================================
   Visualización Destacada: Treemap de Gasto por Categoría
   ============================================================ */

/**
 * Datos de gasto público por categoría (aproximación basada en
 * distribución real de compras públicas Chile 2024 por rubro UNSPSC).
 * Solo se usa para la visualización decorativa de la landing.
 */
interface CategoriaGasto {
  nombre: string;
  porcentaje: number;
  color: string;
}

const CATEGORIAS_GASTO: CategoriaGasto[] = [
  { nombre: "Salud",               porcentaje: 28, color: "#1f3a52" },
  { nombre: "Infraestructura",     porcentaje: 18, color: "#3a6d7a" },
  { nombre: "Tecnología",          porcentaje: 12, color: "#5a9485" },
  { nombre: "Educación",           porcentaje: 10, color: "#4a7c8c" },
  { nombre: "Equipamiento\ny suministros", porcentaje: 8, color: "#d4a437" },
  { nombre: "Servicios\nprofesionales",    porcentaje: 6, color: "#1f3a52" },
  { nombre: "Alimentación",        porcentaje: 5, color: "#c1502e" },
  { nombre: "Transporte",          porcentaje: 4, color: "#4a7c8c" },
  { nombre: "Defensa",             porcentaje: 4, color: "#3a6d7a" },
  { nombre: "Energía",             porcentaje: 3, color: "#6a7d8a" },
  { nombre: "Otros",               porcentaje: 2, color: "#5a9485" },
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

  // Split into two halves roughly equal by weight
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

function FeaturedTreemap() {
  const rects = layoutTreemap(CATEGORIAS_GASTO, 0, 0, 100, 100, true);
  const gap = 0.4;

  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ aspectRatio: "5/3" }} aria-hidden="true">
      {rects.map((r, i) => {
        const rx = r.x + gap / 2;
        const ry = r.y + gap / 2;
        const rw = Math.max(r.w - gap, 0.5);
        const rh = Math.max(r.h - gap, 0.5);
        const lines = r.item.nombre.split("\n");
        const fontSize = rw > 15 && rh > 12 ? 2.8 : rw > 8 && rh > 8 ? 2.2 : 0;
        return (
          <g key={i}>
            <rect
              x={rx}
              y={ry}
              width={rw}
              height={rh}
              rx="0.8"
              fill={r.item.color}
              className="transition-opacity hover:opacity-80"
            />
            {fontSize > 0 && (
              <text
                x={rx + rw / 2}
                y={ry + rh / 2 - (lines.length - 1) * (fontSize * 0.6)}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={fontSize}
                fontWeight="600"
                style={{ pointerEvents: "none" }}
              >
                {lines.map((line, li) => (
                  <tspan
                    key={li}
                    x={rx + rw / 2}
                    dy={li === 0 ? 0 : fontSize * 1.3}
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
  );
}

/** Logo OCP minimal (círculo + letra O estilizado) */
function OcpLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#5a9485" />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="11"
        fontWeight="700"
        fontFamily="Georgia, serif"
      >
        O
      </text>
    </svg>
  );
}
