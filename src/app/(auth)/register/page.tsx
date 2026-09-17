import type { Metadata } from "next";
import { connection } from "next/server";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

// SECURITY-07: fuerza render dinámico (ver login/page.tsx).
export default async function RegisterPage() {
  await connection();
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
