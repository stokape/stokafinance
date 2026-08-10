import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Crear cuenta — STOKA Finance" };

export default function RegisterPage() {
  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Crea tu cuenta</h1>
        <p className="text-sm text-muted-foreground">Empieza a controlar tus finanzas hoy.</p>
      </div>
      <RegisterForm />
    </div>
  );
}
