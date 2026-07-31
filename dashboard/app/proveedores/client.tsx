"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { TopProveedor } from "@/lib/queries";
import { formatCompact, truncate } from "@/lib/utils";

export function ProveedoresClient({ data }: { data: TopProveedor[] }) {
  if (!data || data.length === 0) {
    return <EmptyState pageName="Proveedores" />;
  }

  const chartData = data.map((d) => ({
    name: truncate(d.supplier_name.split(" | ")[0], 35),
    fullName: d.supplier_name,
    monto: d.monto_total / 1e9,
    oc: d.num_oc,
    compradores: d.num_compradores,
    region: d.supplier_region,
  }));

  return (
    <main className="min-h-screen bg-paper">
      <Header title="¿Quién vende más al Estado?" />

      <section className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-ink-muted mb-6">
          Top 15 proveedores por monto total vendido al Estado en 2024. COPEC vende
          a 1.526 organismos distintos. Edenred domina el mercado de gift cards de
          alimentación para funcionarios públicos.
        </p>

        <div className="bg-white border border-grid rounded-lg p-6 mb-8">
          <h2 className="font-display text-xl mb-4 text-ink">
            Monto total vendido (miles de millones CLP)
          </h2>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e6e1" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "#8a8580", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e8e6e1" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={250}
                tick={{ fill: "#1a1a1a", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="monto" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#c1502e" : "#1a1a1a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-grid rounded-lg overflow-hidden">
          <table className="editorial-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Proveedor</th>
                <th>RUT</th>
                <th>Región</th>
                <th className="text-right">OC</th>
                <th className="text-right">Compradores</th>
                <th className="text-right">Monto total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.supplier_rut || i}>
                  <td className="text-ink-muted tabular">{i + 1}</td>
                  <td className="text-ink">
                    {truncate(d.supplier_name.split(" | ")[0], 40)}
                  </td>
                  <td className="text-ink-muted text-xs tabular font-mono">
                    {d.supplier_rut || "—"}
                  </td>
                  <td className="text-ink-muted text-xs">
                    {truncate(d.supplier_region, 25)}
                  </td>
                  <td className="text-right text-ink-muted tabular">
                    {formatCompact(d.num_oc)}
                  </td>
                  <td className="text-right text-ink-muted tabular">
                    {d.num_compradores}
                  </td>
                  <td className="text-right text-ink tabular font-medium">
                    ${formatCompact(d.monto_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: Record<string, unknown> }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as Record<string, any>;
  return (
    <div className="bg-ink text-paper px-4 py-3 rounded shadow-lg text-xs">
      <p className="font-medium mb-1">{(d.fullName as string)?.split(" | ")[0]}</p>
      <p className="tabular">${(d.monto as number).toFixed(1)} mil M CLP</p>
      <p className="text-paper/70">{(d.oc as number).toLocaleString("es-CL")} OC</p>
      <p className="text-paper/70">{d.compradores as number} compradores</p>
      <p className="text-paper/70">{d.region as string}</p>
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <header className="border-b border-grid bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        <Link href="/" className="font-display text-lg text-ink">
          ChileCompra<span className="text-accent">.</span>
        </Link>
        <div className="w-16" />
      </div>
      <div className="max-w-6xl mx-auto px-6 pb-4">
        <h1 className="font-display text-3xl text-ink">{title}</h1>
      </div>
    </header>
  );
}

function EmptyState({ pageName }: { pageName: string }) {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center">
      <div className="max-w-md text-center px-6">
        <p className="text-ink-muted mb-4">
          No hay datos disponibles para {pageName}.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 text-sm text-accent hover:underline"
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}

function Footer() {
  return (
    <footer className="border-t border-grid mt-12">
      <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-ink-muted">
        <p>Datos: CC0 1.0 · Open Contracting Partnership</p>
      </div>
    </footer>
  );
}
