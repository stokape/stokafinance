"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/utils/money";
import type { CategoryBreakdownItem } from "@/features/dashboard/services/dashboard.service";

const SERIES_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];
const MAX_SLOTS = 6;

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: CategoryBreakdownItem }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{item.categoryName}</p>
      <p className="text-muted-foreground">{formatMoney(item.amount)}</p>
    </div>
  );
}

/** Gastos por categoría del mes (§11/§25). Colapsa a "Otros" más allá de 6 categorías (guía dataviz). */
export function CategoryBreakdownChart({ items }: { items: CategoryBreakdownItem[] }) {
  const top = items.slice(0, MAX_SLOTS);
  const rest = items.slice(MAX_SLOTS);
  const restTotal = rest.reduce((acc, item) => acc + item.amount, 0);
  const chartData = restTotal > 0 ? [...top, { categoryId: null, categoryName: "Otros", amount: restTotal }] : top;

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="categoryName"
          axisLine={false}
          tickLine={false}
          width={110}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="amount" radius={[0, 3, 3, 0]} maxBarSize={18}>
          {chartData.map((entry, index) => (
            <Cell key={entry.categoryId ?? "other"} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
          ))}
          <LabelList
            dataKey="amount"
            position="right"
            formatter={(value: unknown) => formatMoney(Number(value))}
            style={{ fontSize: 11, fill: "var(--foreground)" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
