import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config/app";

// finance.stoka.pe SÍ tiene contenido público indexable: "/" es la landing
// comercial (producto, precios, FAQ — ver components/marketing/home-experience.tsx),
// pensada para traer tráfico orgánico. Antes este archivo bloqueaba el sitio
// entero ("disallow: /"), un bloqueo escrito cuando todavía no existía esa
// landing — al añadirla (mismo día) nadie vino a corregirlo, y quedó
// invisible para buscadores por meses. Lo que sí sigue siendo privado es
// todo lo que exige sesión (grupo (app) — dashboard, cuentas, movimientos,
// etc., ver PUBLIC_PATHS en src/lib/supabase/middleware.ts) y las pantallas
// de credenciales, que además ya llevan su propio `robots: noindex` en
// src/app/(auth)/layout.tsx — se listan aquí también para que los
// crawlers ni gasten presupuesto de rastreo intentando entrar.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: [
        "/dashboard",
        "/accounts",
        "/admin",
        "/bills",
        "/budgets",
        "/cards",
        "/forecast",
        "/goals",
        "/loans",
        "/net-worth",
        "/reports",
        "/settings",
        "/subscriptions",
        "/transactions",
        "/onboarding",
        "/account-status",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/auth",
        "/api",
      ],
    },
    sitemap: `${appConfig.url}/sitemap.xml`,
  };
}
