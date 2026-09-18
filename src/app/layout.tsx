import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, Manrope, Syne } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SentryClientInit } from "@/components/providers/sentry-client-init";
import { appConfig } from "@/lib/config/app";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const stokaBody = Manrope({
  variable: "--font-stoka-body",
  subsets: ["latin"],
});

const stokaDisplay = Syne({
  variable: "--font-stoka-display",
  subsets: ["latin"],
});

const defaultTitle = `${appConfig.name} — ${appConfig.tagline}`;
const defaultDescription = "Control integral de tus finanzas personales: cuentas, movimientos, presupuesto, deudas, metas y patrimonio en un solo lugar.";

export const metadata: Metadata = {
  // Requerido para que las URLs relativas de OG/canonical (acá y en
  // page.tsx) resuelvan al dominio real en vez de quedar relativas o
  // apuntar a localhost en el HTML servido.
  metadataBase: new URL(appConfig.url),
  title: {
    default: defaultTitle,
    template: `%s — ${appConfig.name}`,
  },
  description: defaultDescription,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: appConfig.name,
  },
  // Defaults de vista previa social (WhatsApp/Twitter/LinkedIn) — antes no
  // existían, así que compartir un link de STOKA no mostraba imagen ni
  // descripción. La landing (page.tsx) los sobreescribe con su propio
  // título/descripción; `images` sale automático del opengraph-image.tsx
  // co-ubicado en cada ruta (convención de archivo de Next.js).
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: appConfig.url,
    siteName: appConfig.name,
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d14" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // SECURITY-07: next-themes inyecta un <script> inline (evita el flash de
  // tema equivocado antes de hidratar) que no pasa por el mecanismo
  // automático de nonce de Next — hay que pasárselo explícito, o la CSP
  // con nonce (proxy.ts) lo bloquea.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="es" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${stokaBody.variable} ${stokaDisplay.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider nonce={nonce}>
          <SentryClientInit />
          {children}
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
