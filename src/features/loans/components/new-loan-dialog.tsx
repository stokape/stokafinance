"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { createLoanAction } from "@/features/loans/actions/loans.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { LOAN_PAYMENT_TYPE_LABELS, type LoanPaymentType } from "@/features/loans/types/loan.types";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };
const today = () => format(new Date(), "yyyy-MM-dd");

export function NewLoanDialog() {
  const [open, setOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<LoanPaymentType>("PRINCIPAL_AND_INTEREST");
  const [state, formAction, isPending] = useActionState(createLoanAction, initialState);
  useActionFeedback(state, { successMessage: "Préstamo creado", onSuccess: () => setOpen(false) });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nuevo préstamo
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo préstamo"
        description="Genera automáticamente el calendario de cuotas (capital + interés)."
      >
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="loan-lender">Acreedor</Label>
            <Input id="loan-lender" name="lender" required placeholder="BCP, Compartamos, familiar..." />
            <FieldError>{state.ok === false ? state.fieldErrors?.lender?.[0] : undefined}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-description">Descripción (opcional)</Label>
            <Input id="loan-description" name="description" placeholder="Préstamo personal, crédito vehicular..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loan-amount">Monto original</Label>
              <Input id="loan-amount" name="originalAmount" inputMode="decimal" required placeholder="5000.00" />
              <FieldError>{state.ok === false ? state.fieldErrors?.originalAmount?.[0] : undefined}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-currency">Moneda</Label>
              <Input id="loan-currency" name="currency" defaultValue="PEN" maxLength={3} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loan-installments">Número de cuotas</Label>
              <Input id="loan-installments" name="numberOfInstallments" type="number" min={1} max={360} required placeholder="12" />
              <FieldError>{state.ok === false ? state.fieldErrors?.numberOfInstallments?.[0] : undefined}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-rate">Tasa anual % (opcional)</Label>
              <Input id="loan-rate" name="interestRate" inputMode="decimal" placeholder="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-payment-type">Tipo de pago</Label>
            <Select
              id="loan-payment-type"
              name="paymentType"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as LoanPaymentType)}
            >
              {Object.entries(LOAN_PAYMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              {paymentType === "INTEREST_ONLY"
                ? "Cada cuota es sólo interés — el capital completo se paga en la última cuota. Común en préstamos familiares/informales."
                : "Cada cuota incluye una parte de capital y una de interés (se amortiza desde la primera cuota)."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-installment-amount">Monto de cuota (opcional, si ya lo sabes)</Label>
            <Input id="loan-installment-amount" name="installmentAmount" inputMode="decimal" placeholder="Se calcula solo desde la tasa si lo dejas vacío" />
            <p className="text-xs text-muted-foreground">
              {paymentType === "INTEREST_ONLY"
                ? "El interés que pagas cada mes, si ya lo tienes acordado — así no necesitas declarar una tasa."
                : "La cuota fija que pagas cada mes, si ya la conoces — reemplaza el cálculo automático desde la tasa."}
            </p>
            <FieldError>{state.ok === false ? state.fieldErrors?.installmentAmount?.[0] : undefined}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-start">Fecha de la primera cuota</Label>
            <Input id="loan-start" name="startDate" type="date" defaultValue={today()} required />
            <FieldError>{state.ok === false ? state.fieldErrors?.startDate?.[0] : undefined}</FieldError>
          </div>

          {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Crear préstamo
          </Button>
        </form>
      </Dialog>
    </>
  );
}
