import type { SupabaseClient } from "@supabase/supabase-js";
import { formatISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { Database } from "@/types/database.types";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { CategoriesService } from "@/features/categories/services/categories.service";
import { TransactionsService } from "@/features/transactions/services/transactions.service";
import { CreditCardsService } from "@/features/credit-cards/services/credit-cards.service";
import { BudgetsService } from "@/features/budgets/services/budgets.service";
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
import { sumMoney } from "@/lib/utils/money";
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
 * Orquesta Accounts + Transactions + Categories + CreditCards y delega todo
 * el cálculo al Financial Engine. Préstamos/Bills/Presupuesto todavía no
 * existen (ver roadmap), así que esa parte de la deuda/pagos próximos/
 * presupuesto se reporta honestamente en 0 / "sin configurar" — nunca con
 * datos inventados (§60).
 */
export class DashboardService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getDashboardData(referenceDate: Date = new Date()): Promise<DashboardData> {
    const accountsService = new AccountsService(this.supabase);
    const categoriesService = new CategoriesService(this.supabase);
    const transactionsService = new TransactionsService(this.supabase);
    const creditCardsService = new CreditCardsService(this.supabase);

    const currentMonthStart = startOfMonth(referenceDate);
    const currentMonthEnd = endOfMonth(referenceDate);
    const twelveMonthsAgoStart = startOfMonth(subMonths(referenceDate, 11));

    const budgetsService = new BudgetsService(this.supabase);

    const [accounts, categories, transactions, recent, creditCards, budgetOverview] = await Promise.all([
      accountsService.listAccounts(),
      categoriesService.getCategoriesWithSubcategories(),
      transactionsService.listForEngine(dateOnly(twelveMonthsAgoStart), dateOnly(currentMonthEnd)),
      transactionsService.listTransactions({ page: 1, pageSize: 8 }),
      creditCardsService.listCards(),
      budgetsService.getOverview(referenceDate.getFullYear(), referenceDate.getMonth() + 1),
    ]);

    const totalBalance = sumMoney(accounts.map((a) => a.currentBalance));
    // Préstamos aún no implementados (roadmap Fase 5); tarjetas sí, ya suman deuda real.
    const totalCardDebt = sumMoney(creditCards.map((c) => c.currentDebt));
    const totalCardLimit = sumMoney(creditCards.map((c) => c.creditLimit));
    const totalDebt = totalCardDebt;
    const netWorth = calculateNetWorth(totalBalance, totalDebt);
    const creditUtilizationPercentage = totalCardLimit.greaterThan(0) ? totalCardDebt.dividedBy(totalCardLimit).times(100).toNumber() : 0;

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
    const debtToIncome = calculateDebtToIncome(0, currentRange.income); // préstamos aún no implementados (Fase 5): 0 real

    // Dinero ya reservado en categorías presupuestadas que aún no se gastó
    // (sólo la parte positiva: una categoría excedida no "libera" cupo a otra).
    const reservedBudget = sumMoney(budgetOverview.categories.map((c) => (Number(c.available) > 0 ? c.available : 0)));

    const safeToSpendResult = calculateAvailableToSpend({
      liquidBalance: totalBalance,
      confirmedUpcomingIncome: 0,
      upcomingObligatoryPayments: 0, // Bills aún no implementado
      upcomingDebtPayments: 0, // requiere fecha de vencimiento por statement (Fase 5); hoy sólo se conoce el saldo total, no cuánto vence dentro del horizonte
      reservedBudget,
      minimumSavingsGoal: 0,
    });

    // Cumplimiento de presupuesto: 100% si está en/por debajo de lo asignado,
    // decae linealmente hasta 0% al llegar al doble del presupuesto de una
    // categoría. Sin categorías presupuestadas todavía: 100 neutral (§27).
    const budgetCompliancePercentage =
      budgetOverview.categories.length === 0
        ? 100
        : budgetOverview.categories.reduce((acc, c) => acc + Math.min(100, Math.max(0, 200 - c.percentageUsed)), 0) /
          budgetOverview.categories.length;

    const healthScore = generateFinancialHealthScore({
      emergencyFundMonths: emergencyFundMonths.toNumber(),
      savingsRatePercentage: savingsRate.toNumber(),
      debtToIncomePercentage: debtToIncome.toNumber(),
      creditUtilizationPercentage,
      budgetCompliancePercentage,
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
