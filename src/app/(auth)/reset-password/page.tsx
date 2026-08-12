import type { Metadata } from "next";
import { connection } from "next/server";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Nueva contraseña — STOKA Finance" };

// SECURITY-07: fuerza render dinámico (ver login/page.tsx).
export default async function ResetPasswordPage() {
  await connection();
  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Elige una nueva contraseña</h1>
        <p className="text-sm text-muted-foreground">Debe tener al menos 8 caracteres.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
