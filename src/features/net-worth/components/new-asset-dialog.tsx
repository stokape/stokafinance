"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { createAssetAction } from "@/features/net-worth/actions/net-worth.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { ASSET_TYPE_LABELS } from "@/features/net-worth/types/net-worth.types";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };

export function NewAssetDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createAssetAction, initialState);
  useActionFeedback(state, { successMessage: "Activo registrado", onSuccess: () => setOpen(false) });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Nuevo activo
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nuevo activo" description="Propiedad, vehículo, inversión externa...">
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="asset-name">Nombre</Label>
            <Input id="asset-name" name="name" required placeholder="Auto, departamento, acciones..." />
            <FieldError>{state.ok === false ? state.fieldErrors?.name?.[0] : undefined}</FieldError>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="asset-type">Tipo</Label>
              <Select id="asset-type" name="assetType" defaultValue="OTHER">
                {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-value">Valor actual</Label>
              <Input id="asset-value" name="currentValue" inputMode="decimal" required placeholder="0.00" />
              <FieldError>{state.ok === false ? state.fieldErrors?.currentValue?.[0] : undefined}</FieldError>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="asset-currency">Moneda</Label>
            <Input id="asset-currency" name="currency" defaultValue="PEN" maxLength={3} required />
          </div>

          {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Registrar activo
          </Button>
        </form>
      </Dialog>
    </>
  );
}
