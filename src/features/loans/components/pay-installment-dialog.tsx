"use client";

import { useActionState } from "react";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils/money";
import { payLoanInstallmentAction } from "@/features/loans/actions/loans.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/types/action-result";
import type { AccountOption } from "@/features/transactions/components/quick-add-transaction-menu";
import type { LoanInstallment } from "@/features/loans/types/loan.types";

const initialState: ActionResult = { ok: false, error: "" };
const today = () => format(new Date(), "yyyy-MM-dd");

interface PayInstallmentDialogProps {
  open: boolean;
  onClose: () => void;
  loanId: string;
  currency: string;
  nextInstallment: LoanInstallment | null;
  accounts: AccountOption[];
}

export function PayInstallmentDialog({ open, onClose, loanId, currency, nextInstallment, accounts }: PayInstallmentDialogProps) {
  const [state, formAction, isPending] = useActionState(payLoanInstallmentAction, initialState);
  useActionFeedback(state, { successMessage: "Cuota pagada", onSuccess: onClose });

  return (
    <Dialog open={open} onClose={onClose} title="Pagar cuota" description="Separa capital e interés automáticamente.">
      {!nextInstallment ? (
        <p className="text-sm text-muted-foreground">Este préstamo ya está completamente pagado.</p>
      ) : (
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="loanId" value={loanId} />

          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">Cuota {nextInstallment.installmentNumber}</p>
            <p className="text-muted-foreground">
              Capital {formatMoney(nextInstallment.principalAmount, currency)} + Interés{" "}
              {formatMoney(nextInstallment.interestAmount, currency)} ={" "}
              <span className="font-medium text-foreground">{formatMoney(nextInstallment.totalAmount, currency)}</span>
            </p>
            <p className="text-muted-foreground">Vence: {nextInstallment.dueDate}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-loan-account">Cuenta de origen</Label>
            <Select id="pay-loan-account" name="accountId" required defaultValue="">
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
            <Label htmlFor="pay-loan-date">Fecha de pago</Label>
            <Input id="pay-loan-date" name="paymentDate" type="date" defaultValue={today()} required />
          </div>

          {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Registrar pago
          </Button>
        </form>
      )}
    </Dialog>
  );
}
