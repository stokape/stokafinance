import { addDays, formatISO } from "date-fns";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/send-push";
import { formatMoney } from "@/lib/utils/money";
import { logger } from "@/lib/utils/logger";

/**
 * Cron diario (ver vercel.json) — único cron de toda la app. Todo lo demás
 * (transacciones recurrentes, cuotas de préstamo/tarjeta) sigue el patrón
 * "catch-up al abrir la app" sin cron (docs/costs.md), pero un push de
 * verdad tiene que poder llegar con la app CERRADA — no hay forma de
 * lograr eso sin algo que corra en un horario fijo. Vercel Cron es gratis
 * en el plan Hobby para triggers diarios (ver vercel.json).
 *
 * Avisa 3 días antes de que venza una factura o se renueve una
 * suscripción con auto-track. Match exacto de fecha (due_date/
 * next_payment_date = hoy + 3), así cada una sólo dispara una vez por
 * ciclo — no un recordatorio repetido todos los días hasta que venza.
 */
const REMINDER_DAYS_AHEAD = 3;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail-secure: sin secreto configurado, nadie pasa.
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const admin = createSupabaseAdminClient();
  const targetDate = formatISO(addDays(new Date(), REMINDER_DAYS_AHEAD), { representation: "date" });

  const [billsResult, subscriptionsResult] = await Promise.all([
    admin.from("bills").select("user_id, name, amount, currency").eq("due_date", targetDate).in("status", ["PENDING", "SCHEDULED"]),
    admin.from("subscriptions").select("user_id, name, amount, currency").eq("next_payment_date", targetDate).eq("active", true),
  ]);

  if (billsResult.error || subscriptionsResult.error) {
    logger.error("notify_upcoming_query_failed", {
      billsError: billsResult.error?.message,
      subscriptionsError: subscriptionsResult.error?.message,
    });
    return new Response(JSON.stringify({ error: "Error consultando pendientes" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  let sent = 0;

  for (const bill of billsResult.data ?? []) {
    const result = await sendPushToUser(bill.user_id, {
      title: "Factura por vencer",
      body: `${bill.name} — ${formatMoney(bill.amount, bill.currency)} vence en ${REMINDER_DAYS_AHEAD} días.`,
      url: "/bills",
    });
    sent += result.sent;
  }

  for (const subscription of subscriptionsResult.data ?? []) {
    const result = await sendPushToUser(subscription.user_id, {
      title: "Suscripción por renovarse",
      body: `${subscription.name} — ${formatMoney(subscription.amount, subscription.currency)} se cobra en ${REMINDER_DAYS_AHEAD} días.`,
      url: "/subscriptions",
    });
    sent += result.sent;
  }

  logger.info("notify_upcoming_completed", { bills: billsResult.data?.length ?? 0, subscriptions: subscriptionsResult.data?.length ?? 0, sent });

  return new Response(
    JSON.stringify({ bills: billsResult.data?.length ?? 0, subscriptions: subscriptionsResult.data?.length ?? 0, sent }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
