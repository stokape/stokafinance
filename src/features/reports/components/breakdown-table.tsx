import { formatMoney } from "@/lib/utils/money";
import { EmptyState } from "@/components/feedback/empty-state";
import type { ReportBreakdownItem } from "@/features/reports/types/report.types";

export function BreakdownTable({ items, emptyLabel }: { items: ReportBreakdownItem[]; emptyLabel: string }) {
  if (items.length === 0) return <EmptyState title={emptyLabel} className="py-6" />;

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.label} className="flex items-center justify-between gap-3 py-2 text-sm">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium">{formatMoney(item.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
