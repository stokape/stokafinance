"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";
import { RESET_CONFIRMATION_WORD, DELETE_ACCOUNT_CONFIRMATION_WORD } from "@/features/settings/constants";

/**
 * "Empezar de cero": borra todos los datos financieros del usuario vía
 * fn_reset_my_data (SECURITY DEFINER, ver 0008_reset_my_data.sql) y
 * conserva su cuenta/login. Irreversible — por eso exige escribir la
 * palabra de confirmación, no basta con un click.
 */
export async function resetMyDataAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== RESET_CONFIRMATION_WORD) {
    return actionError(`Escribe "${RESET_CONFIRMATION_WORD}" para confirmar.`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionError("Tu sesión expiró. Vuelve a iniciar sesión.");

  const { error } = await supabase.rpc("fn_reset_my_data");
  if (error) {
    logger.error("reset_my_data_failed", { userId: user.id, error: error.message });
    return actionError("No pudimos reiniciar tus datos. Intenta nuevamente.");
  }

  logger.info("reset_my_data_succeeded", { userId: user.id });
  revalidatePath("/", "layout");
  return actionSuccess(undefined);
}

/**
 * Cierra la cuenta: borra todos los datos (misma función que "reiniciar
 * mis datos") y LUEGO elimina el usuario de auth.users. El orden importa:
 * si se borrara auth.users primero, la cascada dispararía fn_write_audit_log
 * sobre cada tabla con un user_id que ya no existe en ese punto de la
 * transacción y fallaría por foreign key (bug real, encontrado y
 * documentado en docs/security-audit-2026-08-12.md) — borrando los datos
 * primero, cuando se borra auth.users ya no queda nada que hacer cascada.
 *
 * Requiere re-ingresar la contraseña (si el usuario tiene una — los que
 * sólo entran por Google no la tienen) además de la palabra de
 * confirmación: es la acción más irreversible de toda la app, así que la
 * sola sesión activa no basta como prueba de intención.
 */
export async function deleteAccountAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const confirmation = String(formData.get("confirmation") ?? "");
  const password = String(formData.get("password") ?? "");

  if (confirmation !== DELETE_ACCOUNT_CONFIRMATION_WORD) {
    return actionError(`Escribe "${DELETE_ACCOUNT_CONFIRMATION_WORD}" para confirmar.`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return actionError("Tu sesión expiró. Vuelve a iniciar sesión.");

  const hasPasswordIdentity = user.identities?.some((identity) => identity.provider === "email") ?? true;
  if (hasPasswordIdentity) {
    if (!password) return actionError("Ingresa tu contraseña para confirmar.");
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (reauthError) return actionError("Contraseña incorrecta.");
  }

  const { error: wipeError } = await supabase.rpc("fn_reset_my_data");
  if (wipeError) {
    logger.error("delete_account_wipe_failed", { userId: user.id, error: wipeError.message });
    return actionError("No pudimos eliminar tu cuenta. Intenta nuevamente.");
  }

  const admin = createSupabaseAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    logger.error("delete_account_failed", { userId: user.id, error: deleteError.message });
    return actionError("No pudimos eliminar tu cuenta. Ya se borraron tus datos; escríbenos para terminar de cerrarla.");
  }

  await supabase.auth.signOut();
  logger.info("account_deleted", { userId: user.id });
  return actionSuccess(undefined);
}
