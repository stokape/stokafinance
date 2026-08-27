"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { deleteAccountAction } from "@/features/settings/actions/danger-zone.actions";
import { DELETE_ACCOUNT_CONFIRMATION_WORD } from "@/features/settings/constants";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

export function DeleteAccountDialog({ requiresPassword }: { requiresPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [state, formAction, isPending] = useActionState(deleteAccountAction, initialState);

  useEffect(() => {
    if (!state.ok) return;
    // La cuenta ya no existe: recarga completa a /login, no queda sesión que mantener.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa intencional: la cuenta se eliminó.
    window.location.href = "/login?closed=success";
  }, [state]);

  const canSubmit = confirmation === DELETE_ACCOUNT_CONFIRMATION_WORD && (!requiresPassword || password.length > 0);

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Cerrar mi cuenta
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="¿Cerrar tu cuenta?"
        description="Se borra absolutamente todo — tus datos y tu login. No podrás recuperar nada ni volver a entrar con este correo. No se puede deshacer."
      >
        <form action={formAction} className="space-y-4" noValidate>
          <div className="flex gap-2 rounded-md border border-danger/30 bg-danger-bg p-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>Antes de continuar, descarga tus datos desde &ldquo;Tus datos&rdquo; en Configuración — después ya no vas a poder.</p>
          </div>

          {requiresPassword ? (
            <div className="space-y-1.5">
              <Label htmlFor="delete-password">Confirma tu contraseña</Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="delete-confirmation">
              Escribe <span className="font-mono font-semibold">{DELETE_ACCOUNT_CONFIRMATION_WORD}</span> para confirmar
            </Label>
            <Input
              id="delete-confirmation"
              name="confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
            />
            <FieldError>{state.ok === false ? state.error : undefined}</FieldError>
          </div>

          <Button type="submit" variant="danger" className="w-full" isLoading={isPending} disabled={!canSubmit}>
            Sí, cerrar mi cuenta para siempre
          </Button>
        </form>
      </Dialog>
    </>
  );
}
