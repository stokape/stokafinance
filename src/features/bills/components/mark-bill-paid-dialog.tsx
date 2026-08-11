"use client";

import { useActionState } from "react";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { markBillPaidAction } from "@/features/bills/actions/bills.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/types/action-result";
import type { AccountOption } from "@/features/transactions/components/quick-add-transaction-menu";

const initialState: ActionResult = { ok: false, error: "" };
const today = () => format(new Date(), "yyyy-MM-dd");

interface MarkBillPaidDialogProps {
  open: boolean;
  onClose: () => void;
  billId: string;
  billName: string;
  accounts: AccountOption[];
}

export function MarkBillPaidDialog({ open, onClose, billId, billName, accounts }: MarkBillPaidDialogProps) {
  const [state, formAction, isPending] = useActionState(markBillPaidAction, initialState);
  useActionFeedback(state, { successMessage: "Pago marcado como pagado", onSuccess: onClose });

  return (
    <Dialog open={open} onClose={onClose} title="Marcar como pagado" description={`Genera el movimiento correspondiente a "${billName}".`}>
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="billId" value={billId} />

        <div className="space-y-1.5">
          <Label htmlFor="mp-account">Cuenta de origen</Label>
          <Select id="mp-account" name="accountId" required defaultValue="">
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

        <div className="space-y-1.5">
          <Label htmlFor="mp-date">Fecha de pago</Label>
          <Input id="mp-date" name="paymentDate" type="date" defaultValue={today()} required />
        </div>

        {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

        <Button type="submit" className="w-full" isLoading={isPending}>
          Confirmar pago
        </Button>
      </form>
    </Dialog>
  );
}
