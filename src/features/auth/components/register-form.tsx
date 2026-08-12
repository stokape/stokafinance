"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { registerAction } from "@/features/auth/actions/auth.actions";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult<{ needsEmailConfirmation: boolean }> = { ok: false, error: "" };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  if (state.ok && state.data.needsEmailConfirmation) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
        <p className="font-medium">Revisa tu correo</p>
        <p className="text-sm text-muted-foreground">
          Te enviamos un enlace de confirmación. Ábrelo para activar tu cuenta y comenzar a usar STOKA Finance.
        </p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input id="fullName" name="fullName" autoComplete="name" required placeholder="Tu nombre" />
          <FieldError>{state.ok === false ? state.fieldErrors?.fullName?.[0] : undefined}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" />
          <FieldError>{state.ok === false ? state.fieldErrors?.email?.[0] : undefined}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
          <FieldError>{state.ok === false ? state.fieldErrors?.password?.[0] : undefined}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
          <FieldError>{state.ok === false ? state.fieldErrors?.confirmPassword?.[0] : undefined}</FieldError>
        </div>

        {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

        <Button type="submit" className="w-full" isLoading={isPending}>
          Crear cuenta
        </Button>
      </form>

      <OAuthButtons providers={["google"]} />

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
