import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

/**
 * Valida que `next` sea una ruta relativa propia (SECURITY-10 — CWE-601).
 * `${origin}${next}` con un `next` sin validar es fráil ante open redirect:
 * hoy queda contenido porque `origin` va siempre como prefijo fijo (un
 * parser de URL estándar no puede reintroducir una autoridad nueva a partir
 * de ahí), pero no hay que depender de ese detalle de implementación —
 * cualquier valor que no sea una ruta relativa (`/algo`, nunca `//algo`,
 * que un navegador podría interpretar como protocol-relative) cae al
 * fallback seguro.
 */
export function resolveSafeNextPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

/**
 * Intercambia el `code` de Supabase Auth (confirmación de email, magic link
 * o recuperación de contraseña) por una sesión, y redirige al destino
 * indicado en `next` (por defecto, el dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = resolveSafeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    logger.warn("auth_callback_exchange_failed", { reason: error.message });
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
