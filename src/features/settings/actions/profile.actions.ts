"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/features/settings/validations/profile.schema";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";
import { requireActiveSubscription } from "@/lib/access/require-subscription";

export async function updateProfileAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionError("Tu sesión expiró. Vuelve a iniciar sesión.");
  requireActiveSubscription(user);

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
      monthly_income_estimate: parsed.data.monthlyIncomeEstimate || null,
    })
    .eq("id", user.id);

  if (error) {
    logger.error("update_profile_failed", { error: error.message });
    return actionError("No pudimos guardar los cambios. Intenta nuevamente.");
  }

  revalidatePath("/settings");
  return actionSuccess(undefined);
}
