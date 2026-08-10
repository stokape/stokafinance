"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import {
  createExpenseAction,
  createIncomeAction,
  createTransferAction,
} from "@/features/transactions/actions/transactions.actions";
import type { ActionResult } from "@/types/action-result";
import type { AccountOption, CategoryOption } from "./quick-add-transaction-menu";

type TransactionMode = "EXPENSE" | "INCOME" | "TRANSFER";

interface TransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  initialMode: TransactionMode;
  accounts: AccountOption[];
  categories: CategoryOption[];
}

const initialState: ActionResult = { ok: false, error: "" };
const today = () => format(new Date(), "yyyy-MM-dd");

const TABS: { value: TransactionMode; label: string }[] = [
  { value: "EXPENSE", label: "Gasto" },
  { value: "INCOME", label: "Ingreso" },
  { value: "TRANSFER", label: "Transferencia" },
];

export function TransactionFormDialog({ open, onClose, initialMode, accounts, categories }: TransactionFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Nuevo movimiento" description="Registra un gasto, ingreso o transferencia.">
      {/* key={initialMode}: al elegir otra opción del menú rápido, esta rama se
          remonta con el tab correcto en vez de sincronizar el estado con un
          efecto (evita setState síncrono dentro de useEffect). */}
      <TransactionFormTabs key={initialMode} initialMode={initialMode} accounts={accounts} categories={categories} onClose={onClose} />
    </Dialog>
  );
}

function TransactionFormTabs({
  initialMode,
  accounts,
  categories,
  onClose,
}: {
  initialMode: TransactionMode;
  accounts: AccountOption[];
  categories: CategoryOption[];
  onClose: () => void;
}) {
  const [mode, setMode] = useState<TransactionMode>(initialMode);

  return (
    <>
      <div className="mb-4 flex gap-1 rounded-md bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setMode(tab.value)}
            className={cn(
              "flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors",
              mode === tab.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "EXPENSE" ? (
        <ExpenseForm accounts={accounts} categories={categories} onDone={onClose} />
      ) : mode === "INCOME" ? (
        <IncomeForm accounts={accounts} categories={categories} onDone={onClose} />
      ) : (
        <TransferForm accounts={accounts} onDone={onClose} />
      )}
    </>
  );
}

function ExpenseForm({ accounts, categories, onDone }: { accounts: AccountOption[]; categories: CategoryOption[]; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(createExpenseAction, initialState);
  useActionFeedback(state, { successMessage: "Gasto registrado", onSuccess: onDone });
  const expenseCategories = categories.filter((c) => c.categoryType === "EXPENSE");

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="exp-amount">Monto</Label>
          <Input id="exp-amount" name="amount" inputMode="decimal" required placeholder="0.00" />
          <FieldError>{state.ok === false ? state.fieldErrors?.amount?.[0] : undefined}</FieldError>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-date">Fecha</Label>
          <Input id="exp-date" name="transactionDate" type="date" defaultValue={today()} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exp-account">Cuenta</Label>
        <Select id="exp-account" name="accountId" required defaultValue="">
          <option value="" disabled>
            Selecciona una cuenta
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <FieldError>{state.ok === false ? state.fieldErrors?.accountId?.[0] : undefined}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exp-category">Categoría</Label>
        <Select id="exp-category" name="categoryId" required defaultValue="">
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <FieldError>{state.ok === false ? state.fieldErrors?.categoryId?.[0] : undefined}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exp-description">Descripción</Label>
        <Input id="exp-description" name="description" required placeholder="Almuerzo, taxi, supermercado..." />
        <FieldError>{state.ok === false ? state.fieldErrors?.description?.[0] : undefined}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exp-merchant">Comercio (opcional)</Label>
        <Input id="exp-merchant" name="merchant" />
      </div>

      {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

      <Button type="submit" className="w-full" isLoading={isPending}>
        Registrar gasto
      </Button>
    </form>
  );
}

function IncomeForm({ accounts, categories, onDone }: { accounts: AccountOption[]; categories: CategoryOption[]; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(createIncomeAction, initialState);
  useActionFeedback(state, { successMessage: "Ingreso registrado", onSuccess: onDone });
  const incomeCategories = categories.filter((c) => c.categoryType === "INCOME");

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="inc-amount">Monto</Label>
          <Input id="inc-amount" name="amount" inputMode="decimal" required placeholder="0.00" />
          <FieldError>{state.ok === false ? state.fieldErrors?.amount?.[0] : undefined}</FieldError>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inc-date">Fecha</Label>
          <Input id="inc-date" name="transactionDate" type="date" defaultValue={today()} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inc-account">Cuenta</Label>
        <Select id="inc-account" name="accountId" required defaultValue="">
          <option value="" disabled>
            Selecciona una cuenta
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <FieldError>{state.ok === false ? state.fieldErrors?.accountId?.[0] : undefined}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inc-category">Categoría</Label>
        <Select id="inc-category" name="categoryId" required defaultValue="">
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {incomeCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <FieldError>{state.ok === false ? state.fieldErrors?.categoryId?.[0] : undefined}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inc-description">Descripción</Label>
        <Input id="inc-description" name="description" required placeholder="Sueldo, freelance, bono..." />
        <FieldError>{state.ok === false ? state.fieldErrors?.description?.[0] : undefined}</FieldError>
      </div>

      {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

      <Button type="submit" className="w-full" isLoading={isPending}>
        Registrar ingreso
      </Button>
    </form>
  );
}

function TransferForm({ accounts, onDone }: { accounts: AccountOption[]; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(createTransferAction, initialState);
  useActionFeedback(state, { successMessage: "Transferencia registrada", onSuccess: onDone });

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tr-from">Cuenta origen</Label>
          <Select id="tr-from" name="accountId" required defaultValue="">
            <option value="" disabled>
              Origen
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tr-to">Cuenta destino</Label>
          <Select id="tr-to" name="destinationAccountId" required defaultValue="">
            <option value="" disabled>
              Destino
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <FieldError>{state.ok === false ? state.fieldErrors?.destinationAccountId?.[0] : undefined}</FieldError>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tr-amount">Monto</Label>
          <Input id="tr-amount" name="amount" inputMode="decimal" required placeholder="0.00" />
          <FieldError>{state.ok === false ? state.fieldErrors?.amount?.[0] : undefined}</FieldError>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tr-date">Fecha</Label>
          <Input id="tr-date" name="transactionDate" type="date" defaultValue={today()} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tr-description">Descripción (opcional)</Label>
        <Input id="tr-description" name="description" placeholder="Transferencia entre cuentas" />
      </div>

      {state.ok === false && state.error ? <FieldError>{state.error}</FieldError> : null}

      <Button type="submit" className="w-full" isLoading={isPending}>
        Registrar transferencia
      </Button>
    </form>
  );
}
