"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubscriptionsService } from "@/features/subscriptions/services/subscriptions.service";
import { createSubscriptionSchema } from "@/features/subscriptions/validations/subscription.schema";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return { supabase, user };
}

export async function createSubscriptionAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createSubscriptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new SubscriptionsService(supabase).createSubscription(user.id, parsed.data);
    revalidatePath("/subscriptions");
    revalidatePath("/dashboard");
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_subscription_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos crear la suscripción. Intenta nuevamente.");
  }
}

export async function cancelSubscriptionAction(subscriptionId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    await new SubscriptionsService(supabase).cancelSubscription(subscriptionId);
    revalidatePath("/subscriptions");
    revalidatePath("/dashboard");
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("cancel_subscription_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos cancelar la suscripción. Intenta nuevamente.");
  }
}
