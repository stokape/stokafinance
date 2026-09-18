"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/access/require-subscription";
import { RecurringTransactionsService } from "@/features/recurring-transactions/services/recurring-transactions.service";
import { createRecurringTransactionSchema } from "@/features/recurring-transactions/validations/recurring-transaction.schema";
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
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function createRecurringTransactionAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createRecurringTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new RecurringTransactionsService(supabase).createRecurring(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_recurring_transaction_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos crear la recurrencia. Intenta nuevamente.");
  }
}

export async function toggleRecurringTransactionAction(id: string, active: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    await new RecurringTransactionsService(supabase).setActive(id, active);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("toggle_recurring_transaction_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos actualizar la recurrencia. Intenta nuevamente.");
  }
}
