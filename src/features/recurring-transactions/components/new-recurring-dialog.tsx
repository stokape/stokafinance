"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { createRecurringTransactionAction } from "@/features/recurring-transactions/actions/recurring-transactions.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { RECURRING_FREQUENCY_LABELS, RECURRING_TYPE_LABELS } from "@/features/recurring-transactions/types/recurring-transaction.types";
import type { ActionResult } from "@/types/action-result";
import type { AccountOption, CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";

const initialState: ActionResult = { ok: false, error: "" };
const today = () => format(new Date(), "yyyy-MM-dd");

interface NewRecurringDialogProps {
  accounts: AccountOption[];
  categories: CategoryOption[];
}

export function NewRecurringDialog({ accounts, categories }: NewRecurringDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "TRANSFER">("EXPENSE");
  const [state, formAction, isPending] = useActionState(createRecurringTransactionAction, initialState);
  useActionFeedback(state, { successMessage: "Recurrencia creada", onSuccess: () => setOpen(false) });

  const relevantCategories = categories.filter((c) => c.categoryType === type);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Nueva recurrencia
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nuevo movimiento recurrente" description="Se genera automáticamente al vencer, sin cron (§28).">
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="rec-type">Tipo</Label>
            <Select id="rec-type" name="transactionType" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              {Object.entries(RECURRING_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rec-description">Descripción</Label>
            <Input id="rec-description" name="description" required placeholder="Sueldo, ahorro automático..." />
            <FieldError>{state.ok === false ? state.fieldErrors?.description?.[0] : undefined}</FieldError>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec-account">{type === "TRANSFER" ? "Cuenta origen" : "Cuenta"}</Label>
              <Select id="rec-account" name="accountId" required defaultValue="">
                <option value="" disabled>
                  Selecciona una cuenta
                </option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
              <FieldError>{state.ok === false ? state.fieldErrors?.accountId?.[0] : undefined}</FieldError>
            </div>

            {type === "TRANSFER" ? (
              <div className="space-y-1.5">
                <Label htmlFor="rec-destination">Cuenta destino</Label>
                <Select id="rec-destination" name="destinationAccountId" required defaultValue="">
                  <option value="" disabled>
                    Selecciona destino
                  </option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
                <FieldError>{state.ok === false ? state.fieldErrors?.destinationAccountId?.[0] : undefined}</FieldError>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="rec-category">Categoría</Label>
                <Select id="rec-category" name="categoryId" required defaultValue="">
                  <option value="" disabled>
                    Selecciona categoría
                  </option>
                  {relevantCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <FieldError>{state.ok === false ? state.fieldErrors?.categoryId?.[0] : undefined}</FieldError>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec-amount">Monto</Label>
              <Input id="rec-amount" name="amount" inputMode="decimal" required placeholder="0.00" />
              <FieldError>{state.ok === false ? state.fieldErrors?.amount?.[0] : undefined}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-frequency">Frecuencia</Label>
              <Select id="rec-frequency" name="frequency" defaultValue="MONTHLY">
                {Object.entries(RECURRING_FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec-start">Primera ejecución</Label>
              <Input id="rec-start" name="startDate" type="date" defaultValue={today()} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-end">Fecha fin (opcional)</Label>
              <Input id="rec-end" name="endDate" type="date" />
            </div>
          </div>

          {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Crear recurrencia
          </Button>
        </form>
      </Dialog>
    </>
  );
}
