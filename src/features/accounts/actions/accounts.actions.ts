"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { createAccountSchema, updateAccountSchema } from "@/features/accounts/validations/account.schema";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";
import { requireActiveSubscription } from "@/lib/access/require-subscription";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  requireActiveSubscription(user);
  return { supabase, user };
}

export async function createAccountAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createAccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }

  try {
    const { supabase, user } = await requireUser();
    const service = new AccountsService(supabase);
    await service.createAccount(user.id, parsed.data);
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_account_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos crear la cuenta. Intenta nuevamente.");
  }
}

export async function updateAccountAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = updateAccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }

  try {
    const { supabase } = await requireUser();
    const service = new AccountsService(supabase);
    await service.updateAccount(parsed.data);
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("update_account_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos actualizar la cuenta. Intenta nuevamente.");
  }
}

export async function archiveAccountAction(accountId: string): Promise<ActionResult<{ hadTransactions: boolean }>> {
  try {
    const { supabase } = await requireUser();
    const service = new AccountsService(supabase);
    const result = await service.archiveAccount(accountId);
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return actionSuccess(result);
  } catch (error) {
    logger.error("archive_account_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos archivar la cuenta. Intenta nuevamente.");
  }
}
