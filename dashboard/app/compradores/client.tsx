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
import type { TopComprador } from "@/lib/queries";
import { formatCompact, truncate } from "@/lib/utils";

export function CompradoresClient({ data }: { data: TopComprador[] }) {
  if (!data || data.length === 0) {
    return <EmptyState pageName="Compradores" />;
  }

  // Formatear para el chart: nombre corto + monto en miles de millones
  const chartData = data.map((d) => ({
    name: truncate(d.buyer_name.split(" | ")[0], 40),
    fullName: d.buyer_name,
    monto: d.monto_total / 1e9, // miles de millones
    oc: d.num_oc,
    proveedores: d.num_proveedores,
  }));

  return (
    <main className="min-h-screen bg-paper">
      <Header title="¿Quién compra más al Estado?" />

      <section className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-ink-muted mb-6">
          Top 15 organismos compradores por gasto total en órdenes de compra, 2024.
          CENABAST (Central de Abastecimiento de Salud) concentra el 7% del gasto público
          con solo 269 OC grandes.
        </p>

        {/* Chart */}
        <div className="bg-white border border-grid rounded-lg p-6 mb-8">
          <h2 className="font-display text-xl mb-4 text-ink">
            Monto total por organismo (miles de millones CLP)
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
                width={280}
                tick={{ fill: "#1a1a1a", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="monto" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === 0 ? "#c1502e" : "#1a1a1a"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla detalle */}
        <div className="bg-white border border-grid rounded-lg overflow-hidden">
          <table className="editorial-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Organismo</th>
                <th className="text-right">OC</th>
                <th className="text-right">Monto total</th>
                <th className="text-right">Promedio OC</th>
                <th className="text-right">Proveedores</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.buyer_id || i}>
                  <td className="text-ink-muted tabular">{i + 1}</td>
                  <td className="text-ink">
                    {truncate(d.buyer_name.split(" | ")[0], 60)}
                  </td>
                  <td className="text-right text-ink-muted tabular">
                    {formatCompact(d.num_oc)}
                  </td>
                  <td className="text-right text-ink tabular font-medium">
                    ${formatCompact(d.monto_total)}
                  </td>
                  <td className="text-right text-ink-muted tabular">
                    ${formatCompact(d.monto_promedio)}
                  </td>
                  <td className="text-right text-ink-muted tabular">
                    {d.num_proveedores}
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

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-ink text-paper px-4 py-3 rounded shadow-lg text-xs">
      <p className="font-medium mb-1">{d.fullName?.split(" | ")[0]}</p>
      <p className="tabular">${d.monto.toFixed(1)} mil M CLP</p>
      <p className="text-paper/70">{d.oc.toLocaleString("es-CL")} OC</p>
      <p className="text-paper/70">{d.proveedores} proveedores</p>
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
        <p className="text-sm text-ink-muted">
          Verificá que Supabase esté configurado y la tabla tenga datos.
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
        <p>
          Datos:{" "}
          <a className="underline hover:text-ink" href="https://data.open-contracting.org/es/publication/144">
            Open Contracting Partnership
          </a>{" "}
          · CC0 1.0 Universal
        </p>
      </div>
    </footer>
  );
}
