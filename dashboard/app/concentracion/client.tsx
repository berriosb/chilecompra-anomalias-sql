"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { HHIOrganismo } from "@/lib/queries";
import { formatCompact, hhiLevel, truncate } from "@/lib/utils";

export function ConcentracionClient({ data }: { data: HHIOrganismo[] }) {
  if (!data || data.length === 0) {
    return <EmptyState pageName="Concentración" />;
  }

  const chartData = data.map((d) => ({
    ...d,
    monto: Number(d.monto_total) / 1e9, // miles de millones
    shortName: truncate(d.buyer_name.split(" | ")[0], 38),
  }));

  // Helpers para color por HHI
  const colorFor = (hhi: number) => {
    const level = hhiLevel(Number(hhi));
    if (level.label === "Diversificado") return "#4a7c59";
    if (level.label === "Moderado") return "#d4a437";
    return "#c1502e";
  };

  return (
    <main className="min-h-screen bg-paper">
      <Header title="¿Dónde hay concentración sospechosa?" />

      <section className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-ink-muted mb-6">
          El <strong className="text-ink">Índice HHI (Herfindahl-Hirschman)</strong> mide
          concentración de mercado. Valores sobre 2.500 indican que pocos proveedores
          dominan el gasto — posibles casos de colusión o dependencia excesiva.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <LegendCard
            color="#4a7c59"
            label="Diversificado"
            description="HHI < 1.500"
            detail="Mercado competitivo, múltiples proveedores compiten"
          />
          <LegendCard
            color="#d4a437"
            label="Moderado"
            description="1.500 ≤ HHI < 2.500"
            detail="Concentración aceptable, pero a vigilar"
          />
          <LegendCard
            color="#c1502e"
            label="Alta concentración"
            description="HHI ≥ 2.500"
            detail="Riesgo de colusión, dependencia excesiva"
          />
        </div>

        {/* Scatter */}
        <div className="bg-white border border-grid rounded-lg p-6 mb-8">
          <h2 className="font-display text-xl mb-4 text-ink">
            HHI vs gasto total — Top 30 organismos
          </h2>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e6e1" />
              <XAxis
                type="number"
                dataKey="monto"
                name="Gasto"
                unit=" mil M"
                tick={{ fill: "#8a8580", fontSize: 11 }}
                label={{
                  value: "Gasto total (miles de millones CLP)",
                  position: "insideBottom",
                  offset: -10,
                  fill: "#8a8580",
                  fontSize: 12,
                }}
              />
              <YAxis
                type="number"
                dataKey="hhi"
                name="HHI"
                tick={{ fill: "#8a8580", fontSize: 11 }}
                label={{
                  value: "Índice HHI",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#8a8580",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={1500}
                stroke="#e8e6e1"
                strokeDasharray="4 4"
                label={{ value: "1.500", fill: "#8a8580", fontSize: 10, position: "right" }}
              />
              <ReferenceLine
                y={2500}
                stroke="#e8e6e1"
                strokeDasharray="4 4"
                label={{ value: "2.500", fill: "#8a8580", fontSize: 10, position: "right" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                data={chartData}
                fill="#c1502e"
                shape={(props: any) => {
                  const color = colorFor(props.payload.hhi);
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={Math.sqrt(props.payload.monto) * 1.5 + 4}
                      fill={color}
                      fillOpacity={0.78}
                      stroke="#1a1a1a"
                      strokeWidth={0.8}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-grid rounded-lg overflow-hidden">
          <table className="editorial-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Organismo</th>
                <th className="text-right">HHI</th>
                <th className="text-right">Proveedores</th>
                <th className="text-right">Gasto total</th>
                <th>Nivel</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => {
                const level = hhiLevel(Number(d.hhi));
                return (
                  <tr key={d.buyer_name || i}>
                    <td className="text-ink-muted tabular">{i + 1}</td>
                    <td className="text-ink">{d.shortName}</td>
                    <td className="text-right text-ink tabular font-medium">
                      {Number(d.hhi).toFixed(1)}
                    </td>
                    <td className="text-right text-ink-muted tabular">
                      {d.num_proveedores}
                    </td>
                    <td className="text-right text-ink-muted tabular">
                      ${formatCompact(d.monto_total)}
                    </td>
                    <td>
                      <span className={`text-xs ${level.color} ${level.bg} px-2 py-1 rounded font-medium`}>
                        {level.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
  const level = hhiLevel(Number(d.hhi));
  return (
    <div className="bg-ink text-paper px-4 py-3 rounded shadow-lg text-xs max-w-xs">
      <p className="font-medium mb-2">{d.buyer_name?.split(" | ")[0]}</p>
      <p className="tabular">
        <span className="text-paper/70">HHI:</span> {Number(d.hhi).toFixed(1)}
      </p>
      <p className="tabular">
        <span className="text-paper/70">Gasto:</span> ${d.monto.toFixed(1)} mil M
      </p>
      <p className="tabular">
        <span className="text-paper/70">Proveedores:</span> {d.num_proveedores}
      </p>
      <p className={`mt-2 font-medium ${level.color.replace("text-", "text-")}`}>
        {level.label}
      </p>
    </div>
  );
}

function LegendCard({
  color,
  label,
  description,
  detail,
}: {
  color: string;
  label: string;
  description: string;
  detail: string;
}) {
  return (
    <div className="border border-grid rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-medium text-ink">{label}</span>
      </div>
      <div className="text-xs text-ink-muted font-mono mb-2">{description}</div>
      <div className="text-xs text-ink-muted">{detail}</div>
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
