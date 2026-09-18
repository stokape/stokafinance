"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/access/require-subscription";
import { BudgetsService } from "@/features/budgets/services/budgets.service";
import {
  removeBudgetCategorySchema,
  setBudgetCategorySchema,
  upsertBudgetSchema,
} from "@/features/budgets/validations/budget.schema";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  requireActiveSubscription(user);
  return { supabase, user };
}

export async function upsertBudgetAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = upsertBudgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new BudgetsService(supabase).upsertBudget(user.id, parsed.data);
    revalidatePath("/budgets");
    revalidatePath("/dashboard");
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("upsert_budget_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos guardar el presupuesto. Intenta nuevamente.");
  }
}

export async function setBudgetCategoryAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = setBudgetCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new BudgetsService(supabase).setCategoryAllocation(user.id, parsed.data);
    revalidatePath("/budgets");
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("set_budget_category_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos asignar el presupuesto a esa categoría. Intenta nuevamente.");
  }
}

export async function removeBudgetCategoryAction(budgetCategoryId: string): Promise<ActionResult> {
  const parsed = removeBudgetCategorySchema.safeParse({ budgetCategoryId });
  if (!parsed.success) return actionError("Solicitud inválida.");
  try {
    const { supabase } = await requireUser();
    await new BudgetsService(supabase).removeCategoryAllocation(parsed.data.budgetCategoryId);
    revalidatePath("/budgets");
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("remove_budget_category_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos quitar esa categoría del presupuesto. Intenta nuevamente.");
  }
}
