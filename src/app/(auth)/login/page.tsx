import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Iniciar sesión — STOKA Finance" };

export default function LoginPage() {
  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Bienvenido de nuevo</h1>
        <p className="text-sm text-muted-foreground">Inicia sesión para ver tus finanzas.</p>
      </div>
      <LoginForm />
    </div>
  );
}
