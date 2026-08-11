import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, CircleAlert } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoansService } from "@/features/loans/services/loans.service";
import { LOAN_STATUS_LABELS } from "@/features/loans/types/loan.types";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Detalle de préstamo" };

interface LoanDetailPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_ICON = { PENDING: Circle, PAID: CheckCircle2, OVERDUE: CircleAlert } as const;
const STATUS_LABEL = { PENDING: "Pendiente", PAID: "Pagada", OVERDUE: "Atrasada" } as const;

export default async function LoanDetailPage({ params }: LoanDetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const service = new LoansService(supabase);

  const [loan, installments] = await Promise.all([service.getLoan(id), service.listInstallments(id)]);
  if (!loan) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/loans" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a deudas
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{loan.lender}</h1>
        <p className="text-sm text-muted-foreground">
          {loan.description || "Préstamo"} · {LOAN_STATUS_LABELS[loan.status]}
          {loan.interestRate ? ` · ${loan.interestRate}% anual` : ""}
        </p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Saldo pendiente</p>
            <p className="text-lg font-semibold">{formatMoney(loan.currentBalance, loan.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monto original</p>
            <p className="text-lg font-semibold">{formatMoney(loan.originalAmount, loan.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cuotas pagadas</p>
            <p className="text-lg font-semibold">
              {loan.installmentsPaid}/{loan.installmentsPaid + loan.installmentsRemaining}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Amortizado</p>
            <p className="text-lg font-semibold">{loan.percentageAmortized.toFixed(0)}%</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Calendario de cuotas</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Vencimiento</th>
                <th className="px-4 py-2.5 text-right">Capital</th>
                <th className="px-4 py-2.5 text-right">Interés</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((installment) => {
                const StatusIcon = STATUS_ICON[installment.status];
                return (
                  <tr key={installment.id} className={cn("border-b border-border last:border-0", installment.status === "PAID" && "opacity-60")}>
                    <td className="px-4 py-2 text-muted-foreground">{installment.installmentNumber}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                      {format(parseISO(installment.dueDate), "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-4 py-2 text-right">{formatMoney(installment.principalAmount, loan.currency)}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{formatMoney(installment.interestAmount, loan.currency)}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatMoney(installment.totalAmount, loan.currency)}</td>
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <StatusIcon className="h-3.5 w-3.5" /> {STATUS_LABEL[installment.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
