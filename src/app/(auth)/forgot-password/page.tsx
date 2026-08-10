import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar contraseña — STOKA Finance" };

export default function ForgotPasswordPage() {
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
