"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingService } from "@/features/onboarding/services/onboarding.service";
import { onboardingSchema } from "@/features/onboarding/validations/onboarding.schema";
import { actionError, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";

export async function completeOnboardingAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    await new OnboardingService(supabase).completeOnboarding(user.id, parsed.data);
  } catch (error) {
    logger.error("onboarding_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos completar la configuración inicial. Intenta nuevamente.");
  }

  redirect("/dashboard");
}
