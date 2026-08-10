"use client";

import { useActionState } from "react";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { payCreditCardAction } from "@/features/credit-cards/actions/credit-cards.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/types/action-result";
import type { AccountOption } from "@/features/transactions/components/quick-add-transaction-menu";

const initialState: ActionResult = { ok: false, error: "" };
const today = () => format(new Date(), "yyyy-MM-dd");

interface CardPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  creditCardId: string;
  currentDebt: string;
  accounts: AccountOption[];
}

export function CardPaymentDialog({ open, onClose, creditCardId, currentDebt, accounts }: CardPaymentDialogProps) {
  const [state, formAction, isPending] = useActionState(payCreditCardAction, initialState);
  useActionFeedback(state, { successMessage: "Pago registrado", onSuccess: onClose });

  return (
    <Dialog open={open} onClose={onClose} title="Pagar tarjeta" description="Reduce la deuda; no se cuenta como un gasto nuevo.">
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="creditCardId" value={creditCardId} />

        <div className="space-y-1.5">
          <Label htmlFor="pay-account">Cuenta de origen</Label>
          <Select id="pay-account" name="accountId" required defaultValue="">
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Monto a pagar</Label>
            <Input id="pay-amount" name="amount" inputMode="decimal" required defaultValue={currentDebt} />
            <FieldError>{state.ok === false ? state.fieldErrors?.amount?.[0] : undefined}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay-date">Fecha</Label>
            <Input id="pay-date" name="paymentDate" type="date" defaultValue={today()} required />
          </div>
        </div>

        {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

        <Button type="submit" className="w-full" isLoading={isPending}>
          Registrar pago
        </Button>
      </form>
    </Dialog>
  );
}
