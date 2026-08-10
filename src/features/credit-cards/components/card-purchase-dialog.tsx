"use client";

import { useActionState } from "react";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { createCardPurchaseAction } from "@/features/credit-cards/actions/credit-cards.actions";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/types/action-result";
import type { CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";

const initialState: ActionResult = { ok: false, error: "" };
const today = () => format(new Date(), "yyyy-MM-dd");

interface CardPurchaseDialogProps {
  open: boolean;
  onClose: () => void;
  creditCardId: string;
  categories: CategoryOption[];
}

export function CardPurchaseDialog({ open, onClose, creditCardId, categories }: CardPurchaseDialogProps) {
  const [state, formAction, isPending] = useActionState(createCardPurchaseAction, initialState);
  useActionFeedback(state, { successMessage: "Compra registrada", onSuccess: onClose });

  return (
    <Dialog open={open} onClose={onClose} title="Nueva compra" description="Sube la deuda de la tarjeta desde la fecha de compra.">
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="creditCardId" value={creditCardId} />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cp-amount">Monto</Label>
            <Input id="cp-amount" name="amount" inputMode="decimal" required placeholder="0.00" />
            <FieldError>{state.ok === false ? state.fieldErrors?.amount?.[0] : undefined}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-date">Fecha</Label>
            <Input id="cp-date" name="purchaseDate" type="date" defaultValue={today()} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cp-category">Categoría</Label>
          <Select id="cp-category" name="categoryId" required defaultValue="">
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <FieldError>{state.ok === false ? state.fieldErrors?.categoryId?.[0] : undefined}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cp-description">Descripción</Label>
          <Input id="cp-description" name="description" required placeholder="Laptop, cena, pasajes..." />
          <FieldError>{state.ok === false ? state.fieldErrors?.description?.[0] : undefined}</FieldError>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cp-merchant">Comercio (opcional)</Label>
            <Input id="cp-merchant" name="merchant" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-installments">Cuotas</Label>
            <Input id="cp-installments" name="installments" type="number" min={1} max={60} defaultValue={1} required />
            <FieldError>{state.ok === false ? state.fieldErrors?.installments?.[0] : undefined}</FieldError>
          </div>
        </div>

        {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

        <Button type="submit" className="w-full" isLoading={isPending}>
          Registrar compra
        </Button>
      </form>
    </Dialog>
  );
}
