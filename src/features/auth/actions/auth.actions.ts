"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appConfig } from "@/lib/config/app";
import { logger } from "@/lib/utils/logger";
import { checkAuthRateLimit } from "@/lib/security/rate-limit";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/features/auth/validations/auth.schema";

/** Mensaje genérico para cualquier bloqueo de rate limit — nunca revela cuál de los límites (IP/email) se alcanzó. */
const RATE_LIMITED_MESSAGE = "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";

/** Traduce errores conocidos de Supabase Auth a mensajes seguros en español. */
function mapAuthError(message: string): string {
  const known: Record<string, string> = {
    "Invalid login credentials": "Correo o contraseña incorrectos.",
    "Email not confirmed": "Debes confirmar tu correo antes de iniciar sesión.",
    "Password should be at least 6 characters": "La contraseña es demasiado corta.",
};
  return known[message] ?? "No pudimos completar la operación. Intenta nuevamente.";
}

export async function loginAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }

  // SECURITY-02: 8 intentos/email y 20 intentos/IP cada 5 minutos — frena
  // brute force/credential stuffing antes de siquiera llamar a Supabase Auth.
  const allowed = await checkAuthRateLimit({
    action: "login",
    email: parsed.data.email,
    emailMaxAttempts: 8,
    ipMaxAttempts: 20,
    windowSeconds: 300,
  });
  if (!allowed) {
    logger.warn("login_rate_limited", { email: parsed.data.email });
    return actionError(RATE_LIMITED_MESSAGE);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    logger.warn("login_failed", { reason: error.message });
    return actionError(mapAuthError(error.message));
  }

  redirect("/dashboard");
}

export async function registerAction(_prevState: unknown, formData: FormData): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  void formData;
  return actionError("El registro es por invitación después de confirmar el pago. Contáctanos desde la página de planes.");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return actionError("Ingresa un correo válido.", parsed.error.flatten().fieldErrors);
  }

  // SECURITY-02: 5/email y 10/IP cada hora. El mensaje de bloqueo no revela
  // si el correo existe (no depende de eso), así que es seguro devolverlo
  // explícito sin reabrir la enumeración que este action ya evita abajo.
  const allowed = await checkAuthRateLimit({
    action: "forgot_password",
    email: parsed.data.email,
    emailMaxAttempts: 5,
    ipMaxAttempts: 10,
    windowSeconds: 3600,
  });
  if (!allowed) {
    logger.warn("forgot_password_rate_limited", { email: parsed.data.email });
    return actionError(RATE_LIMITED_MESSAGE);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appConfig.url}/auth/callback?next=/reset-password`,
  });

  if (error) {
    // No revelar si el correo existe o no (evita enumeración de usuarios).
    logger.warn("forgot_password_failed", { reason: error.message });
  }

  return actionSuccess(undefined);
}

export async function resetPasswordAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    logger.warn("reset_password_failed", { reason: error.message });
    return actionError(mapAuthError(error.message));
  }

  redirect("/login?reset=success");
}
