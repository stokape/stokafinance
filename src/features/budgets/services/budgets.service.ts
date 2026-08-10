import type { SupabaseClient } from "@supabase/supabase-js";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import type { Database } from "@/types/database.types";
import { BudgetsRepository } from "../repositories/budgets.repository";
import { CategoriesService } from "@/features/categories/services/categories.service";
import { TransactionsService } from "@/features/transactions/services/transactions.service";
import { calculateBudgetUsage, calculateMonthlyIncome, groupExpensesByCategory } from "@/lib/financial-engine";
import { sumMoney } from "@/lib/utils/money";
import type { SetBudgetCategoryInput, UpsertBudgetInput } from "../validations/budget.schema";
import type { BudgetOverview } from "../types/budget.types";

function dateOnly(date: Date): string {
  return formatISO(date, { representation: "date" });
}

export class BudgetsService {
  private readonly repository: BudgetsRepository;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.repository = new BudgetsRepository(supabase);
  }

  /** RLS ya limita todo a las filas del usuario autenticado; no se necesita userId para lecturas. */
  async getOverview(year: number, month: number): Promise<BudgetOverview> {
    const categoriesService = new CategoriesService(this.supabase);
    const transactionsService = new TransactionsService(this.supabase);

    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(monthStart);

    const [budget, categories, transactions] = await Promise.all([
      this.repository.findByPeriod(year, month),
      categoriesService.getCategoriesWithSubcategories(),
      transactionsService.listForEngine(dateOnly(monthStart), dateOnly(monthEnd)),
    ]);

    const expenseCategories = categories.filter((c) => c.categoryType === "EXPENSE");
    const categoryNameById = new Map(expenseCategories.map((c) => [c.id, c.name]));
    const spentByCategory = groupExpensesByCategory(transactions, dateOnly(monthStart), dateOnly(monthEnd));
    const actualIncome = calculateMonthlyIncome(transactions, year, month);
    const totalSpent = sumMoney(Array.from(spentByCategory.values()));

    const allocations = budget ? await this.repository.listCategoryAllocations(budget.id) : [];
    const budgetedCategoryIds = new Set(allocations.map((a) => a.category_id));

    const categoryLines = allocations
      .map((allocation) => {
        const spent = spentByCategory.get(allocation.category_id) ?? 0;
        const usage = calculateBudgetUsage(allocation.allocated_amount, spent);
        return {
          id: allocation.id,
          categoryId: allocation.category_id,
          categoryName: categoryNameById.get(allocation.category_id) ?? "Categoría eliminada",
          allocated: usage.allocated.toString(),
          spent: usage.spent.toString(),
          available: usage.available.toString(),
          percentageUsed: usage.percentageUsed.toNumber(),
          status: usage.status,
        };
      })
      .sort((a, b) => b.percentageUsed - a.percentageUsed);

    const totalAllocated = sumMoney(allocations.map((a) => a.allocated_amount));

    return {
      year,
      month,
      budgetId: budget?.id ?? null,
      expectedIncome: budget?.expectedIncome ?? "0",
      savingsTarget: budget?.savingsTarget ?? "0",
      actualIncome: actualIncome.toString(),
      totalAllocated: totalAllocated.toString(),
      totalSpent: totalSpent.toString(),
      categories: categoryLines,
      unbudgetedCategories: expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id)).map((c) => ({ id: c.id, name: c.name })),
    };
  }

  async upsertBudget(userId: string, input: UpsertBudgetInput): Promise<void> {
    await this.repository.upsertBudget(userId, {
      year: input.year,
      month: input.month,
      expectedIncome: input.expectedIncome,
      savingsTarget: input.savingsTarget,
    });
  }

  /** Asigna (o reasigna) el presupuesto de una categoría, creando el presupuesto del mes si aún no existe. */
  async setCategoryAllocation(userId: string, input: SetBudgetCategoryInput): Promise<void> {
    let budget = await this.repository.findByPeriod(input.year, input.month);
    if (!budget) {
      budget = await this.repository.upsertBudget(userId, {
        year: input.year,
        month: input.month,
        expectedIncome: "0",
        savingsTarget: "0",
      });
    }
    await this.repository.setCategoryAllocation(userId, budget.id, input.categoryId, input.allocatedAmount);
  }

  removeCategoryAllocation(budgetCategoryId: string): Promise<void> {
    return this.repository.removeCategoryAllocation(budgetCategoryId);
  }
}
