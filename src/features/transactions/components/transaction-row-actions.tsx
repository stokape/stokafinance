"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { XCircle } from "lucide-react";
import { cancelTransactionAction } from "@/features/transactions/actions/transactions.actions";

export function TransactionRowActions({ transactionId, status }: { transactionId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  if (status !== "CONFIRMED") return null;

  function handleCancel() {
    if (!confirm("¿Cancelar este movimiento? No afectará tus saldos ni reportes, pero queda en el historial.")) return;
    startTransition(async () => {
      const result = await cancelTransactionAction(transactionId);
      if (result.ok) toast.success("Movimiento cancelado");
      else toast.error(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isPending}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-bg hover:text-danger disabled:opacity-50"
      aria-label="Cancelar movimiento"
      title="Cancelar movimiento"
    >
      <XCircle className="h-4 w-4" />
    </button>
  );
}
