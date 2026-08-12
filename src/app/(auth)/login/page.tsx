import type { Metadata } from "next";
import { connection } from "next/server";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Iniciar sesión — STOKA Finance" };

// SECURITY-07: fuerza render dinámico — la CSP con nonce por request
// (proxy.ts) requiere que esta página se renderice en cada request, no una
// vez en build time (una página estática no tiene nonce que inyectar).
export default async function LoginPage() {
  await connection();
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
