"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { createLiabilityAction } from "@/features/net-worth/actions/net-worth.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { LIABILITY_TYPE_LABELS } from "@/features/net-worth/types/net-worth.types";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

export function NewLiabilityDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createLiabilityAction, initialState);
  useActionFeedback(state, { successMessage: "Pasivo registrado", onSuccess: () => setOpen(false) });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Nuevo pasivo
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nuevo pasivo" description="Hipoteca, deuda informal, otras obligaciones...">
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="liability-name">Nombre</Label>
            <Input id="liability-name" name="name" required placeholder="Hipoteca, deuda familiar..." />
            <FieldError>{state.ok === false ? state.fieldErrors?.name?.[0] : undefined}</FieldError>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="liability-type">Tipo</Label>
              <Select id="liability-type" name="liabilityType" defaultValue="OTHER">
                {Object.entries(LIABILITY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="liability-balance">Saldo actual</Label>
              <Input id="liability-balance" name="currentBalance" inputMode="decimal" required placeholder="0.00" />
              <FieldError>{state.ok === false ? state.fieldErrors?.currentBalance?.[0] : undefined}</FieldError>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="liability-currency">Moneda</Label>
            <Input id="liability-currency" name="currency" defaultValue="PEN" maxLength={3} required />
          </div>

          {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Registrar pasivo
          </Button>
        </form>
      </Dialog>
    </>
  );
}
