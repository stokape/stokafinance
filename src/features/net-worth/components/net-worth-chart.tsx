"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/utils/money";
import type { SnapshotPoint } from "@/features/net-worth/types/net-worth.types";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      <p className="text-primary">{formatMoney(payload[0].value)}</p>
    </div>
  );
}

/** Patrimonio neto en el tiempo (§19) — a partir de los snapshots guardados manualmente. */
export function NetWorthChart({ points }: { points: SnapshotPoint[] }) {
  const chartData = points.map((p) => ({ ...p, label: format(parseISO(p.date), "d MMM", { locale: es }) }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={56}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(value: number) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value))}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Area type="monotone" dataKey="netWorth" stroke="var(--primary)" strokeWidth={2} fill="url(#netWorthGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
