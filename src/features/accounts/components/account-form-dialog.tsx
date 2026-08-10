"use client";

import { useActionState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { createAccountAction } from "@/features/accounts/actions/accounts.actions";
import { ACCOUNT_TYPE_LABELS } from "@/features/accounts/types/account.types";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

interface AccountFormDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AccountFormDialog({ open, onClose }: AccountFormDialogProps) {
  const [state, formAction, isPending] = useActionState(createAccountAction, initialState);
  useActionFeedback(state, { successMessage: "Cuenta creada", onSuccess: onClose });

  return (
    <Dialog open={open} onClose={onClose} title="Nueva cuenta" description="Registra una cuenta bancaria, billetera o efectivo.">
      <form action={formAction} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required placeholder="BCP Cuenta Sueldo" />
          <FieldError>{state.ok === false ? state.fieldErrors?.name?.[0] : undefined}</FieldError>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="accountType">Tipo</Label>
            <Select id="accountType" name="accountType" defaultValue="CHECKING" required>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Moneda</Label>
            <Input id="currency" name="currency" defaultValue="PEN" maxLength={3} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="institution">Institución (opcional)</Label>
          <Input id="institution" name="institution" placeholder="BCP, BBVA, Yape..." />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="initialBalance">Saldo inicial</Label>
          <Input id="initialBalance" name="initialBalance" inputMode="decimal" defaultValue="0" required />
          <FieldError>{state.ok === false ? state.fieldErrors?.initialBalance?.[0] : undefined}</FieldError>
        </div>

        {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending}>
            Crear cuenta
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
