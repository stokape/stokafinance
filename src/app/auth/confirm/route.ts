import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSafeNextPath } from "@/app/auth/callback/route";
import { logger } from "@/lib/utils/logger";

const ALLOWED_TYPES: EmailOtpType[] = ["invite", "recovery", "magiclink", "signup", "email_change", "email"];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const rawType = url.searchParams.get("type");
  const next = resolveSafeNextPath(url.searchParams.get("next"));

  if (tokenHash && rawType && ALLOWED_TYPES.includes(rawType as EmailOtpType)) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: rawType as EmailOtpType });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    logger.warn("auth_confirm_failed", { reason: error.message, type: rawType });
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback_failed&reason=invalid_invite", url.origin));
}
