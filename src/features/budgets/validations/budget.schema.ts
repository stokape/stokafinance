import { z } from "zod";
import { moneyAmountSchema } from "@/lib/validations/money.schema";
import { requiredUuidSchema } from "@/lib/validations/select.schema";

export const upsertBudgetSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  expectedIncome: moneyAmountSchema({ allowZero: true }),
  savingsTarget: moneyAmountSchema({ allowZero: true }),
});
export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;

export const setBudgetCategorySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  categoryId: requiredUuidSchema("Selecciona una categoría"),
  allocatedAmount: moneyAmountSchema({ allowZero: true }),
});
export type SetBudgetCategoryInput = z.infer<typeof setBudgetCategorySchema>;

export const removeBudgetCategorySchema = z.object({
  budgetCategoryId: z.string().uuid(),
});
