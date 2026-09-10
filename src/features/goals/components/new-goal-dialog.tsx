"use client";

import { useActionState, useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { createGoalAction } from "@/features/goals/actions/goals.actions";
import { getGoalFormOptionsAction } from "@/features/goals/actions/get-goal-form-options.action";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { GOAL_PRIORITY_LABELS, GOAL_CONTRIBUTION_FREQUENCY_LABELS } from "@/features/goals/types/goal.types";
import type { ActionResult } from "@/types/action-result";
import type { AccountOption, CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";

const initialState: ActionResult = { ok: false, error: "" };
const today = () => format(new Date(), "yyyy-MM-dd");

export function NewGoalDialog() {
  const [open, setOpen] = useState(false);
  const [autoContribute, setAutoContribute] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [state, formAction, isPending] = useActionState(createGoalAction, initialState);
  useActionFeedback(state, { successMessage: "Meta creada", onSuccess: () => setOpen(false) });

  useEffect(() => {
    if (open && accounts.length === 0) {
      getGoalFormOptionsAction().then((options) => {
        setAccounts(options.accounts);
        setCategories(options.categories);
      });
    }
  }, [open, accounts.length]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nueva meta
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva meta de ahorro"
        description="Fondo de emergencia, viaje, inicial de vivienda, junta familiar..."
      >
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="goal-name">Nombre</Label>
            <Input id="goal-name" name="name" required placeholder="Fondo de emergencia, junta de la familia..." />
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

          <div className="flex items-center gap-2">
            <input
              id="goal-auto-contribute"
              name="autoContribute"
              type="checkbox"
              value="true"
              checked={autoContribute}
              onChange={(e) => setAutoContribute(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="goal-auto-contribute">Aporte automático (ej. junta quincenal/mensual con monto fijo)</Label>
          </div>

          {autoContribute ? (
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="goal-contribution-amount">Monto del aporte</Label>
                  <Input id="goal-contribution-amount" name="contributionAmount" inputMode="decimal" required={autoContribute} placeholder="200.00" />
                  <FieldError>{state.ok === false ? state.fieldErrors?.contributionAmount?.[0] : undefined}</FieldError>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="goal-contribution-frequency">Frecuencia</Label>
                  <Select id="goal-contribution-frequency" name="contributionFrequency" defaultValue="MONTHLY" required={autoContribute}>
                    {Object.entries(GOAL_CONTRIBUTION_FREQUENCY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="goal-contribution-account">Cuenta de origen</Label>
                <Select id="goal-contribution-account" name="contributionAccountId" defaultValue="" required={autoContribute}>
                  <option value="" disabled>
                    Selecciona una cuenta...
                  </option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
                <FieldError>{state.ok === false ? state.fieldErrors?.contributionAccountId?.[0] : undefined}</FieldError>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="goal-contribution-category">Categoría (opcional)</Label>
                <Select id="goal-contribution-category" name="contributionCategoryId" defaultValue="">
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="goal-contribution-start">Primer aporte</Label>
                <Input id="goal-contribution-start" name="contributionStartDate" type="date" defaultValue={today()} />
              </div>

              <p className="text-xs text-muted-foreground">
                Se registra solo cada ciclo como gasto desde esa cuenta, y suma a tu progreso automáticamente. Cuando te toque cobrar
                el pozo de la junta, regístralo tú como un ingreso — eso no se puede calcular solo.
              </p>
            </div>
          ) : null}

          {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Crear meta
          </Button>
        </form>
      </Dialog>
    </>
  );
}
