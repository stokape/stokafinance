import { CheckCircle2, TriangleAlert, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BUDGET_STATUS_LABELS } from "@/features/budgets/types/budget.types";
import type { BudgetUsageResult } from "@/lib/financial-engine";

/** Barra de consumo de presupuesto (§16/§42): nunca depende sólo del color, siempre icono + texto. */
export function BudgetStatusBar({ percentage, status }: { percentage: number; status: BudgetUsageResult["status"] }) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const barColor = status === "EXCEEDED" ? "bg-danger" : status === "RISK" ? "bg-warning" : status === "ATTENTION" ? "bg-warning" : "bg-success";
  const textColor = status === "EXCEEDED" ? "text-danger" : status === "RISK" || status === "ATTENTION" ? "text-warning" : "text-success";
  const Icon = status === "EXCEEDED" ? AlertTriangle : status === "RISK" || status === "ATTENTION" ? TriangleAlert : CheckCircle2;

  return (
    <div className="space-y-1">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${clamped}%` }} />
      </div>
      <p className={cn("flex items-center gap-1 text-xs font-medium", textColor)}>
        <Icon className="h-3 w-3" /> {percentage.toFixed(0)}% · {BUDGET_STATUS_LABELS[status]}
      </p>
    </div>
  );
}
