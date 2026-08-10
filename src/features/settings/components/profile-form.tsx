"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/features/settings/actions/profile.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

interface ProfileFormProps {
  fullName: string;
  currency: string;
  timezone: string;
  monthlyIncomeEstimate: string;
}

export function ProfileForm({ fullName, currency, timezone, monthlyIncomeEstimate }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);
  useActionFeedback(state, { successMessage: "Perfil actualizado" });

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input id="fullName" name="fullName" defaultValue={fullName} required />
          <FieldError>{state.ok === false ? state.fieldErrors?.fullName?.[0] : undefined}</FieldError>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Moneda</Label>
          <Input id="currency" name="currency" defaultValue={currency} maxLength={3} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="timezone">Zona horaria</Label>
          <Input id="timezone" name="timezone" defaultValue={timezone} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="monthlyIncomeEstimate">Ingreso mensual estimado</Label>
          <Input id="monthlyIncomeEstimate" name="monthlyIncomeEstimate" inputMode="decimal" defaultValue={monthlyIncomeEstimate} />
        </div>
      </div>
      {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}
      <Button type="submit" isLoading={isPending}>
        Guardar cambios
      </Button>
    </form>
  );
}
