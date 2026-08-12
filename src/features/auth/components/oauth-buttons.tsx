"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Ícono oficial de Google ("G" multicolor) — Supabase Auth no distingue
 * "login" de "registro" para OAuth: `signInWithOAuth` crea la cuenta si no
 * existe y la usa si ya existe, siempre. Por eso este componente es el
 * mismo en login-form.tsx y register-form.tsx.
 */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.87 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
    </svg>
  );
}

const PROVIDER_LABELS = {
  google: { label: "Continuar con Google", icon: GoogleIcon },
} as const;

type OAuthProvider = keyof typeof PROVIDER_LABELS;

/**
 * Botones de login social (§ preparado desde el inicio, ver docs/security.md
 * "Preparado para: Google OAuth..."). Sólo requieren activar el proveedor
 * en Supabase Dashboard → Authentication → Providers — cero cambios de
 * esquema ni de este componente.
 */
export function OAuthButtons({ providers }: { providers: OAuthProvider[] }) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  async function handleOAuth(provider: OAuthProvider) {
    setLoadingProvider(provider);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error("No pudimos conectar con el proveedor. Intenta nuevamente.");
      setLoadingProvider(null);
    }
    // Sin error: el SDK ya redirigió el navegador — no hay nada más que hacer aquí.
  }

  if (providers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o continúa con</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      {providers.map((provider) => {
        const { label, icon: Icon } = PROVIDER_LABELS[provider];
        return (
          <Button
            key={provider}
            type="button"
            variant="outline"
            className="w-full"
            isLoading={loadingProvider === provider}
            disabled={loadingProvider !== null && loadingProvider !== provider}
            onClick={() => handleOAuth(provider)}
          >
            <Icon /> {label}
          </Button>
        );
      })}
    </div>
  );
}
