"use client";

import { useActionState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { createCreditCardAction } from "@/features/credit-cards/actions/credit-cards.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

export function NewCreditCardDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createCreditCardAction, initialState);
  useActionFeedback(state, { successMessage: "Tarjeta creada", onSuccess: onClose });

  return (
    <Dialog open={open} onClose={onClose} title="Nueva tarjeta de crédito" description="Registra tu tarjeta para controlar tu deuda.">
      <form action={formAction} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="cc-name">Nombre</Label>
          <Input id="cc-name" name="name" required placeholder="Visa BCP" />
          <FieldError>{state.ok === false ? state.fieldErrors?.name?.[0] : undefined}</FieldError>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cc-bank">Banco</Label>
            <Input id="cc-bank" name="bank" required placeholder="BCP" />
            <FieldError>{state.ok === false ? state.fieldErrors?.bank?.[0] : undefined}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cc-brand">Marca (opcional)</Label>
            <Input id="cc-brand" name="brand" placeholder="Visa, Mastercard..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cc-last4">Últimos 4 dígitos (opcional)</Label>
            <Input id="cc-last4" name="lastFourDigits" maxLength={4} placeholder="1234" />
            <FieldError>{state.ok === false ? state.fieldErrors?.lastFourDigits?.[0] : undefined}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cc-currency">Moneda</Label>
            <Input id="cc-currency" name="currency" defaultValue="PEN" maxLength={3} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cc-limit">Línea de crédito</Label>
          <Input id="cc-limit" name="creditLimit" inputMode="decimal" required placeholder="5000.00" />
          <FieldError>{state.ok === false ? state.fieldErrors?.creditLimit?.[0] : undefined}</FieldError>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cc-closing">Día de cierre</Label>
            <Input id="cc-closing" name="closingDay" type="number" min={1} max={31} required placeholder="25" />
            <FieldError>{state.ok === false ? state.fieldErrors?.closingDay?.[0] : undefined}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cc-payment">Día de pago</Label>
            <Input id="cc-payment" name="paymentDay" type="number" min={1} max={31} required placeholder="5" />
            <FieldError>{state.ok === false ? state.fieldErrors?.paymentDay?.[0] : undefined}</FieldError>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cc-rate">Tasa de interés anual % (opcional)</Label>
          <Input id="cc-rate" name="annualInterestRate" inputMode="decimal" placeholder="45.00" />
        </div>

        {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending}>
            Crear tarjeta
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
