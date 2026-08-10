import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

/**
 * Intercambia el `code` de Supabase Auth (confirmación de email, magic link
 * o recuperación de contraseña) por una sesión, y redirige al destino
 * indicado en `next` (por defecto, el dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

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
