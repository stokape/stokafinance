"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { resetMyDataAction } from "@/features/settings/actions/danger-zone.actions";
import { RESET_CONFIRMATION_WORD } from "@/features/settings/constants";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

export function ResetDataDialog() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, formAction, isPending] = useActionState(resetMyDataAction, initialState);

  useEffect(() => {
    if (!state.ok) return;
    // Todo se borró: recarga completa (no router.push) para que ningún dato
    // en memoria del cliente (queries ya resueltas, estado de componentes)
    // sobreviva al reset.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa intencional, ver comentario arriba.
    window.location.href = "/dashboard";
  }, [state]);

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Reiniciar todos mis datos
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="¿Reiniciar todos tus datos?"
        description="Se borran cuentas, movimientos, tarjetas, préstamos, presupuestos, metas y todo lo demás. Tu cuenta y tu login se mantienen — no tienes que registrarte de nuevo. Esta acción no se puede deshacer."
      >
        <form action={formAction} className="space-y-4" noValidate>
          <div className="flex gap-2 rounded-md border border-danger/30 bg-danger-bg p-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>Antes de continuar, considera descargar tus datos desde &ldquo;Tus datos&rdquo; en Configuración.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reset-confirmation">
              Escribe <span className="font-mono font-semibold">{RESET_CONFIRMATION_WORD}</span> para confirmar
            </Label>
            <Input
              id="reset-confirmation"
              name="confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
            />
            <FieldError>{state.ok === false ? state.error : undefined}</FieldError>
          </div>

          <Button type="submit" variant="danger" className="w-full" isLoading={isPending} disabled={confirmation !== RESET_CONFIRMATION_WORD}>
            Sí, borrar todos mis datos
          </Button>
        </form>
      </Dialog>
    </>
  );
}
