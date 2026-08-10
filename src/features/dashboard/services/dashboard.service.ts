import type { SupabaseClient } from "@supabase/supabase-js";
import { formatISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { Database } from "@/types/database.types";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { CategoriesService } from "@/features/categories/services/categories.service";
import { TransactionsService } from "@/features/transactions/services/transactions.service";
import {
  calculateMonthlyCashFlow,
  calculateSavings,
  calculateSavingsRate,
  calculateCashFlowForRange,
  groupExpensesByCategory,
  calculateNetWorth,
  calculateEmergencyFundMonths,
  calculateDebtToIncome,
  calculateAvailableToSpend,
  generateFinancialHealthScore,
} from "@/lib/financial-engine";
import { sumMoney, toMoney } from "@/lib/utils/money";
import type { TransactionListItem } from "@/features/transactions/types/transaction.types";

function dateOnly(date: Date): string {
  return formatISO(date, { representation: "date" });
}

export interface MonthlyPoint {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  netCashFlow: number;
}

export interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  amount: number;
}

export interface DashboardData {
  totalBalance: string;
  netWorth: string;
  totalDebt: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  monthlyCashFlow: string;
  monthlySavings: string;
  savingsRatePercentage: number;
  previousMonthExpenses: string;
  expenseChangePercentage: number | null;
  safeToSpend: string;
  emergencyFundMonths: number;
  monthlyEvolution: MonthlyPoint[];
  categoryBreakdown: CategoryBreakdownItem[];
  recentTransactions: TransactionListItem[];
  healthScore: ReturnType<typeof generateFinancialHealthScore>;
  hasAccounts: boolean;
}

/**
 * Orquesta Accounts + Transactions + Categories y delega todo el cálculo al
 * Financial Engine. Los módulos de Tarjetas/Préstamos/Bills/Presupuesto
 * todavía no existen (ver roadmap), así que deuda/pagos próximos/presupuesto
 * se reportan honestamente en 0 / "sin configurar" — nunca con datos
 * inventados (§60).
 */
export class DashboardService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getDashboardData(referenceDate: Date = new Date()): Promise<DashboardData> {
    const accountsService = new AccountsService(this.supabase);
    const categoriesService = new CategoriesService(this.supabase);
    const transactionsService = new TransactionsService(this.supabase);

    const currentMonthStart = startOfMonth(referenceDate);
    const currentMonthEnd = endOfMonth(referenceDate);
    const twelveMonthsAgoStart = startOfMonth(subMonths(referenceDate, 11));

    const [accounts, categories, transactions, recent] = await Promise.all([
      accountsService.listAccounts(),
      categoriesService.getCategoriesWithSubcategories(),
      transactionsService.listForEngine(dateOnly(twelveMonthsAgoStart), dateOnly(currentMonthEnd)),
      transactionsService.listTransactions({ page: 1, pageSize: 8 }),
    ]);

    const totalBalance = sumMoney(accounts.map((a) => a.currentBalance));
    const totalDebt = toMoney(0); // Tarjetas/préstamos aún no implementados (roadmap Fase 6)
    const netWorth = calculateNetWorth(totalBalance, totalDebt);

    const currentRange = calculateCashFlowForRange(transactions, dateOnly(currentMonthStart), dateOnly(currentMonthEnd));
    const previousMonthStart = startOfMonth(subMonths(referenceDate, 1));
    const previousMonthEnd = endOfMonth(subMonths(referenceDate, 1));
    const previousRange = calculateCashFlowForRange(transactions, dateOnly(previousMonthStart), dateOnly(previousMonthEnd));

    const monthlyCashFlow = calculateMonthlyCashFlow(currentRange.income, currentRange.expenses);
    const monthlySavings = calculateSavings(currentRange.income, currentRange.expenses);
    const savingsRate = calculateSavingsRate(currentRange.income, monthlySavings);

    const expenseChangePercentage = previousRange.expenses.greaterThan(0)
      ? currentRange.expenses.minus(previousRange.expenses).dividedBy(previousRange.expenses).times(100).toNumber()
      : null;

    const categoryTotals = groupExpensesByCategory(transactions, dateOnly(currentMonthStart), dateOnly(currentMonthEnd));
    const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
    const categoryBreakdown: CategoryBreakdownItem[] = Array.from(categoryTotals.entries())
      .map(([categoryId, amount]) => ({
        categoryId,
        categoryName: (categoryId && categoryNameById.get(categoryId)) || "Sin categoría",
        amount: amount.toNumber(),
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthlyEvolution: MonthlyPoint[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const monthDate = subMonths(referenceDate, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const range = calculateCashFlowForRange(transactions, dateOnly(monthStart), dateOnly(monthEnd));
      monthlyEvolution.push({
        month: formatISO(monthStart, { representation: "date" }).slice(0, 7),
        income: range.income.toNumber(),
        expenses: range.expenses.toNumber(),
        netCashFlow: range.netCashFlow.toNumber(),
      });
    }

    const emergencyFundMonths = calculateEmergencyFundMonths(totalBalance, currentRange.expenses.greaterThan(0) ? currentRange.expenses : 1);
    const debtToIncome = calculateDebtToIncome(0, currentRange.income); // sin tarjetas/préstamos aún: 0 real

    const safeToSpendResult = calculateAvailableToSpend({
      liquidBalance: totalBalance,
      confirmedUpcomingIncome: 0,
      upcomingObligatoryPayments: 0, // Bills aún no implementado
      upcomingDebtPayments: 0, // Tarjetas/préstamos aún no implementados
      reservedBudget: 0, // Presupuesto aún no implementado
      minimumSavingsGoal: 0,
    });

    const healthScore = generateFinancialHealthScore({
      emergencyFundMonths: emergencyFundMonths.toNumber(),
      savingsRatePercentage: savingsRate.toNumber(),
      debtToIncomePercentage: debtToIncome.toNumber(),
      creditUtilizationPercentage: 0, // sin tarjetas aún
      budgetCompliancePercentage: 100, // sin presupuesto configurado: neutral
      netWorthGrowthPercentage: 0, // requiere financial_snapshots históricos (roadmap Fase 6)
    });

    return {
      totalBalance: totalBalance.toString(),
      netWorth: netWorth.toString(),
      totalDebt: totalDebt.toString(),
      monthlyIncome: currentRange.income.toString(),
      monthlyExpenses: currentRange.expenses.toString(),
      monthlyCashFlow: monthlyCashFlow.toString(),
      monthlySavings: monthlySavings.toString(),
      savingsRatePercentage: savingsRate.toNumber(),
      previousMonthExpenses: previousRange.expenses.toString(),
      expenseChangePercentage,
      safeToSpend: safeToSpendResult.safeToSpend.toString(),
      emergencyFundMonths: emergencyFundMonths.toNumber(),
      monthlyEvolution,
      categoryBreakdown,
      recentTransactions: recent.items,
      healthScore,
      hasAccounts: accounts.length > 0,
    };
  }
}
