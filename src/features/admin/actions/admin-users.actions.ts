"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin/authorization";
import { logger } from "@/lib/utils/logger";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";

const deleteUserSchema = z.object({
  userId: z.uuid(),
  targetEmail: z.email(),
  confirmation: z.email(),
});

async function prepareUserDeletion(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const steps = [
    () => admin.from("ledger_entries").delete().eq("user_id", userId),
    () => admin.from("transactions").delete().eq("user_id", userId),
    () => admin.from("credit_card_installment_plans").delete().eq("user_id", userId),
    () => admin.from("credit_card_transactions").delete().eq("user_id", userId),
    () => admin.from("credit_card_statements").delete().eq("user_id", userId),
    () => admin.from("loan_installments").delete().eq("user_id", userId),
    () => admin.from("recurring_transactions").delete().eq("user_id", userId),
    () => admin.from("bills").delete().eq("user_id", userId),
    () => admin.from("subscriptions").delete().eq("user_id", userId),
    () => admin.from("import_batches").delete().eq("user_id", userId),
    () => admin.from("goal_contributions").delete().eq("user_id", userId),
    () => admin.from("financial_goals").delete().eq("user_id", userId),
    () => admin.from("assets").delete().eq("user_id", userId),
    () => admin.from("liabilities").delete().eq("user_id", userId),
    () => admin.from("budget_categories").delete().eq("user_id", userId),
    () => admin.from("budgets").delete().eq("user_id", userId),
    () => admin.from("credit_cards").delete().eq("user_id", userId),
    () => admin.from("loans").delete().eq("user_id", userId),
    () => admin.from("accounts").delete().eq("user_id", userId),
    () => admin.from("subcategories").delete().eq("user_id", userId),
    () => admin.from("categories").delete().eq("user_id", userId),
    () => admin.from("financial_snapshots").delete().eq("user_id", userId),
    () => admin.from("push_subscriptions").delete().eq("user_id", userId),
    () => admin.from("whatsapp_connections").delete().eq("user_id", userId),
    // Los triggers anteriores pueden crear auditoría; siempre se limpia al final.
    () => admin.from("audit_logs").delete().eq("user_id", userId),
  ];

  for (const step of steps) {
    const { error } = await step();
    if (error) return error.message;
  }
  return null;
}

export async function deleteUserAsAdminAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: administrator },
  } = await supabase.auth.getUser();

  if (!administrator || !isAdminEmail(administrator.email)) {
    logger.warn("admin_delete_user_unauthorized", { actorId: administrator?.id ?? null });
    return actionError("No tienes permisos para administrar usuarios.");
  }

  const parsed = deleteUserSchema.safeParse({
    userId: formData.get("userId"),
    targetEmail: formData.get("targetEmail"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) return actionError("La confirmación no es válida.");

  const { userId, targetEmail, confirmation } = parsed.data;
  if (userId === administrator.id) {
    return actionError("Tu cuenta administradora no puede eliminarse desde este panel.");
  }
  if (confirmation.toLowerCase() !== targetEmail.toLowerCase()) {
    return actionError("Escribe exactamente el correo de la cuenta para confirmar.");
  }

  const admin = createSupabaseAdminClient();
  const { data: targetResult, error: targetError } = await admin.auth.admin.getUserById(userId);
  const trustedTarget = targetResult.user;
  if (targetError || !trustedTarget?.email) {
    return actionError("La cuenta ya no existe o no pudo verificarse.");
  }
  if (trustedTarget.email.toLowerCase() !== targetEmail.toLowerCase()) {
    logger.warn("admin_delete_user_email_mismatch", { actorId: administrator.id, targetId: userId });
    return actionError("La cuenta cambió desde que abriste el panel. Actualiza la página.");
  }
  if (isAdminEmail(trustedTarget.email)) {
    return actionError("Una cuenta administradora no puede eliminarse desde este panel.");
  }

  const cleanupError = await prepareUserDeletion(userId);
  if (cleanupError) {
    logger.error("admin_delete_user_cleanup_failed", {
      actorId: administrator.id,
      targetId: userId,
      error: cleanupError,
    });
    return actionError("No se pudieron limpiar los datos. La cuenta no fue eliminada.");
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    logger.error("admin_delete_user_auth_failed", {
      actorId: administrator.id,
      targetId: userId,
      error: deleteError.message,
    });
    return actionError("Los datos fueron limpiados, pero Auth no pudo eliminar la cuenta. Intenta nuevamente.");
  }

  logger.info("admin_user_deleted", {
    actorId: administrator.id,
    targetId: userId,
    targetEmail: trustedTarget.email,
  });
  revalidatePath("/admin/users");
  return actionSuccess(undefined);
}
