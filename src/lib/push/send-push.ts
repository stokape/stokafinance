import "server-only";
import webpush from "web-push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

export interface PushPayload {
  title: string;
  body: string;
  /** Ruta a la que navega la app al hacer click en la notificación. */
  url?: string;
}

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    logger.warn("push_not_configured", { reason: "Faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT" });
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Envía un push a TODOS los dispositivos suscritos de un usuario. Usa el
 * cliente admin (service_role) porque corre sin contexto de sesión del
 * usuario destinatario (se llama desde Server Actions de otros flujos o
 * desde el cron diario, nunca directamente por el propio usuario) — ver la
 * excepción documentada en lib/supabase/admin.ts.
 *
 * Si una suscripción devuelve 404/410 (expiró o el usuario desinstaló/
 * bloqueó notificaciones), se borra sola — así la tabla no acumula
 * suscripciones muertas indefinidamente.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; removed: number }> {
  if (!ensureConfigured()) return { sent: 0, removed: 0 };

  const admin = createSupabaseAdminClient();
  const { data: subscriptions, error } = await admin.from("push_subscriptions").select("id, endpoint, p256dh_key, auth_key").eq("user_id", userId);

  if (error) {
    logger.error("push_fetch_subscriptions_failed", { userId, error: error.message });
    return { sent: 0, removed: 0 };
  }

  let sent = 0;
  let removed = 0;

  await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
          JSON.stringify(payload),
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
          removed += 1;
        } else {
          logger.error("push_send_failed", { userId, error: err instanceof Error ? err.message : String(err) });
        }
      }
    }),
  );

  return { sent, removed };
}
