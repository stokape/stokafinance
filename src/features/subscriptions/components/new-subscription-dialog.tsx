"use client";

import { useActionState, useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { createSubscriptionAction } from "@/features/subscriptions/actions/subscriptions.actions";
import { getSubscriptionFormOptionsAction } from "@/features/subscriptions/actions/get-subscription-form-options.action";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { FREQUENCY_LABELS } from "@/features/subscriptions/types/subscription.types";
import type { ActionResult } from "@/types/action-result";
import type { AccountOption, CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";

const initialState: ActionResult = { ok: false, error: "" };
const today = () => format(new Date(), "yyyy-MM-dd");

export function NewSubscriptionDialog() {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [autoTrack, setAutoTrack] = useState(false);
  const [state, formAction, isPending] = useActionState(createSubscriptionAction, initialState);
  useActionFeedback(state, { successMessage: "Suscripción creada", onSuccess: () => setOpen(false) });

  useEffect(() => {
    if (open && categories.length === 0) {
      getSubscriptionFormOptionsAction().then((options) => {
        setAccounts(options.accounts);
        setCategories(options.categories);
      });
    }
  }, [open, categories.length]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nueva suscripción
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nueva suscripción" description="Registra un servicio recurrente para ver su costo real.">
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="sub-name">Nombre</Label>
            <Input id="sub-name" name="name" required placeholder="Netflix, Spotify, ChatGPT Plus, gimnasio..." />
            <FieldError>{state.ok === false ? state.fieldErrors?.name?.[0] : undefined}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-provider">Proveedor (opcional)</Label>
            <Input id="sub-provider" name="provider" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-amount">Monto por ciclo</Label>
              <Input id="sub-amount" name="amount" inputMode="decimal" required placeholder="44.90" />
              <FieldError>{state.ok === false ? state.fieldErrors?.amount?.[0] : undefined}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-frequency">Frecuencia</Label>
              <Select id="sub-frequency" name="frequency" defaultValue="MONTHLY" required>
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-next">Próximo cobro</Label>
            <Input id="sub-next" name="nextPaymentDate" type="date" defaultValue={today()} required />
            <FieldError>{state.ok === false ? state.fieldErrors?.nextPaymentDate?.[0] : undefined}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-category">Categoría{autoTrack ? "" : " (opcional)"}</Label>
            <Select id="sub-category" name="categoryId" defaultValue="" required={autoTrack}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <FieldError>{state.ok === false ? state.fieldErrors?.categoryId?.[0] : undefined}</FieldError>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="sub-auto-track"
              name="autoTrackAsExpense"
              type="checkbox"
              value="true"
              checked={autoTrack}
              onChange={(e) => setAutoTrack(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="sub-auto-track">Registrar automáticamente como gasto en Transacciones</Label>
          </div>

          {autoTrack ? (
            <div className="space-y-1.5">
              <Label htmlFor="sub-account">Cuenta de cobro</Label>
              <Select id="sub-account" name="accountId" defaultValue="" required={autoTrack}>
                <option value="" disabled>
                  Selecciona una cuenta...
                </option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
              <FieldError>{state.ok === false ? state.fieldErrors?.accountId?.[0] : undefined}</FieldError>
              <p className="text-xs text-muted-foreground">
                Cada vez que llegue la fecha de cobro, se registrará el gasto solo — sin que tengas que anotarlo a mano.
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="sub-notes">Notas (opcional)</Label>
            <Input id="sub-notes" name="notes" />
          </div>

          {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Crear suscripción
          </Button>
        </form>
      </Dialog>
    </>
  );
}
