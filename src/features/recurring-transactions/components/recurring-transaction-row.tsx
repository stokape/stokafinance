"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import { toggleRecurringTransactionAction } from "@/features/recurring-transactions/actions/recurring-transactions.actions";
import { RECURRING_FREQUENCY_LABELS, RECURRING_TYPE_LABELS, type RecurringTransaction } from "@/features/recurring-transactions/types/recurring-transaction.types";

export function RecurringTransactionRow({ recurring }: { recurring: RecurringTransaction }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleRecurringTransactionAction(recurring.id, !recurring.active);
      if (result.ok) toast.success(recurring.active ? "Recurrencia pausada" : "Recurrencia reactivada");
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium">{recurring.description}</p>
        <p className="text-xs text-muted-foreground">
          {RECURRING_TYPE_LABELS[recurring.transactionType]} · {RECURRING_FREQUENCY_LABELS[recurring.frequency]} · próxima:{" "}
          {recurring.nextOccurrenceDate}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">{formatMoney(recurring.amount, recurring.currency)}</span>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50",
            recurring.active ? "bg-success-bg text-success" : "bg-muted text-muted-foreground",
          )}
        >
          {recurring.active ? "Activa" : "Pausada"}
        </button>
      </div>
    </div>
  );
}
