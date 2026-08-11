"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { createGoalAction } from "@/features/goals/actions/goals.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { GOAL_PRIORITY_LABELS } from "@/features/goals/types/goal.types";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

export function NewGoalDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createGoalAction, initialState);
  useActionFeedback(state, { successMessage: "Meta creada", onSuccess: () => setOpen(false) });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nueva meta
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nueva meta de ahorro" description="Fondo de emergencia, viaje, inicial de vivienda...">
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="goal-name">Nombre</Label>
            <Input id="goal-name" name="name" required placeholder="Fondo de emergencia" />
            <FieldError>{state.ok === false ? state.fieldErrors?.name?.[0] : undefined}</FieldError>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-amount">Monto objetivo</Label>
              <Input id="goal-amount" name="targetAmount" inputMode="decimal" required placeholder="10000.00" />
              <FieldError>{state.ok === false ? state.fieldErrors?.targetAmount?.[0] : undefined}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-priority">Prioridad</Label>
              <Select id="goal-priority" name="priority" defaultValue="MEDIUM">
                {Object.entries(GOAL_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-date">Fecha objetivo (opcional)</Label>
            <Input id="goal-date" name="targetDate" type="date" />
          </div>

          {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Crear meta
          </Button>
        </form>
      </Dialog>
    </>
  );
}
