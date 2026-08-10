import type { Metadata } from "next";
import { PiggyBank } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BudgetsService } from "@/features/budgets/services/budgets.service";
import { MonthNav } from "@/features/budgets/components/month-nav";
import { BudgetSummaryCard } from "@/features/budgets/components/budget-summary-card";
import { SetupBudgetDialog } from "@/features/budgets/components/setup-budget-dialog";
import { AddBudgetCategoryDialog } from "@/features/budgets/components/add-budget-category-dialog";
import { BudgetCategoryRow } from "@/features/budgets/components/budget-category-row";
import { EmptyState } from "@/components/feedback/empty-state";

export const metadata: Metadata = { title: "Presupuesto" };

interface BudgetsPageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const supabase = await createSupabaseServerClient();
  const overview = await new BudgetsService(supabase).getOverview(year, month);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Presupuesto</h1>
          <p className="text-sm text-muted-foreground">Asigna montos por categoría y compara contra lo real.</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthNav year={year} month={month} />
          <SetupBudgetDialog year={year} month={month} expectedIncome={overview.expectedIncome} savingsTarget={overview.savingsTarget} />
        </div>
      </div>

      <BudgetSummaryCard overview={overview} />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Categorías presupuestadas</h2>
        <AddBudgetCategoryDialog year={year} month={month} categories={overview.unbudgetedCategories} />
      </div>

      {overview.categories.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Aún no presupuestaste ninguna categoría"
          description="Agrega categorías de gasto con un monto asignado para ver tu cumplimiento este mes."
        />
      ) : (
        <div className="rounded-lg border border-border px-4">
          {overview.categories.map((line) => (
            <BudgetCategoryRow key={line.id} year={year} month={month} line={line} />
          ))}
        </div>
      )}
    </div>
  );
}
