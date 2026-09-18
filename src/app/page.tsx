import type { Metadata } from "next";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HomeExperience } from "@/components/marketing/home-experience";
import { appConfig } from "@/lib/config/app";

const title = "Control financiero personal";
const description =
  "Entiende tu dinero hoy y anticipa lo que viene con cuentas, presupuestos, deudas, metas y proyecciones en un solo lugar.";

export const metadata: Metadata = {
  title,
  description,
  // Sin esto, "/" y variantes con query string/trailing slash compiten
  // entre sí por el mismo contenido ante un buscador.
  alternates: { canonical: "/" },
  openGraph: { title, description, url: appConfig.url },
  twitter: { title, description },
};

// Datos estructurados (schema.org) de la landing: qué es STOKA y cuánto
// cuesta, para que un buscador/IA pueda citarlo con precisión sin tener que
// inferirlo del HTML. Nada de FAQPage: Google retiró el rich result de FAQ
// para todos los sitios (7 may 2026) y ya no aporta nada en SERP.
function buildStructuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: appConfig.name,
      url: appConfig.url,
      logo: `${appConfig.url}/brand/stoka_finance_oscuro.jpg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: appConfig.name,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: appConfig.url,
      description,
      offers: [
        {
          "@type": "Offer",
          name: "Plan mensual",
          price: "24.90",
          priceCurrency: "PEN",
          url: `${appConfig.url}/#precios`,
        },
        {
          "@type": "Offer",
          name: "Plan anual",
          price: "199",
          priceCurrency: "PEN",
          url: `${appConfig.url}/#precios`,
        },
      ],
    },
  ];
}

export default async function RootPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // CSP con nonce por request (SECURITY-07, ver proxy.ts/layout.tsx) — sin
  // el nonce exacto de este request, el navegador bloquea igual este
  // <script> aunque sea JSON-LD inerte (script-src no distingue por type).
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildStructuredData()) }}
      />
      <HomeExperience isAuthenticated={Boolean(user)} />
    </>
  );
}
