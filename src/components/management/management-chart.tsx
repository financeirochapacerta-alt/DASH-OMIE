"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL } from "@/features/management/format";
import type { ChartPoint } from "@/features/management/data";

const compactBRL = new Intl.NumberFormat("pt-BR", { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 });

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((entry, index) => (
        <div key={index} className="chart-tooltip-row">
          <span style={{ background: entry.color }} />
          {formatBRL(entry.value ?? 0)}
        </div>
      ))}
    </div>
  );
}

export function ManagementChart({
  data,
  kind,
  referenceLine,
}: {
  data: ChartPoint[];
  kind: "area" | "bar" | "line";
  referenceLine?: { value: number; label: string };
}) {
  const common = { data, margin: { top: 12, right: 12, left: 0, bottom: 0 } };
  const children = (
    <>
      <CartesianGrid stroke="#e8ece9" vertical={false} />
      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
      <YAxis tickLine={false} axisLine={false} width={52} fontSize={11} tickFormatter={(value: number) => compactBRL.format(value)} />
      <Tooltip content={<ChartTooltip />} cursor={{ fill: "#17221c0a" }} />
      {referenceLine && (
        <ReferenceLine y={referenceLine.value} stroke="#b78122" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: referenceLine.label, position: "insideTopLeft", fill: "#8a5a08", fontSize: 10, fontWeight: 700 }} />
      )}
    </>
  );
  return (
    <div className="chart-wrap" role="img" aria-label="Gráfico gerencial">
      <ResponsiveContainer width="100%" height="100%">
        {kind === "bar" ? (
          <BarChart {...common}>
            {children}
            <Bar dataKey="primary" fill="#176b46" radius={[5, 5, 0, 0]} />
            <Bar dataKey="secondary" fill="#d8a33c" radius={[5, 5, 0, 0]} />
          </BarChart>
        ) : kind === "line" ? (
          <LineChart {...common}>
            {children}
            <Line dataKey="primary" stroke="#176b46" strokeWidth={3} dot={false} />
            <Line dataKey="secondary" stroke="#d8a33c" strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <AreaChart {...common}>
            {children}
            <Area dataKey="primary" stroke="#176b46" fill="#dceee5" strokeWidth={3} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
