"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/access/require-subscription";
import { GoalsService } from "@/features/goals/services/goals.service";
import { addContributionSchema, createGoalSchema } from "@/features/goals/validations/goal.schema";
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

function revalidateAfterMutation() {
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
}

export async function createGoalAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createGoalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new GoalsService(supabase).createGoal(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_goal_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos crear la meta. Intenta nuevamente.");
  }
}

export async function addContributionAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = addContributionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new GoalsService(supabase).addContribution(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("add_contribution_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos registrar el aporte. Intenta nuevamente.");
  }
}

export async function cancelGoalAction(goalId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    await new GoalsService(supabase).cancelGoal(goalId);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("cancel_goal_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos cancelar la meta. Intenta nuevamente.");
  }
}
