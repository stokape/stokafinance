"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreVertical, XCircle, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils/money";
import { PayInstallmentDialog } from "./pay-installment-dialog";
import { getLoanAccountsAction } from "@/features/loans/actions/get-loan-accounts.action";
import { cancelLoanAction } from "@/features/loans/actions/loans.actions";
import { LOAN_STATUS_LABELS, type LoanInstallment, type LoanWithProgress } from "@/features/loans/types/loan.types";
import type { AccountOption } from "@/features/transactions/components/quick-add-transaction-menu";

interface LoanCardProps {
  loan: LoanWithProgress;
  nextInstallment: LoanInstallment | null;
}

export function LoanCard({ loan, nextInstallment }: LoanCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function openPayDialog() {
    if (!loaded) {
      setAccounts(await getLoanAccountsAction());
      setLoaded(true);
    }
    setPayOpen(true);
  }

  function handleCancel() {
    setMenuOpen(false);
    if (!confirm(`¿Cancelar el préstamo "${loan.lender}"? Las cuotas ya pagadas quedan en tu historial.`)) return;
    startTransition(async () => {
      const result = await cancelLoanAction(loan.id);
      if (result.ok) toast.success("Préstamo cancelado");
      else toast.error(result.error);
    });
  }

  const clampedProgress = Math.min(100, Math.max(0, loan.percentageAmortized));

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/loans/${loan.id}`} className="truncate text-sm font-medium hover:underline">
              {loan.lender}
            </Link>
            <p className="text-xs text-muted-foreground">
              {loan.description || "Préstamo"} · {LOAN_STATUS_LABELS[loan.status]}
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Más opciones"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <div role="menu" className="absolute right-0 top-9 z-20 w-48 rounded-md border border-border bg-card p-1 shadow-lg">
                <button
                  type="button"
                  role="menuitem"
                  disabled={isPending}
                  onClick={handleCancel}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Cancelar préstamo
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-xl font-semibold">{formatMoney(loan.currentBalance, loan.currency)}</p>
          <p className="text-xs text-muted-foreground">
            de {formatMoney(loan.originalAmount, loan.currency)} · {loan.installmentsPaid}/{loan.installmentsPaid + loan.installmentsRemaining}{" "}
            cuotas pagadas
          </p>
        </div>

        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${clampedProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{clampedProgress.toFixed(0)}% amortizado</p>
        </div>

        {nextInstallment ? (
          <p className="text-xs text-muted-foreground">
            Próxima cuota: {nextInstallment.dueDate} · {formatMoney(nextInstallment.totalAmount, loan.currency)}
          </p>
        ) : null}

        {loan.status === "ACTIVE" ? (
          <Button size="sm" variant="outline" className="w-full" onClick={openPayDialog}>
            <Banknote className="h-3.5 w-3.5" /> Pagar cuota
          </Button>
        ) : null}
      </CardContent>

      <PayInstallmentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        loanId={loan.id}
        currency={loan.currency}
        nextInstallment={nextInstallment}
        accounts={accounts}
      />
    </Card>
  );
}
