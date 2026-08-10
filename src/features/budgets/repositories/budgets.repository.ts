import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Budget } from "../types/budget.types";

type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
type BudgetCategoryRow = Database["public"]["Tables"]["budget_categories"]["Row"];

function mapBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    userId: row.user_id,
    year: row.year,
    month: row.month,
    expectedIncome: row.expected_income,
    savingsTarget: row.savings_target,
  };
}

/** Único punto de acceso a Supabase para `budgets`/`budget_categories`. RLS filtra por user_id = auth.uid(). */
export class BudgetsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findByPeriod(year: number, month: number): Promise<Budget | null> {
    const { data, error } = await this.supabase.from("budgets").select("*").eq("year", year).eq("month", month).maybeSingle();
    if (error) throw error;
    return data ? mapBudget(data) : null;
  }

  /** Crea el presupuesto del mes si no existe, o actualiza expected_income/savings_target si ya existe. */
  async upsertBudget(userId: string, input: { year: number; month: number; expectedIncome: string; savingsTarget: string }): Promise<Budget> {
    const { data, error } = await this.supabase
      .from("budgets")
      .upsert(
        {
          user_id: userId,
          year: input.year,
          month: input.month,
          expected_income: input.expectedIncome,
          savings_target: input.savingsTarget,
        },
        { onConflict: "user_id,year,month" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return mapBudget(data);
  }

  async listCategoryAllocations(budgetId: string): Promise<BudgetCategoryRow[]> {
    const { data, error } = await this.supabase.from("budget_categories").select("*").eq("budget_id", budgetId);
    if (error) throw error;
    return data ?? [];
  }

  async setCategoryAllocation(userId: string, budgetId: string, categoryId: string, allocatedAmount: string): Promise<void> {
    const { error } = await this.supabase
      .from("budget_categories")
      .upsert(
        { user_id: userId, budget_id: budgetId, category_id: categoryId, allocated_amount: allocatedAmount },
        { onConflict: "budget_id,category_id" },
      );
    if (error) throw error;
  }

  async removeCategoryAllocation(budgetCategoryId: string): Promise<void> {
    const { error } = await this.supabase.from("budget_categories").delete().eq("id", budgetCategoryId);
    if (error) throw error;
  }
}
