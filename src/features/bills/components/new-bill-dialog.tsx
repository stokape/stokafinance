"use client";

import { useActionState, useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { createBillAction } from "@/features/bills/actions/bills.actions";
import { getBillFormOptionsAction } from "@/features/bills/actions/get-bill-form-options.action";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/types/action-result";
import type { CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";

const initialState: ActionResult = { ok: false, error: "" };
const today = () => format(new Date(), "yyyy-MM-dd");
const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
};

export function NewBillDialog() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [state, formAction, isPending] = useActionState(createBillAction, initialState);
  useActionFeedback(state, { successMessage: "Pago registrado", onSuccess: () => setOpen(false) });

  useEffect(() => {
    if (open && categories.length === 0) {
      getBillFormOptionsAction().then((options) => setCategories(options.categories));
    }
  }, [open, categories.length]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nuevo pago
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nuevo pago pendiente" description="Registra una obligación futura para no olvidarla.">
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="bill-name">Nombre</Label>
            <Input id="bill-name" name="name" required placeholder="Internet, alquiler, seguro..." />
            <FieldError>{state.ok === false ? state.fieldErrors?.name?.[0] : undefined}</FieldError>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bill-amount">Monto</Label>
              <Input id="bill-amount" name="amount" inputMode="decimal" required placeholder="0.00" />
              <FieldError>{state.ok === false ? state.fieldErrors?.amount?.[0] : undefined}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill-due">Fecha de vencimiento</Label>
              <Input id="bill-due" name="dueDate" type="date" defaultValue={today()} required />
              <FieldError>{state.ok === false ? state.fieldErrors?.dueDate?.[0] : undefined}</FieldError>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bill-category">Categoría (opcional)</Label>
            <Select id="bill-category" name="categoryId" defaultValue="">
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bill-provider">Proveedor (opcional)</Label>
            <Input id="bill-provider" name="provider" placeholder="Movistar, Inmobiliaria..." />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="bill-recurring"
              name="recurring"
              type="checkbox"
              value="true"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="bill-recurring">Es un pago recurrente</Label>
          </div>

          {isRecurring ? (
            <div className="space-y-1.5">
              <Label htmlFor="bill-recurrence">Frecuencia</Label>
              <Select id="bill-recurrence" name="recurrence" defaultValue="MONTHLY" required={isRecurring}>
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">Al marcarlo como pagado, se crea automáticamente el siguiente vencimiento.</p>
            </div>
          ) : null}

          {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Registrar pago
          </Button>
        </form>
      </Dialog>
    </>
  );
}
