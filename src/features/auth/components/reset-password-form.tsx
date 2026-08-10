"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/features/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <FieldError>{state.ok === false ? state.fieldErrors?.password?.[0] : undefined}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        <FieldError>{state.ok === false ? state.fieldErrors?.confirmPassword?.[0] : undefined}</FieldError>
      </div>

      {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

      <Button type="submit" className="w-full" isLoading={isPending}>
        Guardar nueva contraseña
      </Button>
    </form>
  );
}
