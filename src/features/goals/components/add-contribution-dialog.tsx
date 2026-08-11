"use client";

import { useActionState } from "react";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { addContributionAction } from "@/features/goals/actions/goals.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/types/action-result";

const initialState: ActionResult = { ok: false, error: "" };
const today = () => format(new Date(), "yyyy-MM-dd");

interface AddContributionDialogProps {
  open: boolean;
  onClose: () => void;
  goalId: string;
  goalName: string;
}

export function AddContributionDialog({ open, onClose, goalId, goalName }: AddContributionDialogProps) {
  const [state, formAction, isPending] = useActionState(addContributionAction, initialState);
  useActionFeedback(state, { successMessage: "Aporte registrado", onSuccess: onClose });

  return (
    <Dialog open={open} onClose={onClose} title="Agregar aporte" description={`Suma un aporte a "${goalName}".`}>
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="goalId" value={goalId} />

        <div className="space-y-1.5">
          <Label htmlFor="contrib-amount">Monto</Label>
          <Input id="contrib-amount" name="amount" inputMode="decimal" required placeholder="0.00" />
          <FieldError>{state.ok === false ? state.fieldErrors?.amount?.[0] : undefined}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contrib-date">Fecha</Label>
          <Input id="contrib-date" name="contributionDate" type="date" defaultValue={today()} required />
        </div>

        {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

        <Button type="submit" className="w-full" isLoading={isPending}>
          Registrar aporte
        </Button>
      </form>
    </Dialog>
  );
}
