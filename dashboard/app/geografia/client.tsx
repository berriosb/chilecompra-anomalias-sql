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
import type { GastoRegion } from "@/lib/queries";
import { formatCompact } from "@/lib/utils";

export function GeografiaClient({ data }: { data: GastoRegion[] }) {
  if (!data || data.length === 0) {
    return <EmptyState pageName="Geografía" />;
  }

  // Top 10 + "Otras"
  const chartData = data.length > 10
    ? [
        ...data.slice(0, 10),
        {
          supplier_region: "Otras regiones",
          num_oc: data.slice(10).reduce((s, r) => s + Number(r.num_oc), 0),
          monto_total: data.slice(10).reduce((s, r) => s + Number(r.monto_total), 0),
          num_proveedores: 0,
          num_compradores: 0,
        },
      ]
    : data;

  const total = data.reduce((s, r) => s + Number(r.monto_total), 0);

  return (
    <main className="min-h-screen bg-paper">
      <Header title="¿Dónde están los proveedores del Estado?" />

      <section className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-ink-muted mb-6">
          Distribución del gasto por región del proveedor en 2024. La Región
          Metropolitana concentra el {((Number(data[0]?.monto_total) / total) * 100).toFixed(1)}%
          del gasto — sede de las grandes empresas que venden al Estado.
        </p>

        <div className="bg-white border border-grid rounded-lg p-6 mb-8">
          <h2 className="font-display text-xl mb-4 text-ink">
            Gasto total por región (miles de millones CLP)
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
                dataKey="supplier_region"
                width={300}
                tick={{ fill: "#1a1a1a", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-ink text-paper px-4 py-3 rounded shadow-lg text-xs">
                      <p className="font-medium mb-1">{d.supplier_region}</p>
                      <p className="tabular">${(d.monto_total / 1e9).toFixed(1)} mil M CLP</p>
                      <p className="text-paper/70">
                        {((d.monto_total / total) * 100).toFixed(1)}% del total
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="monto_total" radius={[0, 4, 4, 0]}>
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
                <th>Región</th>
                <th className="text-right">OC</th>
                <th className="text-right">Monto total</th>
                <th className="text-right">% del total</th>
                <th className="text-right">Proveedores</th>
                <th className="text-right">Compradores</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.supplier_region || i}>
                  <td className="text-ink-muted tabular">{i + 1}</td>
                  <td className="text-ink">{d.supplier_region}</td>
                  <td className="text-right text-ink-muted tabular">
                    {formatCompact(d.num_oc)}
                  </td>
                  <td className="text-right text-ink tabular font-medium">
                    ${formatCompact(d.monto_total)}
                  </td>
                  <td className="text-right text-ink-muted tabular">
                    {((Number(d.monto_total) / total) * 100).toFixed(1)}%
                  </td>
                  <td className="text-right text-ink-muted tabular">
                    {formatCompact(d.num_proveedores)}
                  </td>
                  <td className="text-right text-ink-muted tabular">
                    {formatCompact(d.num_compradores)}
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
        <Link href="/" className="inline-block mt-6 text-sm text-accent hover:underline">
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
