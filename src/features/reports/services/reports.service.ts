import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { TransactionsService } from "@/features/transactions/services/transactions.service";
import { sumMoney } from "@/lib/utils/money";
import type { ReportData, ReportFilters } from "../types/report.types";

const REPORT_ROW_CAP = 3000;

/**
 * Reporte consolidado de movimientos (§30) con filtros reales sobre datos
 * ya persistidos — nunca placeholders. Los reportes por dominio (deudas,
 * tarjetas, suscripciones, patrimonio) ya viven en sus propios módulos con
 * datos en vivo; este reporte se enfoca en Movimientos/Ingresos-Gastos,
 * que es lo que no tenía una vista dedicada todavía.
 */
export class ReportsService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getReport(filters: ReportFilters): Promise<ReportData> {
    const transactionsService = new TransactionsService(this.supabase);
    const result = await transactionsService.listTransactions({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      accountId: filters.accountId,
      categoryId: filters.categoryId,
      transactionType: filters.transactionType,
      status: filters.status,
      page: 1,
      pageSize: REPORT_ROW_CAP,
    });

    const confirmed = result.items.filter((tx) => tx.status === "CONFIRMED");

    const income = confirmed.filter((tx) => tx.transactionType === "INCOME");
    const expenses = confirmed.filter((tx) => tx.transactionType === "EXPENSE" || tx.transactionType === "CARD_PURCHASE");

    const totalIncome = sumMoney(income.map((tx) => tx.amount));
    const totalExpenses = sumMoney(expenses.map((tx) => tx.amount));

    const byCategory = groupBy(expenses, (tx) => tx.categoryName ?? "Sin categoría", (tx) => tx.amount);
    const byAccount = groupBy(
      expenses.filter((tx) => tx.accountName),
      (tx) => tx.accountName as string,
      (tx) => tx.amount,
    );

    return {
      transactions: result.items,
      totalIncome: totalIncome.toString(),
      totalExpenses: totalExpenses.toString(),
      netCashFlow: totalIncome.minus(totalExpenses).toString(),
      byCategory,
      byAccount,
      truncated: result.total > REPORT_ROW_CAP,
    };
  }
}

function groupBy<T>(items: T[], keyFn: (item: T) => string, amountFn: (item: T) => string): { label: string; amount: string }[] {
  const totals = new Map<string, ReturnType<typeof sumMoney>>();
  for (const item of items) {
    const key = keyFn(item);
    totals.set(key, (totals.get(key) ?? sumMoney([])).plus(amountFn(item)));
  }
  return Array.from(totals.entries())
    .map(([label, amount]) => ({ label, amount: amount.toString() }))
    .sort((a, b) => Number(b.amount) - Number(a.amount));
}
