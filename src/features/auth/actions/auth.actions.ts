"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appConfig } from "@/lib/config/app";
import { logger } from "@/lib/utils/logger";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/features/auth/validations/auth.schema";

/** Traduce errores conocidos de Supabase Auth a mensajes seguros en español. */
function mapAuthError(message: string): string {
  const known: Record<string, string> = {
    "Invalid login credentials": "Correo o contraseña incorrectos.",
    "User already registered": "Ya existe una cuenta con ese correo.",
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

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    logger.warn("login_failed", { reason: error.message });
    return actionError(mapAuthError(error.message));
  }

  redirect("/dashboard");
}

export async function registerAction(_prevState: unknown, formData: FormData): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        currency: appConfig.defaultCurrency,
        timezone: appConfig.defaultTimezone,
        locale: appConfig.defaultLocale,
      },
      emailRedirectTo: `${appConfig.url}/auth/callback`,
    },
  });

  if (error) {
    logger.warn("register_failed", { reason: error.message });
    return actionError(mapAuthError(error.message));
  }

  // Con confirmación de correo activada, `session` viene null hasta que el
  // usuario confirma. Sin confirmación (dev), ya queda logueado.
  if (data.session) {
    redirect("/onboarding");
  }

  return actionSuccess({ needsEmailConfirmation: true });
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
