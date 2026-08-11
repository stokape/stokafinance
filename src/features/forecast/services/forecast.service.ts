import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, formatISO } from "date-fns";
import type { Database } from "@/types/database.types";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { BillsService } from "@/features/bills/services/bills.service";
import { LoansService } from "@/features/loans/services/loans.service";
import { SubscriptionsService } from "@/features/subscriptions/services/subscriptions.service";
import { forecastCashFlow, type ForecastEvent, type ForecastResult } from "@/lib/financial-engine";
import { sumMoney } from "@/lib/utils/money";

function dateOnly(date: Date): string {
  return formatISO(date, { representation: "date" });
}

/**
 * Orquesta Accounts + Bills + Loans + Subscriptions y delega la proyección
 * al Financial Engine (forecastCashFlow, ya probado). No incluye tarjetas
 * todavía: sus compras no tienen fecha de vencimiento por statement
 * modelada (requiere el ciclo de cierre/pago, roadmap Fase 7) — se
 * documenta como limitación conocida en vez de inventar una fecha (§60).
 */
export class ForecastService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getForecast(horizonDays: number): Promise<ForecastResult> {
    const accountsService = new AccountsService(this.supabase);
    const billsService = new BillsService(this.supabase);
    const loansService = new LoansService(this.supabase);
    const subscriptionsService = new SubscriptionsService(this.supabase);

    const today = new Date();
    const todayIso = dateOnly(today);
    const horizonEndIso = dateOnly(addDays(today, horizonDays));

    const [accounts, bills, loans, { subscriptions }] = await Promise.all([
      accountsService.listAccounts(),
      billsService.listUpcoming(horizonDays),
      loansService.listLoans(),
      subscriptionsService.getOverview(),
    ]);

    const currentBalance = sumMoney(accounts.map((a) => a.currentBalance));

    const events: ForecastEvent[] = [];

    for (const bill of bills) {
      events.push({ id: `bill-${bill.id}`, label: bill.name, date: bill.dueDate, amount: `-${bill.amount}`, kind: "BILL" });
    }

    const nextInstallments = await Promise.all(loans.map((loan) => loansService.getNextPendingInstallment(loan.id)));
    loans.forEach((loan, index) => {
      const installment = nextInstallments[index];
      if (installment && installment.dueDate <= horizonEndIso) {
        events.push({
          id: `loan-${loan.id}`,
          label: `${loan.lender} — cuota ${installment.installmentNumber}`,
          date: installment.dueDate,
          amount: `-${installment.totalAmount}`,
          kind: "LOAN_INSTALLMENT",
        });
      }
    });

    for (const subscription of subscriptions) {
      if (subscription.nextPaymentDate <= horizonEndIso) {
        events.push({
          id: `sub-${subscription.id}`,
          label: subscription.name,
          date: subscription.nextPaymentDate,
          amount: `-${subscription.amount}`,
          kind: "SUBSCRIPTION",
        });
      }
    }

    return forecastCashFlow(currentBalance, events, todayIso, horizonDays);
  }
}
