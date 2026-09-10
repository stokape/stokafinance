"use client";

import { useState, useTransition } from "react";
import { MoreVertical, XCircle, PlusCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils/money";
import { AddContributionDialog } from "./add-contribution-dialog";
import { cancelGoalAction } from "@/features/goals/actions/goals.actions";
import { GOAL_PRIORITY_LABELS, type GoalWithProgress } from "@/features/goals/types/goal.types";

export function GoalCard({ goal }: { goal: GoalWithProgress }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setMenuOpen(false);
    if (!confirm(`¿Cancelar la meta "${goal.name}"?`)) return;
    startTransition(async () => {
      const result = await cancelGoalAction(goal.id);
      if (result.ok) toast.success("Meta cancelada");
      else toast.error(result.error);
    });
  }

  const clamped = Math.min(100, Math.max(0, goal.percentageComplete));
  const isComplete = goal.status === "COMPLETED";

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              {goal.name}
              {goal.contributionAmount ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground"
                  title="Tiene aporte automático configurado"
                >
                  <RefreshCw className="h-2.5 w-2.5" /> auto
                </span>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground">
              Prioridad {GOAL_PRIORITY_LABELS[goal.priority]}
              {goal.targetDate ? ` · Meta: ${goal.targetDate}` : ""}
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Más opciones"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <div role="menu" className="absolute right-0 top-9 z-20 w-44 rounded-md border border-border bg-card p-1 shadow-lg">
                <button
                  type="button"
                  role="menuitem"
                  disabled={isPending}
                  onClick={handleCancel}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Cancelar meta
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-xl font-semibold">{formatMoney(goal.currentAmount, goal.currency)}</p>
          <p className="text-xs text-muted-foreground">de {formatMoney(goal.targetAmount, goal.currency)}</p>
        </div>

        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${clamped}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{clamped.toFixed(0)}% alcanzado</p>
        </div>

        {!isComplete && Number(goal.amountRemaining) > 0 ? (
          <p className="text-xs text-muted-foreground">
            Faltan {formatMoney(goal.amountRemaining, goal.currency)}
            {goal.targetDate ? ` · ahorro mensual sugerido: ${formatMoney(goal.requiredMonthlyContribution, goal.currency)}` : ""}
          </p>
        ) : null}

        {isComplete ? (
          <p className="text-xs font-medium text-success">🎉 Meta cumplida</p>
        ) : (
          <Button size="sm" variant="outline" className="w-full" onClick={() => setContribOpen(true)}>
            <PlusCircle className="h-3.5 w-3.5" /> Agregar aporte
          </Button>
        )}
      </CardContent>

      <AddContributionDialog open={contribOpen} onClose={() => setContribOpen(false)} goalId={goal.id} goalName={goal.name} />
    </Card>
  );
}
