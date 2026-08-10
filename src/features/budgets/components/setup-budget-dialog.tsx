"use client";

import { useActionState, useState } from "react";
import { Settings } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { upsertBudgetAction } from "@/features/budgets/actions/budgets.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

interface SetupBudgetDialogProps {
  year: number;
  month: number;
  expectedIncome: string;
  savingsTarget: string;
}

export function SetupBudgetDialog({ year, month, expectedIncome, savingsTarget }: SetupBudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(upsertBudgetAction, initialState);
  useActionFeedback(state, { successMessage: "Presupuesto del mes guardado", onSuccess: () => setOpen(false) });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Settings className="h-3.5 w-3.5" /> Configurar mes
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Configurar presupuesto" description="Ingreso esperado y meta de ahorro para el mes.">
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="month" value={month} />

          <div className="space-y-1.5">
            <Label htmlFor="bud-income">Ingreso esperado</Label>
            <Input id="bud-income" name="expectedIncome" inputMode="decimal" defaultValue={expectedIncome} required />
            <FieldError>{state.ok === false ? state.fieldErrors?.expectedIncome?.[0] : undefined}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bud-savings">Meta de ahorro</Label>
            <Input id="bud-savings" name="savingsTarget" inputMode="decimal" defaultValue={savingsTarget} required />
            <FieldError>{state.ok === false ? state.fieldErrors?.savingsTarget?.[0] : undefined}</FieldError>
          </div>

          {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Guardar
          </Button>
        </form>
      </Dialog>
    </>
  );
}
