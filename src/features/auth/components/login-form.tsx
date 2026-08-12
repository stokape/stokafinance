"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/features/auth/actions/auth.actions";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" />
          <FieldError>{state.ok === false ? state.fieldErrors?.email?.[0] : undefined}</FieldError>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
          <FieldError>{state.ok === false ? state.fieldErrors?.password?.[0] : undefined}</FieldError>
        </div>

        {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

        <Button type="submit" className="w-full" isLoading={isPending}>
          Iniciar sesión
        </Button>
      </form>

      <OAuthButtons providers={["google"]} />

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
