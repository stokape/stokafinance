"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils/money";
import { BillUrgencyBadge } from "./bill-urgency-badge";
import { MarkBillPaidDialog } from "./mark-bill-paid-dialog";
import { getBillFormOptionsAction } from "@/features/bills/actions/get-bill-form-options.action";
import { cancelBillAction } from "@/features/bills/actions/bills.actions";
import type { AccountOption } from "@/features/transactions/components/quick-add-transaction-menu";
import type { BillWithUrgency } from "@/features/bills/types/bill.types";

export function BillRow({ bill }: { bill: BillWithUrgency }) {
  const [payOpen, setPayOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function openPayDialog() {
    if (!loaded) {
      const options = await getBillFormOptionsAction();
      setAccounts(options.accounts);
      setLoaded(true);
    }
    setPayOpen(true);
  }

  function handleCancel() {
    if (!confirm(`¿Cancelar "${bill.name}"?`)) return;
    startTransition(async () => {
      const result = await cancelBillAction(bill.id);
      if (result.ok) toast.success("Pago cancelado");
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{bill.name}</p>
          <BillUrgencyBadge urgency={bill.urgency} />
          {bill.recurring ? <span className="text-xs text-muted-foreground">· recurrente</span> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Vence {bill.dueDate}
          {bill.categoryName ? ` · ${bill.categoryName}` : ""}
          {bill.provider ? ` · ${bill.provider}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{formatMoney(bill.amount, bill.currency)}</span>
        <Button size="sm" variant="outline" onClick={openPayDialog}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Marcar pagado
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending} aria-label={`Cancelar ${bill.name}`}>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <MarkBillPaidDialog open={payOpen} onClose={() => setPayOpen(false)} billId={bill.id} billName={bill.name} accounts={accounts} />
    </div>
  );
}
