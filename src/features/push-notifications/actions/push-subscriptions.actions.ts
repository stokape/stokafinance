"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";
import { requireActiveSubscription } from "@/lib/access/require-subscription";

interface PushSubscriptionJson {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Guarda (o reemplaza, si el endpoint ya existía) la suscripción push del dispositivo actual. */
export async function savePushSubscriptionAction(subscription: PushSubscriptionJson): Promise<ActionResult> {
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return actionError("Suscripción inválida.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionError("Tu sesión expiró. Vuelve a iniciar sesión.");
  requireActiveSubscription(user);

  const userAgent = (await headers()).get("user-agent");

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: userAgent,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    logger.error("save_push_subscription_failed", { userId: user.id, error: error.message });
    return actionError("No pudimos activar las notificaciones. Intenta nuevamente.");
  }

  return actionSuccess(undefined);
}

/** Borra la suscripción push del dispositivo actual (desactivar notificaciones). */
export async function deletePushSubscriptionAction(endpoint: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionError("Tu sesión expiró. Vuelve a iniciar sesión.");
  requireActiveSubscription(user);

  const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
  if (error) {
    logger.error("delete_push_subscription_failed", { userId: user.id, error: error.message });
    return actionError("No pudimos desactivar las notificaciones. Intenta nuevamente.");
  }

  return actionSuccess(undefined);
}
