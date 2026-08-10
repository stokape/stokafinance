import type { BudgetUsageResult } from "@/lib/financial-engine";

export interface Budget {
  id: string;
  userId: string;
  year: number;
  month: number;
  expectedIncome: string;
  savingsTarget: string;
}

export interface BudgetCategoryLine {
  id: string;
  categoryId: string;
  categoryName: string;
  allocated: string;
  spent: string;
  available: string;
  percentageUsed: number;
  status: BudgetUsageResult["status"];
}

export interface CategoryChoice {
  id: string;
  name: string;
}

export interface BudgetOverview {
  year: number;
  month: number;
  budgetId: string | null;
  expectedIncome: string;
  savingsTarget: string;
  actualIncome: string;
  totalAllocated: string;
  totalSpent: string;
  categories: BudgetCategoryLine[];
  unbudgetedCategories: CategoryChoice[];
}

export const BUDGET_STATUS_LABELS: Record<BudgetUsageResult["status"], string> = {
  NORMAL: "Normal",
  ATTENTION: "Atención",
  RISK: "Riesgo",
  EXCEEDED: "Excedido",
};
