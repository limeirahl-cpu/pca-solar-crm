"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export type BarChartPoint = { label: string; value: number; color?: string };

const DEFAULT_COLOR = "#f9700e"; // laranja da marca (--primary)

export function DashboardBarChart({
  data,
  valueFormatter,
  height = 240,
  className,
}: {
  data: BarChartPoint[];
  valueFormatter?: (value: number) => string;
  height?: number;
  className?: string;
}) {
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div
        className={cn("flex items-center justify-center text-sm text-muted", className)}
        style={{ height }}
      >
        Sem dados suficientes ainda para gerar o gráfico.
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value) => (valueFormatter ? valueFormatter(Number(value)) : String(value))}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 13,
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color ?? DEFAULT_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
