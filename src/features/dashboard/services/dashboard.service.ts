import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, formatISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { Database } from "@/types/database.types";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { CategoriesService } from "@/features/categories/services/categories.service";
import { TransactionsService } from "@/features/transactions/services/transactions.service";
import { CreditCardsService } from "@/features/credit-cards/services/credit-cards.service";
import { BudgetsService } from "@/features/budgets/services/budgets.service";
import { LoansService } from "@/features/loans/services/loans.service";
import { BillsService } from "@/features/bills/services/bills.service";
import type { BillWithUrgency } from "@/features/bills/types/bill.types";
import { ForecastService } from "@/features/forecast/services/forecast.service";
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
  generateAlerts,
  type Alert,
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
  upcomingBills: BillWithUrgency[];
  alerts: Alert[];
  healthScore: ReturnType<typeof generateFinancialHealthScore>;
  hasAccounts: boolean;
}

/**
 * Orquesta Accounts + Transactions + Categories + CreditCards + Loans +
 * Budgets + Bills + Forecast y delega todo el cálculo al Financial Engine,
 * incluido el motor de alertas determinísticas (§26).
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
    const loansService = new LoansService(this.supabase);
    const billsService = new BillsService(this.supabase);

    const [accounts, categories, transactions, recent, creditCards, budgetOverview, loans, upcomingBills] = await Promise.all([
      accountsService.listAccounts(),
      categoriesService.getCategoriesWithSubcategories(),
      transactionsService.listForEngine(dateOnly(twelveMonthsAgoStart), dateOnly(currentMonthEnd)),
      transactionsService.listTransactions({ page: 1, pageSize: 8 }),
      creditCardsService.listCards(),
      budgetsService.getOverview(referenceDate.getFullYear(), referenceDate.getMonth() + 1),
      loansService.listLoans(),
      billsService.listUpcoming(30),
    ]);

    const totalBalance = sumMoney(accounts.map((a) => a.currentBalance));
    const totalCardDebt = sumMoney(creditCards.map((c) => c.currentDebt));
    const totalCardLimit = sumMoney(creditCards.map((c) => c.creditLimit));
    const totalLoanDebt = sumMoney(loans.map((l) => l.currentBalance));
    const totalDebt = totalCardDebt.plus(totalLoanDebt);
    const netWorth = calculateNetWorth(totalBalance, totalDebt);
    const creditUtilizationPercentage = totalCardLimit.greaterThan(0) ? totalCardDebt.dividedBy(totalCardLimit).times(100).toNumber() : 0;
    // Pagos mensuales de deuda: cuota fija de cada préstamo activo. Las
    // tarjetas no tienen "cuota" obligatoria fija en nuestro modelo (el
    // usuario decide cuánto pagar), así que no se suman aquí — evita
    // sobreestimar el ratio con un pago mínimo que no modelamos todavía.
    const monthlyLoanInstallments = sumMoney(loans.map((l) => l.installmentAmount));

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
    const debtToIncome = calculateDebtToIncome(monthlyLoanInstallments, currentRange.income);

    // Dinero ya reservado en categorías presupuestadas que aún no se gastó
    // (sólo la parte positiva: una categoría excedida no "libera" cupo a otra).
    const reservedBudget = sumMoney(budgetOverview.categories.map((c) => (Number(c.available) > 0 ? c.available : 0)));

    // Cuotas de préstamo que vencen dentro de los próximos 30 días (las
    // tarjetas aún no tienen fecha de vencimiento por statement modelada).
    const horizonEnd = dateOnly(addDays(referenceDate, 30));
    const upcomingDebtPayments = sumMoney(
      loans.filter((l) => l.nextDueDate && l.nextDueDate <= horizonEnd).map((l) => l.installmentAmount),
    );

    const upcomingObligatoryPayments = sumMoney(upcomingBills.map((b) => b.amount));

    const safeToSpendResult = calculateAvailableToSpend({
      liquidBalance: totalBalance,
      confirmedUpcomingIncome: 0,
      upcomingObligatoryPayments,
      upcomingDebtPayments,
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

    // Motor de alertas (§26): comparación de gasto por categoría vs. el
    // promedio de los 3 meses anteriores, reutilizando `transactions` (ya
    // trae 12 meses) para no disparar consultas nuevas.
    const categorySpending = categoryBreakdown.map(({ categoryId, categoryName, amount }) => {
      const monthlyAmounts = [1, 2, 3].map((i) => {
        const monthDate = subMonths(referenceDate, i);
        const totals = groupExpensesByCategory(transactions, dateOnly(startOfMonth(monthDate)), dateOnly(endOfMonth(monthDate)));
        return (totals.get(categoryId) ?? 0).toString();
      });
      const average = sumMoney(monthlyAmounts).dividedBy(3);
      return { categoryName, currentMonthAmount: amount, averageLastThreeMonths: average.toString() };
    });

    const upcomingPaymentsNext7Days = sumMoney(
      upcomingBills.filter((b) => b.dueDate <= dateOnly(addDays(referenceDate, 7))).map((b) => b.amount),
    );

    const previousSavings = calculateSavings(previousRange.income, previousRange.expenses);
    const previousSavingsRate = calculateSavingsRate(previousRange.income, previousSavings);

    const forecast = await new ForecastService(this.supabase).getForecast(30);

    const alerts = generateAlerts({
      categorySpending,
      creditCardUtilizations: creditCards.map((c) => ({
        cardName: c.name,
        utilizationPercentage: c.utilizationPercentage,
        alertThreshold: Number(c.utilizationAlertThreshold),
      })),
      upcomingPaymentsNext7Days: upcomingPaymentsNext7Days.toString(),
      forecastNegativeDate: forecast.negativeDates[0] ?? null,
      budgetOverages: budgetOverview.categories.filter((c) => c.status === "EXCEEDED").map((c) => ({ categoryName: c.categoryName, percentageUsed: c.percentageUsed })),
      currentSavingsRate: savingsRate.toNumber(),
      previousSavingsRate: previousSavingsRate.toNumber(),
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
      upcomingBills: upcomingBills.slice(0, 6),
      alerts,
      healthScore,
      hasAccounts: accounts.length > 0,
    };
  }
}
