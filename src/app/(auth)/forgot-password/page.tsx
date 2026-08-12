import type { Metadata } from "next";
import { connection } from "next/server";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar contraseña — STOKA Finance" };

// SECURITY-07: fuerza render dinámico (ver login/page.tsx).
export default async function ForgotPasswordPage() {
  await connection();
  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Recuperar contraseña</h1>
        <p className="text-sm text-muted-foreground">Te enviaremos un enlace a tu correo.</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
