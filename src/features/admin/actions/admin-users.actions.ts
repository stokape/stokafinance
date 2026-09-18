"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin/authorization";
import { logger } from "@/lib/utils/logger";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { appConfig } from "@/lib/config/app";
import {
  readSubscriptionMetadata,
  subscriptionMetadataForUpdate,
  todayInLima,
} from "@/lib/access/subscription";

const planSchema = z.enum(["monthly", "annual"]);
const paymentMethodSchema = z.enum(["yape", "transfer"]);
const paidThroughSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const subscriptionSchema = z.object({
  userId: z.uuid(),
  targetEmail: z.email(),
  plan: planSchema,
  paidThrough: paidThroughSchema,
  paymentMethod: paymentMethodSchema,
});

const inviteSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.email(),
  plan: planSchema,
  paidThrough: paidThroughSchema,
  paymentMethod: paymentMethodSchema,
});

const targetSchema = z.object({
  userId: z.uuid(),
  targetEmail: z.email(),
});

const deleteUserSchema = z.object({
  userId: z.uuid(),
  targetEmail: z.email(),
  confirmation: z.email(),
});

async function currentAdministrator() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user && isAdminEmail(user.email) ? user : null;
}

function validFutureDate(value: string): boolean {
  return value >= todayInLima() && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`));
}

export async function invitePaidUserAction(
  _previousState: ActionResult<{ inviteUrl: string }>,
  formData: FormData,
): Promise<ActionResult<{ inviteUrl: string }>> {
  const administrator = await currentAdministrator();
  if (!administrator) return actionError("No tienes permisos para administrar usuarios.");

  const parsed = inviteSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    plan: formData.get("plan"),
    paidThrough: formData.get("paidThrough"),
    paymentMethod: formData.get("paymentMethod"),
  });
  if (!parsed.success) return actionError("Revisa los datos de la invitación.", parsed.error.flatten().fieldErrors);
  if (!validFutureDate(parsed.data.paidThrough)) return actionError("La vigencia debe terminar hoy o en una fecha futura.");

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: parsed.data.email.toLowerCase(),
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error || !data.user || !data.properties.hashed_token) {
    logger.warn("admin_invite_user_failed", { actorId: administrator.id, reason: error?.message ?? "missing_user" });
    return actionError("No se pudo crear la invitación. Si la cuenta ya existe, búscala y activa su plan.");
  }

  const subscription = subscriptionMetadataForUpdate(parsed.data);
  const { error: updateError } = await admin.auth.admin.updateUserById(data.user.id, {
    app_metadata: { ...data.user.app_metadata, subscription },
  });
  if (updateError) {
    logger.error("admin_invite_subscription_failed", {
      actorId: administrator.id,
      targetId: data.user.id,
      error: updateError.message,
    });
    return actionError("La cuenta fue creada, pero falta activar el plan. Busca la cuenta y completa la activación.");
  }

  logger.info("admin_paid_user_invited", { actorId: administrator.id, targetId: data.user.id });
  revalidatePath("/admin/users");
  const inviteUrl = new URL("/auth/confirm", appConfig.url);
  inviteUrl.searchParams.set("token_hash", data.properties.hashed_token);
  inviteUrl.searchParams.set("type", "invite");
  inviteUrl.searchParams.set("next", "/reset-password");
  return actionSuccess({ inviteUrl: inviteUrl.toString() });
}

export async function updateUserSubscriptionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const administrator = await currentAdministrator();
  if (!administrator) return actionError("No tienes permisos para administrar usuarios.");

  const parsed = subscriptionSchema.safeParse({
    userId: formData.get("userId"),
    targetEmail: formData.get("targetEmail"),
    plan: formData.get("plan"),
    paidThrough: formData.get("paidThrough"),
    paymentMethod: formData.get("paymentMethod"),
  });
  if (!parsed.success) return actionError("Revisa los datos del plan.", parsed.error.flatten().fieldErrors);
  if (!validFutureDate(parsed.data.paidThrough)) return actionError("La vigencia debe terminar hoy o en una fecha futura.");

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(parsed.data.userId);
  const target = data.user;
  if (error || !target?.email || target.email.toLowerCase() !== parsed.data.targetEmail.toLowerCase()) {
    return actionError("La cuenta cambió o ya no existe. Actualiza la página.");
  }
  if (isAdminEmail(target.email)) return actionError("El acceso administrador no requiere un plan.");

  const previous = readSubscriptionMetadata(target.app_metadata);
  const subscription = subscriptionMetadataForUpdate({ ...parsed.data, previous });
  const { error: updateError } = await admin.auth.admin.updateUserById(target.id, {
    app_metadata: { ...target.app_metadata, subscription },
  });
  if (updateError) {
    logger.error("admin_subscription_update_failed", {
      actorId: administrator.id,
      targetId: target.id,
      error: updateError.message,
    });
    return actionError("No se pudo actualizar el plan. Intenta nuevamente.");
  }

  logger.info("admin_subscription_updated", { actorId: administrator.id, targetId: target.id });
  revalidatePath("/admin/users");
  return actionSuccess(undefined);
}

export async function suspendUserSubscriptionAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const administrator = await currentAdministrator();
  if (!administrator) return actionError("No tienes permisos para administrar usuarios.");

  const parsed = targetSchema.safeParse({
    userId: formData.get("userId"),
    targetEmail: formData.get("targetEmail"),
  });
  if (!parsed.success) return actionError("La cuenta no es válida.");

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(parsed.data.userId);
  const target = data.user;
  if (error || !target?.email || target.email.toLowerCase() !== parsed.data.targetEmail.toLowerCase()) {
    return actionError("La cuenta cambió o ya no existe. Actualiza la página.");
  }
  if (isAdminEmail(target.email)) return actionError("La cuenta administradora no puede suspenderse.");

  const previous = readSubscriptionMetadata(target.app_metadata);
  const subscription = {
    status: "suspended" as const,
    plan: previous?.plan ?? null,
    paid_through: previous?.paidThrough ?? null,
    payment_method: previous?.paymentMethod ?? null,
    activated_at: previous?.activatedAt ?? null,
    updated_at: new Date().toISOString(),
  };
  const { error: updateError } = await admin.auth.admin.updateUserById(target.id, {
    app_metadata: { ...target.app_metadata, subscription },
  });
  if (updateError) return actionError("No se pudo suspender la cuenta. Intenta nuevamente.");

  logger.info("admin_subscription_suspended", { actorId: administrator.id, targetId: target.id });
  revalidatePath("/admin/users");
  return actionSuccess(undefined);
}

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
