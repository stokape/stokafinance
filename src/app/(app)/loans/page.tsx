import type { Metadata } from "next";
import { Landmark } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoansService } from "@/features/loans/services/loans.service";
import { LoanCard } from "@/features/loans/components/loan-card";
import { NewLoanDialog } from "@/features/loans/components/new-loan-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatMoney, sumMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Deudas" };

export default async function LoansPage() {
  const supabase = await createSupabaseServerClient();
  const service = new LoansService(supabase);
  const loans = await service.listLoans();

  const nextInstallments = await Promise.all(loans.map((loan) => service.getNextPendingInstallment(loan.id)));
  const totalBalance = sumMoney(loans.map((l) => l.currentBalance));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Deudas</h1>
          {loans.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Saldo pendiente total: <span className="font-medium text-foreground">{formatMoney(totalBalance)}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Controla tus préstamos, cuotas y cuánto te falta pagar.</p>
          )}
        </div>
        <NewLoanDialog />
      </div>

      {loans.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Aún no tienes préstamos registrados"
          description="Registra un préstamo para generar su calendario de cuotas y controlar cuánto debes."
          action={<NewLoanDialog />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map((loan, index) => (
            <LoanCard key={loan.id} loan={loan} nextInstallment={nextInstallments[index]} />
          ))}
        </div>
      )}
    </div>
  );
}
