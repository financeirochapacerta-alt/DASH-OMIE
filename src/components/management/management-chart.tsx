"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartPoint } from "@/features/management/data";

export function ManagementChart({ data, kind }: { data: ChartPoint[]; kind: "area" | "bar" | "line" }) {
  const common = { data, margin: { top: 12, right: 12, left: 0, bottom: 0 } };
  const children = <><CartesianGrid stroke="#e8ece9" vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} width={56} /><Tooltip /></>;
  return <div className="chart-wrap" role="img" aria-label="Gráfico gerencial"><ResponsiveContainer width="100%" height="100%">
    {kind === "bar" ? <BarChart {...common}>{children}<Bar dataKey="primary" fill="#176b46" radius={[5,5,0,0]} /><Bar dataKey="secondary" fill="#d8a33c" radius={[5,5,0,0]} /></BarChart>
      : kind === "line" ? <LineChart {...common}>{children}<Line dataKey="primary" stroke="#176b46" strokeWidth={3} dot={false} /><Line dataKey="secondary" stroke="#d8a33c" strokeWidth={2} dot={false} /></LineChart>
      : <AreaChart {...common}>{children}<Area dataKey="primary" stroke="#176b46" fill="#dceee5" strokeWidth={3} /></AreaChart>}
  </ResponsiveContainer></div>;
}
