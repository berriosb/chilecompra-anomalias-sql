import Link from "next/link";
import { ArrowUpRight, Database, TrendingUp, Users, Building2 } from "lucide-react";
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
    <main className="min-h-screen bg-paper">
      <Header />

      {/* Hero */}
      <section className="border-b border-grid">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <p className="text-sm uppercase tracking-wider text-ink-muted mb-3">
            ChileCompra · 2024
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-ink leading-tight mb-6">
            ¿Quién gasta la plata pública,<br />
            en qué, y con quién?
          </h1>
          <p className="text-lg text-ink-muted max-w-2xl leading-relaxed">
            Análisis de <strong className="text-ink">918K órdenes de compra</strong> del
            Estado chileno usando datos abiertos OCDS (CC0 1.0). Detección de
            concentración de mercado, top proveedores, distribución territorial y
            anomalías de precio.
          </p>
        </div>
      </section>

      {/* KPIs */}
      {resumen && (
        <section className="border-b border-grid">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <KPI
                icon={<Database className="w-5 h-5" />}
                label="Órdenes de compra"
                value={formatCLP(resumen.total_oc)}
              />
              <KPI
                icon={<Building2 className="w-5 h-5" />}
                label="Organismos"
                value={formatCLP(resumen.organismos)}
              />
              <KPI
                icon={<Users className="w-5 h-5" />}
                label="Proveedores"
                value={formatCLP(resumen.proveedores)}
              />
              <KPI
                icon={<TrendingUp className="w-5 h-5" />}
                label="Monto total"
                value={`$${formatCompact(resumen.monto_total)}`}
                suffix="CLP"
              />
            </div>
          </div>
        </section>
      )}

      {/* Estado de Supabase — solo si NO hay Supabase Y NO hay datos fallback */}
      {!hasSupabase && !resumen && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="border border-amber-300 bg-amber-50 rounded-lg p-6">
            <h3 className="font-display text-xl mb-2 text-amber-900">
              Dashboard en modo demo
            </h3>
            <p className="text-amber-800 mb-4">
              Las variables de Supabase no están configuradas. Para ver datos en vivo,
              agregá estas env vars en tu <code>.env.local</code>:
            </p>
            <pre className="bg-amber-100 text-amber-900 p-4 rounded text-sm overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key`}
            </pre>
            <p className="text-amber-800 mt-4">
              Después corré el SQL de{" "}
              <code className="bg-amber-100 px-1 rounded">dashboard/supabase/migrations.sql</code>{" "}
              en el SQL Editor de tu proyecto Supabase.
            </p>
          </div>
        </section>
      )}

      {/* Banner demo (cuando funciona con fallback CSVs) */}
      {!hasSupabase && resumen && (
        <section className="max-w-6xl mx-auto px-6 py-6">
          <div className="border border-grid bg-bg-subtle rounded-lg p-4 text-sm text-ink-muted">
            <strong className="text-ink">Modo demo:</strong>{" "}
            datos servidos desde los CSVs locales. Para conectar Supabase, agregá
            las env vars <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en
            Vercel + corré las migraciones en SQL Editor.
          </div>
        </section>
      )}

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

      {/* Secciones */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-2xl mb-8 text-ink">Explorar el análisis</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <NavCard
            href="/compradores"
            title="¿Quién compra más?"
            subtitle="Top 15 organismos compradores por monto total"
            stat={resumen ? `${formatCLP(resumen.organismos)} organismos` : undefined}
          />
          <NavCard
            href="/proveedores"
            title="¿Quién vende más?"
            subtitle="Top 15 proveedores del Estado por venta total"
            stat={resumen ? `${formatCLP(resumen.proveedores)} proveedores` : undefined}
          />
          <NavCard
            href="/geografia"
            title="¿Dónde están los proveedores?"
            subtitle="Distribución del gasto por región del proveedor"
          />
          <NavCard
            href="/concentracion"
            title="¿Dónde hay concentración sospechosa?"
            subtitle="HHI por organismo: detecta mercados poco competitivos"
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-grid">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-lg text-ink">
          ChileCompra<span className="text-accent">.</span>
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/compradores" className="text-ink-muted hover:text-ink">
            Compradores
          </Link>
          <Link href="/proveedores" className="text-ink-muted hover:text-ink">
            Proveedores
          </Link>
          <Link href="/geografia" className="text-ink-muted hover:text-ink">
            Geografía
          </Link>
          <Link href="/concentracion" className="text-ink-muted hover:text-ink">
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
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-ink-muted mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-display text-3xl md:text-4xl text-ink tabular leading-none">
        {value}
      </div>
      {suffix && (
        <div className="text-xs text-ink-muted mt-1">{suffix}</div>
      )}
    </div>
  );
}

function NavCard({
  href,
  title,
  subtitle,
  stat,
}: {
  href: string;
  title: string;
  subtitle: string;
  stat?: string;
}) {
  return (
    <Link
      href={href}
      className="group block border border-grid rounded-lg p-6 hover:border-ink-muted hover:bg-bg-subtle transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-display text-xl text-ink">{title}</h3>
        <ArrowUpRight className="w-5 h-5 text-ink-muted group-hover:text-accent transition-colors" />
      </div>
      <p className="text-sm text-ink-muted mb-3">{subtitle}</p>
      {stat && (
        <div className="text-xs text-ink-muted tabular">{stat}</div>
      )}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="border-t border-grid mt-12">
      <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-ink-muted">
        <p>
          Datos: <a className="underline hover:text-ink" href="https://data.open-contracting.org/es/publication/144">
            Open Contracting Partnership
          </a>{" "}
          · Licencia CC0 1.0 Universal
        </p>
        <p className="mt-1">
          Pipeline de análisis:{" "}
          <a className="underline hover:text-ink" href="https://github.com/berriosb/chilecompra-anomalias-sql">
            github.com/berriosb/chilecompra-anomalias-sql
          </a>
        </p>
      </div>
    </footer>
  );
}
