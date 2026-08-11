"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/utils/money";

interface ForecastChartPoint {
  date: string;
  projectedBalance: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      <p className={value < 0 ? "text-danger" : "text-primary"}>{formatMoney(value)}</p>
    </div>
  );
}

export function ForecastChart({ points }: { points: ForecastChartPoint[] }) {
  const chartData = points.map((p) => ({ ...p, label: format(parseISO(p.date), "d MMM", { locale: es }) }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} minTickGap={24} />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={56}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(value: number) => (Math.abs(value) >= 1000 ? `${Math.round(value / 1000)}k` : String(value))}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <ReferenceLine y={0} stroke="var(--danger)" strokeDasharray="4 4" />
        <Area type="monotone" dataKey="projectedBalance" stroke="var(--primary)" strokeWidth={2} fill="url(#forecastGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
