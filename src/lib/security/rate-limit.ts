import "server-only";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Rate limiting propio (auditoría de seguridad, SECURITY-02). Ventana
 * deslizante respaldada por Postgres (`fn_check_rate_limit`, ver
 * `supabase/migrations/0004_rate_limiting.sql`) — zero-cost, sin Redis ni
 * servicio externo. Pensado para los flujos de auth (login/registro/
 * forgot-password), que hoy sólo dependían del límite opaco de Supabase
 * Auth.
 */

/** IP del cliente vista por Vercel/el proxy (x-forwarded-for) o "unknown". */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

interface RateLimitCheck {
  /** Prefijo de la acción, ej. "login_email", "login_ip", "register_ip". */
  action: string;
  /** Identificador dentro de esa acción (email normalizado, IP, etc). */
  identifier: string;
  maxAttempts: number;
  windowSeconds: number;
}

/**
 * `true` = permitido. `false` = bloqueado por exceder el límite.
 *
 * Fail-secure: si la propia verificación falla (ej. la migración no está
 * aplicada, o Postgres no responde), se bloquea en vez de dejar pasar —
 * un rate limiter que "abre" cuando falla no sirve de nada.
 */
export async function checkRateLimit({ action, identifier, maxAttempts, windowSeconds }: RateLimitCheck): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const key = `${action}:${identifier.toLowerCase()}`;

  const { data, error } = await supabase.rpc("fn_check_rate_limit", {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) return false;
  return data === true;
}

/** Verifica el límite por IP Y por identificador (email) a la vez — ambos deben pasar. */
export async function checkAuthRateLimit(options: {
  action: string;
  email: string;
  emailMaxAttempts: number;
  ipMaxAttempts: number;
  windowSeconds: number;
}): Promise<boolean> {
  const ip = await getClientIp();
  const [emailOk, ipOk] = await Promise.all([
    checkRateLimit({
      action: `${options.action}_email`,
      identifier: options.email,
      maxAttempts: options.emailMaxAttempts,
      windowSeconds: options.windowSeconds,
    }),
    checkRateLimit({
      action: `${options.action}_ip`,
      identifier: ip,
      maxAttempts: options.ipMaxAttempts,
      windowSeconds: options.windowSeconds,
    }),
  ]);
  return emailOk && ipOk;
}
