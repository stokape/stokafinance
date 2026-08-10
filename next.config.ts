import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseOrigin = (() => {
  try {
    return supabaseUrl ? new URL(supabaseUrl).origin : "";
  } catch {
    return "";
  }
})();

/**
 * Content-Security-Policy pragmática (§34/§49). `script-src` incluye
 * 'unsafe-inline' porque Next.js inyecta el payload de hidratación como
 * script inline sin nonce en esta configuración — endurecerlo a CSP basada
 * en nonce por request es una mejora de seguridad documentada pendiente
 * (requeriría generar el nonce en middleware y propagarlo a cada <Script>).
 * `connect-src`/`img-src` incluyen el origin de Supabase (auth + datos +
 * avatares futuros); sin URL configurada, la CSP simplemente no agrega ese
 * origin extra.
 */
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:" + (supabaseOrigin ? ` ${supabaseOrigin}` : ""),
  "font-src 'self' data:",
  "connect-src 'self'" + (supabaseOrigin ? ` ${supabaseOrigin}` : ""),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
