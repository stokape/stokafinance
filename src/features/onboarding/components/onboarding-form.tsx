"use client";

import { useActionState } from "react";
import { completeOnboardingAction } from "@/features/onboarding/actions/onboarding.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { ACCOUNT_TYPE_LABELS } from "@/features/accounts/types/account.types";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

export function OnboardingForm({ defaultFullName }: { defaultFullName: string }) {
  const [state, formAction, isPending] = useActionState(completeOnboardingAction, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Sobre ti</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" name="fullName" defaultValue={defaultFullName} required />
            <FieldError>{state.ok === false ? state.fieldErrors?.fullName?.[0] : undefined}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Moneda</Label>
            <Input id="currency" name="currency" defaultValue="PEN" maxLength={3} required />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Tu primera cuenta</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="accountName">Nombre de la cuenta</Label>
            <Input id="accountName" name="accountName" placeholder="BCP Cuenta Sueldo" required />
            <FieldError>{state.ok === false ? state.fieldErrors?.accountName?.[0] : undefined}</FieldError>
          </div>
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
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="initialBalance">Saldo inicial</Label>
          <Input id="initialBalance" name="initialBalance" inputMode="decimal" defaultValue="0" required />
          <FieldError>{state.ok === false ? state.fieldErrors?.initialBalance?.[0] : undefined}</FieldError>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Opcional</h2>
        <div className="space-y-1.5">
          <Label htmlFor="monthlyIncomeEstimate">Ingreso mensual estimado</Label>
          <Input id="monthlyIncomeEstimate" name="monthlyIncomeEstimate" inputMode="decimal" placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="primaryGoal">Objetivo principal</Label>
          <Input id="primaryGoal" name="primaryGoal" placeholder="Fondo de emergencia, viaje, ahorrar más..." />
        </div>
      </section>

      {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

      <Button type="submit" className="w-full" isLoading={isPending}>
        Empezar a usar STOKA Finance
      </Button>
    </form>
  );
}
