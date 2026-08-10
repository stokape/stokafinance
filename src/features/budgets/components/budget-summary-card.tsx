import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/money";
import type { BudgetOverview } from "@/features/budgets/types/budget.types";

export function BudgetSummaryCard({ overview }: { overview: BudgetOverview }) {
  const items = [
    { label: "Ingreso esperado", value: overview.expectedIncome },
    { label: "Ingreso real", value: overview.actualIncome },
    { label: "Meta de ahorro", value: overview.savingsTarget },
    { label: "Total asignado", value: overview.totalAllocated },
    { label: "Total gastado", value: overview.totalSpent },
  ];

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-5">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-base font-semibold">{formatMoney(item.value)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
