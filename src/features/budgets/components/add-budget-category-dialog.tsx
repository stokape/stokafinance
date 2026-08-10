"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { setBudgetCategoryAction } from "@/features/budgets/actions/budgets.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/types/action-result";
import type { CategoryChoice } from "@/features/budgets/types/budget.types";

const initialState: ActionResult = { ok: false, error: "" };

interface AddBudgetCategoryDialogProps {
  year: number;
  month: number;
  categories: CategoryChoice[];
}

export function AddBudgetCategoryDialog({ year, month, categories }: AddBudgetCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(setBudgetCategoryAction, initialState);
  useActionFeedback(state, { successMessage: "Categoría agregada al presupuesto", onSuccess: () => setOpen(false) });

  if (categories.length === 0 && !open) {
    return null;
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} disabled={categories.length === 0}>
        <Plus className="h-3.5 w-3.5" /> Agregar categoría
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Agregar categoría al presupuesto">
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="month" value={month} />

          <div className="space-y-1.5">
            <Label htmlFor="bc-category">Categoría</Label>
            <Select id="bc-category" name="categoryId" required defaultValue="">
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <FieldError>{state.ok === false ? state.fieldErrors?.categoryId?.[0] : undefined}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-amount">Monto asignado</Label>
            <Input id="bc-amount" name="allocatedAmount" inputMode="decimal" required placeholder="0.00" />
            <FieldError>{state.ok === false ? state.fieldErrors?.allocatedAmount?.[0] : undefined}</FieldError>
          </div>

          {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Agregar
          </Button>
        </form>
      </Dialog>
    </>
  );
}
