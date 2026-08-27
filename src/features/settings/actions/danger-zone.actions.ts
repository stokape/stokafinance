"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";

export const RESET_CONFIRMATION_WORD = "ELIMINAR";

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
