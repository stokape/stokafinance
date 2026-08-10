"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setBudgetCategoryAction, removeBudgetCategoryAction } from "@/features/budgets/actions/budgets.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { formatMoney } from "@/lib/utils/money";
import { BudgetStatusBar } from "./budget-status-bar";
import type { ActionResult } from "@/types/action-result";
import type { BudgetCategoryLine } from "@/features/budgets/types/budget.types";

const initialState: ActionResult = { ok: false, error: "" };

interface BudgetCategoryRowProps {
  year: number;
  month: number;
  line: BudgetCategoryLine;
}

export function BudgetCategoryRow({ year, month, line }: BudgetCategoryRowProps) {
  const [state, formAction, isPending] = useActionState(setBudgetCategoryAction, initialState);
  const [isRemoving, startRemove] = useTransition();
  useActionFeedback(state, { successMessage: "Presupuesto actualizado" });

  function handleRemove() {
    if (!confirm(`¿Quitar "${line.categoryName}" del presupuesto?`)) return;
    startRemove(async () => {
      const result = await removeBudgetCategoryAction(line.id);
      if (result.ok) toast.success("Categoría quitada del presupuesto");
      else toast.error(result.error);
    });
  }

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-b border-border py-3 last:border-0 sm:grid-cols-[1fr_auto_auto] sm:gap-4">
      <div className="min-w-0 space-y-1.5">
        <p className="text-sm font-medium">{line.categoryName}</p>
        <BudgetStatusBar percentage={line.percentageUsed} status={line.status} />
        <p className="text-xs text-muted-foreground">
          Gastado {formatMoney(line.spent)} de {formatMoney(line.allocated)} · Disponible {formatMoney(line.available)}
        </p>
      </div>

      <form action={formAction} className="flex items-center gap-1.5">
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="categoryId" value={line.categoryId} />
        <Input
          name="allocatedAmount"
          inputMode="decimal"
          defaultValue={line.allocated}
          className="w-28"
          aria-label={`Monto asignado a ${line.categoryName}`}
        />
        <Button type="submit" size="sm" variant="outline" isLoading={isPending}>
          Guardar
        </Button>
      </form>

      <Button size="sm" variant="ghost" onClick={handleRemove} disabled={isRemoving} aria-label={`Quitar ${line.categoryName}`}>
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
